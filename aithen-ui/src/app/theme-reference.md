# Aithen AI Theme Reference

## Color Palette Usage

### Primary Colors (Teal/Aqua)
Use for primary actions, links, and brand elements:

```tsx
// Using CSS variables
className="bg-[var(--color-aithen-teal)]"
className="text-[var(--color-aithen-teal)]"
className="border-[var(--color-aithen-teal)]"

// Or use Tailwind utilities (if configured)
className="bg-aithen-teal"
className="text-aithen-teal"
```

### Secondary Colors (Gold)
Use sparingly for highlights and special elements:

```tsx
className="bg-[var(--color-aithen-gold)]"
className="text-[var(--color-aithen-gold)]"
```

### Base Colors (Navy/Charcoal)
Use for text and backgrounds:

```tsx
className="bg-[var(--color-aithen-navy)]"
className="text-[var(--color-aithen-navy)]"
```

## Font Usage

### Headings
Automatically use Outfit font:

```tsx
<h1>Heading uses Outfit</h1>
<h2>Subheading uses Outfit</h2>
```

### Body Text
Automatically uses Inter font (default):

```tsx
<p>Body text uses Inter</p>
```

### Custom Font Classes
```tsx
className="font-heading" // Outfit
className="font-body"    // Inter
className="font-mono"    // Space Mono
```

## Color Values

- **Primary Teal**: `#00C0C0`
- **Primary Teal Dark**: `#00A3A3`
- **Primary Teal Light**: `#33D0D0`
- **Secondary Gold**: `#FFD700`
- **Secondary Gold Dark**: `#FFB800`
- **Secondary Gold Light**: `#FFE44D`
- **Base Navy**: `#1A2B3C`
- **Base Navy Light**: `#2C3E50`

