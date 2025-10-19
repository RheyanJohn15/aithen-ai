<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use GuzzleHttp\Client;

class AiService extends Controller
{
    private $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = config('ai.service_url');
    }

    /**
     * Stream chat response from AI service
     */
    public function streamChat(Request $request)
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality', 'aithen_core'),
            'max_tokens' => $request->input('max_tokens', 512),
            'stream' => true
        ];

        try {
            // Use Guzzle directly for proper streaming
            $client = new Client();
            $response = $client->post("{$this->aiServiceUrl}/chat", [
                'json' => $payload,
                'stream' => true,
                'timeout' => 60,
                'headers' => [
                    'Accept' => 'text/plain',
                    'Content-Type' => 'application/json',
                ]
            ]);
            
            return response()->stream(function () use ($response) {
                $body = $response->getBody();
                
                // Disable output buffering for real-time streaming
                if (ob_get_level()) {
                    ob_end_clean();
                }
                
                // Disable PHP output buffering
                while (ob_get_level()) {
                    ob_end_flush();
                }
                
                // Stream the response chunk by chunk
                while (!$body->eof()) {
                    $chunk = $body->read(1024);
                    if ($chunk !== '') {
                        echo $chunk;
                        flush();
                        if (function_exists('fastcgi_finish_request')) {
                            fastcgi_finish_request();
                        }
                        
                        // Optional: Add a small delay to prevent overwhelming the client
                        usleep(1000); // 1ms delay
                    }
                }
            }, 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'Cache-Control' => 'no-cache',
                'Connection' => 'keep-alive',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                'X-Accel-Buffering' => 'no', // Disable nginx buffering
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Stream chat response using Server-Sent Events (SSE)
     */
    public function streamChatSSE(Request $request)
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality', 'aithen_core'),
            'max_tokens' => $request->input('max_tokens', 512),
            'stream' => true
        ];

        try {
            $client = new Client();
            $response = $client->post("{$this->aiServiceUrl}/chat/stream", [
                'json' => $payload,
                'stream' => true,
                'timeout' => 60,
                'headers' => [
                    'Accept' => 'text/event-stream',
                    'Content-Type' => 'application/json',
                ]
            ]);
            
            return response()->stream(function () use ($response) {
                $body = $response->getBody();
                
                // Disable output buffering
                if (ob_get_level()) {
                    ob_end_clean();
                }
                
                // Disable PHP output buffering
                while (ob_get_level()) {
                    ob_end_flush();
                }
                
                // Stream the response
                while (!$body->eof()) {
                    $chunk = $body->read(1024);
                    if ($chunk !== '') {
                        echo $chunk;
                        flush();
                        if (function_exists('fastcgi_finish_request')) {
                            fastcgi_finish_request();
                        }
                        usleep(1000);
                    }
                }
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'Connection' => 'keep-alive',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                'X-Accel-Buffering' => 'no', // Disable nginx buffering
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Non-streaming chat response
     */
    public function chat(Request $request): JsonResponse
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality', 'aithen_core'),
            'max_tokens' => $request->input('max_tokens', 512),
            'stream' => false
        ];

        try {
            $response = Http::timeout(30)->post("{$this->aiServiceUrl}/chat", $payload);
            
            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to get AI response'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Get available personalities
     */
    public function personalities(): JsonResponse
    {
        try {
            $response = Http::timeout(10)->get("{$this->aiServiceUrl}/personalities");
            
            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to get personalities'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Get specific personality
     */
    public function getPersonality(string $id): JsonResponse
    {
        try {
            $response = Http::timeout(10)->get("{$this->aiServiceUrl}/personalities/{$id}");
            
            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Personality not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Health check for AI service
     */
    public function health(): JsonResponse
    {
        try {
            $response = Http::timeout(5)->get("{$this->aiServiceUrl}/");
            
            if ($response->successful()) {
                return response()->json([
                    'status' => 'healthy',
                    'ai_service' => 'connected',
                    'message' => 'AI service is running'
                ]);
            }

            return response()->json(['status' => 'unhealthy', 'ai_service' => 'disconnected'], 503);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy', 
                'ai_service' => 'disconnected',
                'error' => $e->getMessage()
            ], 503);
        }
    }
}
