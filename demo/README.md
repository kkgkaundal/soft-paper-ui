# Soft Paper UI - Full Page Demo

This directory contains demo files showcasing the Soft Paper UI library.

## Demo Files

### `full-page.html` - Complete Interactive Demo
A comprehensive, full-page demonstration featuring:
- **Hero Section**: 3 interactive cards with stats
- **Dashboard**: Analytics cards with metrics
- **Sticky Notes**: Color-coded notes with tear mechanics
- **Product Cards**: E-commerce style product showcases
- **Digital Receipts**: Interactive receipt displays
- **Live Controls**: Real-time physics parameter adjustments

### `index.html` - Feature Showcase
Original landing page with feature highlights and code examples.

## Running the Demos

### Option 1: Direct File Opening
Simply open any HTML file in your browser:
```bash
# Mac
open demo/full-page.html

# Linux
xdg-open demo/full-page.html

# Windows
start demo/full-page.html
```

### Option 2: Local Server (Recommended)
For better performance and to avoid CORS issues:

```bash
# Using Python
python -m http.server 8080
# Then visit: http://localhost:8080/demo/full-page.html

# Using Node.js (npx)
npx http-server -p 8080
# Then visit: http://localhost:8080/demo/full-page.html

# Using PHP
php -S localhost:8080
# Then visit: http://localhost:8080/demo/full-page.html
```

## Features Demonstrated

### Physics Features
- ✅ Verlet integration physics simulation
- ✅ Gravity and air resistance
- ✅ Boundary collision with friction
- ✅ Tear mechanics (constraints break when over-stretched)
- ✅ Wind oscillation effects
- ✅ Hover repulsion effects

### Interactions
- ✅ Drag and drop with momentum
- ✅ Mouse and touch support
- ✅ Real-time parameter adjustment
- ✅ Repair torn elements
- ✅ Reset functionality

### Performance
- ✅ 60 FPS on modern devices
- ✅ <5% CPU usage
- ✅ Efficient canvas rendering
- ✅ FPS monitoring

## Customization

The full-page demo includes a floating controls panel where you can:
- Adjust gravity (0 - 0.5)
- Modify stiffness (0.1 - 1.0)
- Change damping (0.5 - 0.99)
- Toggle wind effects
- Enable/disable hover effects
- Repair all tears
- Reset all elements

## Use Cases Shown

1. **Dashboard Cards** - Data visualization elements
2. **Sticky Notes** - Task management UI
3. **Product Cards** - E-commerce applications
4. **Receipts** - Digital receipt displays
5. **Hero Cards** - Landing page elements

## Browser Support
- Chrome/Edge (88+)
- Firefox (85+)
- Safari (14+)
- Mobile browsers with touch support

## Tips for Best Experience

1. **Drag Elements**: Click and drag any card/note/receipt
2. **Pull to Tear**: Pull elements hard to activate tear mechanics
3. **Hover Effects**: Move mouse near elements (without clicking)
4. **Experiment**: Use the controls panel to adjust physics
5. **Reset**: If things get messy, use the Reset All button

## Performance Notes

The demo initializes 21 physics simulations simultaneously:
- 3 Hero cards
- 4 Dashboard cards
- 6 Sticky notes
- 3 Product cards
- 4 Receipts
- 1 Controls panel

Despite this, it maintains 60 FPS thanks to optimized Verlet integration and efficient constraint solving.

## Next Steps

Check the code examples in `index.html` to learn how to integrate Soft Paper UI into your own projects!
