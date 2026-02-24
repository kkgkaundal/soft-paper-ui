# Getting Started with soft-paper-ui

## Quick Start

### Installation

```bash
npm install soft-paper-ui
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Soft Paper Demo</title>
</head>
<body>
  <div id="my-receipt" style="width: 300px; padding: 20px; background: white;">
    <h2>My Receipt</h2>
    <p>Item 1: $10.00</p>
    <p>Item 2: $15.00</p>
    <p>Total: $25.00</p>
  </div>

  <script type="module">
    import { SoftPaper } from 'soft-paper-ui';
    
    // Initialize with default options
    new SoftPaper('#my-receipt');
  </script>
</body>
</html>
```

### Custom Configuration

```javascript
import { SoftPaper } from 'soft-paper-ui';

const paper = new SoftPaper('#my-element', {
  // Grid resolution
  grid: { 
    cols: 12,  // More columns = smoother but slower
    rows: 24   // More rows = more drooping
  },
  
  // Physics parameters
  gravity: 0.25,     // Higher = faster falling
  stiffness: 0.9,    // Higher = less stretchy (0-1)
  damping: 0.95,     // Higher = less bouncy (0-1)
  iterations: 8,     // Higher = more stable but slower
  
  // Features
  interactive: true, // Enable mouse/touch dragging
  shadow: true,      // Show soft shadow
  wind: false,       // Enable wind effect
  windStrength: 0.08,
  windFrequency: 0.02,
  
  // Advanced
  dragRadius: 60,    // Interaction radius in pixels
  canvasScale: 1.0   // Canvas resolution scale
});
```

### Control Methods

```javascript
// Update physics at runtime
paper.updateConfig({
  gravity: 0.3,
  stiffness: 0.85
});

// Toggle wind effect
paper.setWind(true);  // Enable wind
paper.setWind(false); // Disable wind

// Check if wind is enabled
const hasWind = paper.isWindEnabled();

// Get current config
const config = paper.getConfig();
console.log(config.physics.gravity);

// Pause animation
paper.stop();

// Resume animation
paper.start();

// Clean up
paper.destroy();
```

## Tips

### Performance Tuning

For better performance on mobile:
```javascript
new SoftPaper('#element', {
  grid: { cols: 8, rows: 16 },  // Smaller grid
  iterations: 4,                 // Fewer iterations
  canvasScale: 0.8              // Lower resolution
});
```

For better quality:
```javascript
new SoftPaper('#element', {
  grid: { cols: 14, rows: 28 },  // Larger grid
  iterations: 10,                // More iterations
  canvasScale: 1.5               // Higher resolution
});
```

### Styling

The original element is hidden and replaced with a canvas. Make sure your element has:
- Defined dimensions (width/height)
- Visible content
- Good contrast for readability

### Best Use Cases

Soft Paper UI works best with:
- Receipt-like cards
- Documents
- Certificates
- Business cards
- Menu items
- Notes

## Browser Support

- Modern browsers with Canvas API support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Examples

See the `demo/index.html` file for a complete working example with interactive controls.

## Troubleshooting

**Canvas not showing?**
- Check that your element has defined dimensions
- Make sure the element is visible before initializing
- Check browser console for errors

**Performance issues?**
- Reduce grid size (cols/rows)
- Lower iteration count
- Reduce canvasScale
- Disable shadow

**Physics too bouncy/stiff?**
- Adjust damping (0.9-0.98 recommended)
- Adjust stiffness (0.8-0.95 recommended)
- Try different iteration counts (4-10)

## Need Help?

Check out the [full documentation](../README.md) or open an issue on GitHub.
