# CSS Rendering and Drag Fixes

## Issues Fixed

### 1. **Elements Breaking/Tearing When Dragged** ❌ → ✅

**Problem**: When picking up elements with the mouse and dragging them, the physics mesh would "break" apart (constraints would tear).

**Root Cause**: The tear threshold was set too low (3.0x the rest length). During aggressive dragging, constraints would stretch beyond this threshold and permanently break.

**Solution**:
- Increased default `tearThreshold` from `3.0` to `10.0` (333% increase)
- Added support for `Infinity` to completely disable tearing if desired
- This prevents constraints from breaking during normal interaction

**Code Changes**:
```typescript
// Before
tearThreshold: options.tearThreshold ?? 3.0

// After  
tearThreshold: options.tearThreshold ?? 10.0  // Prevents breaking on drag
```

### 2. **CSS Styles Not Rendering Properly** ❌ → ✅

**Problem**: Element styles (backgrounds, borders, text, etc.) were not displaying correctly or at all in the physics simulation.

**Root Causes**:
1. Element visibility manipulation was interfering with layout
2. Text rendering was missing proper defaults for font properties
3. No support for rendering child images
4. Background images were not being detected

**Solutions**:
- ✅ Removed temporary visibility changes (read styles from existing element)
- ✅ Added comprehensive default values for all text properties
- ✅ Added `renderImages()` method to capture `<img>` tags
- ✅ Added background image detection
- ✅ Improved color fallback logic (white default for transparent)
- ✅ Added proper lineHeight handling (supports 'normal', numbers, and px values)

**Code Changes**:
```typescript
// Before
const computedStyle = window.getComputedStyle(this.element);
// Missing defaults, temporary visibility changes

// After
const computedStyle = window.getComputedStyle(this.element);
const fontSize = parseFloat(computedStyle.fontSize) || 14;
const fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
const fontWeight = computedStyle.fontWeight || 'normal';
const textColor = computedStyle.color || '#000000';
// + renderImages() method for <img> tags
```

## Enhanced Features

### Image Support
Now captures and renders `<img>` elements within the target element:
```html
<div class="soft-paper-element">
  <img src="icon.png" alt="Icon">
  <p>Text content</p>
</div>
```

### Better Line Height
Handles all CSS line-height formats:
- `normal` → 1.5x font size
- Numbers (e.g., `1.2`) → multiplier
- Pixels (e.g., `20px`) → exact value

### Robust Text Rendering
- ✅ Word wrapping with proper spacing
- ✅ Alignment support (left/center/right)
- ✅ Padding and content area calculation
- ✅ Multi-line text with empty line handling

## Usage Examples

### Disable Tearing Completely
```javascript
const softPaper = new SoftPaper('#my-element', {
  tearThreshold: Infinity  // Never tear
});
```

### Use Moderate Tearing
```javascript
const softPaper = new SoftPaper('#my-element', {
  tearThreshold: 5.0  // Tear at 5x stretch (more resistant than before)
});
```

### Enable Aggressive Tearing
```javascript
const softPaper = new SoftPaper('#my-element', {
  tearThreshold: 2.0  // Tear at 2x stretch (easier to rip)
});
```

## Testing Instructions

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Run the demo**:
   ```bash
   npm run demo
   ```

3. **Test dragging**:
   - Open `full-page.html` in browser
   - Click and drag any physics-enabled element
   - Element should NOT break apart during normal dragging
   - Element should maintain visual fidelity (colors, text, borders)

4. **Test CSS rendering**:
   - Check that backgrounds display correctly
   - Verify text is readable with proper fonts
   - Confirm borders and border-radius render
   - Check that images appear if present

## What Still Needs Work

### Not Yet Supported
- ❌ Complex CSS gradients (linear-gradient, radial-gradient)
- ❌ Box shadows and text shadows
- ❌ Advanced transforms
- ❌ SVG content
- ❌ Video/canvas elements

### Workarounds
For complex styling, consider:
1. Using solid colors instead of gradients
2. Pre-rendering complex elements as images
3. Simplifying layouts for physics-enabled elements
4. Keeping important content in simple text format

## Performance Notes

The increased tear threshold has **no performance impact**. The check happens once per constraint per physics update, and is just a simple number comparison.

Image rendering adds minimal overhead (only for elements with `<img>` tags).

## API Reference

### New/Updated Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tearThreshold` | number | 10.0 | Multiplier of rest length before constraint breaks. Use `Infinity` to disable. |

### Constraint Repair API

If you do want tearing enabled and need to repair broken constraints:

```javascript
// Get torn count
const tornCount = softPaper.getTornCount();

// Repair all tears
softPaper.repairTears();
```

## Migration Guide

If you were using the old version with `tearThreshold: 3.0`:

### No Action Needed
The new default (10.0) is better for most use cases and prevents accidental breaking.

### If You Want Old Behavior
```javascript
new SoftPaper('#element', {
  tearThreshold: 3.0  // Restore old behavior
});
```

### If You Want No Tearing
```javascript
new SoftPaper('#element', {
  tearThreshold: Infinity  // New: never tear
});
```
