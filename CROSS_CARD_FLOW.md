# Cross-Card Flow Setup Guide

This guide explains how to create the ultra-flexible, cross-card wave flow effect demonstrated in the showcase section.

## The Effect

Each card has its own independent SoftPaper canvas and physics simulation, but the canvases are visually extended beyond their card boundaries. This creates the illusion that waves and cloth motion flow seamlessly from one card to another, while maintaining performant isolated physics simulations.

## CSS Setup

### 1. Card Wrapper Structure

```html
<div class="card-wrapper">
  <div class="showcase-card" id="my-card">
    <!-- Card content -->
  </div>
</div>
```

### 2. CSS for Overflow

```css
/* Card wrapper allows controlled canvas overflow */
.card-wrapper {
  position: relative;
  overflow: visible;
  z-index: 1;
}

.card-wrapper:hover {
  z-index: 10;  /* Bring to front on interaction */
}

.showcase-card {
  background: white;
  border-radius: 24px;
  padding: 45px;
  box-shadow: 0 30px 90px rgba(0,0,0,0.3);
  position: relative;
  transition: all 0.3s;
  overflow: visible;
}

/* Canvas physically extends beyond card boundaries */
.showcase-card canvas {
  position: absolute !important;
  top: -30px !important;
  left: -30px !important;
  width: calc(100% + 60px) !important;
  height: calc(100% + 60px) !important;
  pointer-events: auto;
}
```

**Key Points:**
- Canvas extends **30px in all directions** (60px total added to width/height)
- `overflow: visible` on both wrapper and card allows rendering outside bounds
- Z-index layering makes hover interactions feel natural
- `!important` overrides SoftPaper's default canvas positioning

## Physics Configuration

### Ultra-Flexible Flow Settings

```javascript
new SoftPaper(`#my-card`, {
  interactive: true,
  shadow: true,
  hoverEffect: true,
  
  // Grid density - more particles = smoother waves
  grid: { 
    cols: 15,    // 15 particles wide
    rows: 25     // 25 particles tall
  },
  
  // Core physics for silk-like flow
  gravity: 0.02,              // Very light (almost floating)
  stiffness: 0.25,            // Low = ultra flexible cloth
  damping: 0.995,             // High = butter smooth motion
  iterations: 16,             // More = more stable physics
  
  // Air & friction for smooth flow
  airResistance: 0.9995,      // Maximum air smoothness (0.999 - 0.9999)
  friction: 0.99,             // Low friction = easy movement
  
  // Interaction
  dragRadius: 50,             // Larger grab area
  tearThreshold: 8.0          // Hard to tear (continuous cloth)
});
```

### Physics Parameter Guide

| Parameter | Range | Effect | Recommended for Flow |
|-----------|-------|--------|---------------------|
| `stiffness` | 0.1 - 0.98 | Lower = more flexible | **0.20 - 0.30** |
| `damping` | 0.90 - 0.999 | Higher = smoother | **0.99 - 0.998** |
| `gravity` | 0.0 - 0.5 | Lower = lighter feel | **0.01 - 0.05** |
| `airResistance` | 0.99 - 0.9999 | Higher = smoother air flow | **0.999 - 0.9995** |
| `iterations` | 5 - 20 | More = more stable | **12 - 16** |
| `grid.cols` | 5 - 20 | More = smoother (slower) | **12 - 18** |
| `grid.rows` | 10 - 30 | More = smoother (slower) | **20 - 30** |

## Key Concepts

### Why Separate Canvases?

**Performance**: Each card has its own physics simulation that only calculates particles for that card. This is much faster than one giant simulation.

**Independence**: Cards can have different physics settings, behaviors, or animations without affecting each other.

**Scalability**: Adding/removing cards doesn't impact other cards' performance.

### How Overflow Creates Flow

The visual overlap is an illusion:
1. Each canvas renders 30px beyond its card
2. When a wave reaches the edge of Card A's physics, it's rendering in the overlap zone
3. Card B's overlapping canvas creates motion from its side
4. The brain perceives this as continuous flow!

### Z-Index Management

```css
.card-wrapper { z-index: 1; }
.card-wrapper:hover { z-index: 10; }
```

This ensures:
- Cards stack naturally in grid flow
- Hovered/dragged cards come to front
- No overlap conflicts during interaction

## Performance Tips

1. **Grid Size**: Don't go crazy with particles. 15x25 is plenty smooth.
2. **Iterations**: 16 is a sweet spot. More doesn't always help.
3. **Canvas Extension**: 30px is enough. More increases render area unnecessarily.
4. **Air Resistance**: Above 0.9995 the difference is negligible.

## Variations

### More Rigid Cloth
```javascript
{ stiffness: 0.5, damping: 0.98, gravity: 0.1 }
```

### Underwater Feel
```javascript
{ stiffness: 0.15, damping: 0.998, airResistance: 0.9998, gravity: 0.01 }
```

### Bouncy Fabric
```javascript
{ stiffness: 0.6, damping: 0.95, gravity: 0.08 }
```

### Perfect Silk
```javascript
{ stiffness: 0.25, damping: 0.995, airResistance: 0.9995, gravity: 0.02 }
// ⬆️ This is what the demo uses!
```

## Troubleshooting

**Q: Canvas extends too far outside cards?**  
A: Reduce the `-30px` offset and `calc(100% + 60px)` to smaller values like `-20px` and `calc(100% + 40px)`.

**Q: Not smooth enough?**  
A: Increase `damping` to 0.998 and `airResistance` to 0.9998. Add more particles if needed.

**Q: Too slow/laggy?**  
A: Reduce particle grid to 12x20, decrease `iterations` to 12.

**Q: Cloth tears too easily?**  
A: Increase `tearThreshold` to 10.0 or higher.

**Q: Doesn't feel like it flows between cards?**  
A: Make sure CSS `overflow: visible` is set on both wrapper and card. Check z-index layering.

## Live Demo

See it in action: `demo/index.html` (showcase section) or `demo/grid-overflow.html`

---

**Created**: February 24, 2026  
**Last Updated**: February 24, 2026
