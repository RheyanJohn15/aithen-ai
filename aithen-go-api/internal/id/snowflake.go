package id

import (
	"errors"
	"sync"
	"time"
)

const (
	// Epoch is set to 2024-01-01 00:00:00 UTC
	// You can adjust this to a more recent date to have smaller IDs
	epoch int64 = 1704067200000 // milliseconds since Unix epoch

	// NodeIDBits is the number of bits allocated for the node ID
	nodeIDBits uint8 = 10

	// SequenceBits is the number of bits allocated for the sequence number
	sequenceBits uint8 = 12

	// MaxNodeID is the maximum value for nodeID (2^10 - 1)
	maxNodeID int64 = -1 ^ (-1 << nodeIDBits)

	// MaxSequence is the maximum value for sequence (2^12 - 1)
	maxSequence int64 = -1 ^ (-1 << sequenceBits)

	// TimeShift is the number of bits to shift timestamp
	timeShift = nodeIDBits + sequenceBits

	// NodeShift is the number of bits to shift nodeID
	nodeShift = sequenceBits
)

var (
	// ErrInvalidNodeID is returned when nodeID is out of range
	ErrInvalidNodeID = errors.New("nodeID must be between 0 and 1023")
)

// Generator generates unique Snowflake IDs
type Generator struct {
	mu        sync.Mutex
	nodeID    int64
	sequence  int64
	timestamp int64
}

// NewGenerator creates a new Snowflake ID generator
// nodeID should be unique for each instance (0-1023)
func NewGenerator(nodeID int64) (*Generator, error) {
	if nodeID < 0 || nodeID > maxNodeID {
		return nil, ErrInvalidNodeID
	}

	return &Generator{
		nodeID:    nodeID,
		sequence:  0,
		timestamp: 0,
	}, nil
}

// Generate generates a new Snowflake ID
func (g *Generator) Generate() int64 {
	g.mu.Lock()
	defer g.mu.Unlock()

	now := time.Now().UnixMilli()

	if g.timestamp == now {
		// Same millisecond, increment sequence
		g.sequence = (g.sequence + 1) & maxSequence
		if g.sequence == 0 {
			// Sequence overflow, wait for next millisecond
			now = g.waitNextMillis(g.timestamp)
		}
	} else {
		// New millisecond, reset sequence
		g.sequence = 0
	}

	g.timestamp = now

	// Generate ID: (timestamp - epoch) << timeShift | nodeID << nodeShift | sequence
	id := ((now - epoch) << timeShift) |
		(g.nodeID << nodeShift) |
		g.sequence

	return id
}

// waitNextMillis waits until the next millisecond
func (g *Generator) waitNextMillis(lastTimestamp int64) int64 {
	timestamp := time.Now().UnixMilli()
	for timestamp <= lastTimestamp {
		timestamp = time.Now().UnixMilli()
	}
	return timestamp
}

// DefaultGenerator is a default instance with nodeID 1
// In production, you should use different nodeIDs for different instances
var DefaultGenerator *Generator

func init() {
	// Initialize default generator with nodeID 1
	// In production, set this from environment variable or config
	var err error
	DefaultGenerator, err = NewGenerator(1)
	if err != nil {
		panic(err)
	}
}

// Generate generates a new Snowflake ID using the default generator
func Generate() int64 {
	return DefaultGenerator.Generate()
}
