# 🧻 soft-paper-ui

A lightweight, zero-dependency canvas-based physics simulation library that turns HTML elements into soft, draggable, gravity-affected "paper" with realistic curling and folding edges.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Pure 2D Canvas + Verlet Integration** - No WebGL, Three.js, or heavy physics engines
- ⚡ **Extremely Low CPU** - Target < 5% on modern devices during interaction
- 📦 **Zero Dependencies** - No external libraries required
- 🎮 **Interactive** - Mouse and touch drag support with realistic physics response
- 🎨 **Configurable** - Tunable gravity, stiffness, damping, and more
- 📱 **Mobile-Friendly** - Optimized for performance on mobile devices
- 🌬️ **Optional Wind Effect** - Gentle oscillation for breathing effect
- 📐 **Small Footprint** - Minimal code size for fast loading

## 🎬 Demo

Check out the [live demo](demo/index.html) to see it in action!

For a quick start guide, see [GETTING_STARTED.md](GETTING_STARTED.md).

## 📦 Installation

```bash
npm install soft-paper-ui
```

## 🚀 Quick Start

### ES Modules

```javascript
import { SoftPaper } from 'soft-paper-ui';

const receipt = document.querySelector('#my-receipt');
new SoftPaper(receipt, {
  grid: { cols: 10, rows: 20 },
  gravity: 0.18,
  stiffness: 0.85,
  damping: 0.92,
  interactive: true,
  shadow: true
});
```

### UMD (Browser)

```html
<script src="node_modules/soft-paper-ui/dist/index.umd.js"></script>
<script>
  const { SoftPaper } = SoftPaperUI;
  new SoftPaper('#my-receipt', {
    gravity: 0.18,
    stiffness: 0.85
  });
</script>
```

## 📖 API Reference

### Constructor

```typescript
new SoftPaper(element: HTMLElement | string, options?: SoftPaperOptions)
```

**Parameters:**
- `element` - HTML element or CSS selector string
- `options` - Configuration options (see below)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `grid.cols` | number | 10 | Number of columns in simulation grid |
| `grid.rows` | number | 20 | Number of rows in simulation grid |
| `gravity` | number | 0.18 | Gravity force applied to particles |
| `stiffness` | number | 0.85 | Constraint stiffness (0-1) |
| `damping` | number | 0.92 | Velocity damping (0-1) |
| `iterations` | number | 6 | Constraint solver iterations |
| `interactive` | boolean | true | Enable mouse/touch interaction |
| `shadow` | boolean | true | Render soft shadow under paper |
| `wind` | boolean | false | Enable wind oscillation |
| `windStrength` | number | 0.05 | Wind force magnitude |
| `windFrequency` | number | 0.02 | Wind oscillation frequency |
| `dragRadius` | number | 50 | Interaction radius in pixels |
| `canvasScale` | number | 1.0 | Canvas resolution scale |

### Methods

#### `start()`
Start the animation loop.

```javascript
paper.start();
```

#### `stop()`
Stop the animation loop.

```javascript
paper.stop();
```

#### `destroy()`
Clean up and remove the canvas, restore original element.

```javascript
paper.destroy();
```

#### `getConfig()`
Get current configuration.

```javascript
const config = paper.getConfig();
console.log(config.physics.gravity);
```

#### `updateConfig(config)`
Update physics configuration at runtime.

```javascript
paper.updateConfig({
  gravity: 0.25,
  stiffness: 0.9
});
```

## 🎨 Examples

### Basic Receipt

```html
<div id="receipt">
  <h2>Coffee Shop</h2>
  <p>Cappuccino: $4.50</p>
  <p>Total: $4.50</p>
</div>

<script type="module">
  import { SoftPaper } from 'soft-paper-ui';
  new SoftPaper('#receipt');
</script>
```

### Custom Physics

```javascript
new SoftPaper('#element', {
  grid: { cols: 12, rows: 24 },
  gravity: 0.25,
  stiffness: 0.9,
  damping: 0.95,
  iterations: 8,
  wind: true,
  windStrength: 0.08
});
```

### Dynamic Updates

```javascript
const paper = new SoftPaper('#element');

// Later, update physics
document.querySelector('#gravity-slider').addEventListener('input', (e) => {
  paper.updateConfig({ gravity: parseFloat(e.target.value) });
});
```

## 🏗️ Architecture

The library is built with a modular architecture:

- **Vec2** - 2D vector math utilities
- **Particle** - Point mass with Verlet integration
- **Constraint** - Distance constraint solver
- **SoftPaper** - Main class coordinating physics and rendering

### Physics Simulation

Uses Verlet integration for stable, efficient physics:

1. Apply forces (gravity, wind)
2. Update particle positions using Verlet integration
3. Solve constraints iteratively (4-8 iterations)
4. Render warped texture onto deformed mesh

### Rendering

- Captures HTML element to offscreen canvas
- Renders as textured quad mesh
- Each quad is transformed to match particle positions
- Optional soft shadow for depth

## ⚡ Performance

The library is optimized for minimal CPU usage:

- Small simulation grid (10×20 by default)
- Low iteration count (6 by default)
- Efficient constraint solving
- RequestAnimationFrame for smooth 60fps
- Touch/mouse events throttled
- Particles pooled and reused

Target performance:
- < 5% CPU on modern devices during interaction
- < 1% CPU when idle
- 60fps on mid-range mobile devices

## 🧪 Development

### Build

```bash
npm install
npm run build
```

### File Structure

```
soft-paper-ui/
├── src/
│   ├── types.ts        # TypeScript interfaces
│   ├── Vec2.ts         # 2D vector class
│   ├── Particle.ts     # Verlet particle
│   ├── Constraint.ts   # Distance constraint
│   ├── SoftPaper.ts    # Main library class
│   └── index.ts        # Barrel exports
├── dist/               # Build output
│   ├── esm/            # ES modules
│   ├── cjs/            # CommonJS
│   ├── index.umd.js    # UMD bundle
│   └── *.d.ts          # TypeScript definitions
├── demo/               # Demo page
└── package.json
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Credits

Inspired by cloth simulation techniques and position-based dynamics research.

## 📚 Resources

- [Verlet Integration](https://en.wikipedia.org/wiki/Verlet_integration)
- [Position Based Dynamics](https://matthias-research.github.io/pages/publications/posBasedDyn.pdf)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)