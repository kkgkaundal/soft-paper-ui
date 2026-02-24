/**
 * Advanced texture mapping utilities for cloth simulation
 * Implements proper perspective-correct texture mapping using triangles
 */

import { Vec2 } from './Vec2.js';

/**
 * Draw a textured triangle with proper perspective mapping
 * Uses affine transformation for each triangle
 */
export function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  // Triangle vertices in destination space
  p0: Vec2, p1: Vec2, p2: Vec2,
  // Triangle vertices in texture space
  t0: Vec2, t1: Vec2, t2: Vec2
): void {
  // Skip if texture is invalid or empty
  if (!texture || texture.width === 0 || texture.height === 0) {
    return;
  }
  
  // Calculate transformation matrix from texture space to destination space
  // Using affine transformation: [x', y'] = M * [x, y] + T
  
  // Set up the texture coordinates
  const x0 = t0.x, y0 = t0.y;
  const x1 = t1.x, y1 = t1.y;
  const x2 = t2.x, y2 = t2.y;
  
  // Set up the destination coordinates
  const u0 = p0.x, v0 = p0.y;
  const u1 = p1.x, v1 = p1.y;
  const u2 = p2.x, v2 = p2.y;
  
  // Calculate the transformation matrix
  // We need to solve: [u, v] = M * [x, y] + [tx, ty]
  // This gives us 6 equations for 6 unknowns (a, b, c, d, e, f)
  // where the transform is: u = a*x + c*y + e, v = b*x + d*y + f
  
  const denom = x0 * (y2 - y1) - x1 * y2 + x2 * y1 + (x1 - x2) * y0;
  
  if (Math.abs(denom) < 0.0001) {
    // Degenerate triangle - skip
    return;
  }
  
  const m11 = -(y0 * (u2 - u1) - y1 * u2 + y2 * u1 + (y1 - y2) * u0) / denom;
  const m12 = (x0 * (u2 - u1) - x1 * u2 + x2 * u1 + (x1 - x2) * u0) / denom;
  const m21 = -(y0 * (v2 - v1) - y1 * v2 + y2 * v1 + (y1 - y2) * v0) / denom;
  const m22 = (x0 * (v2 - v1) - x1 * v2 + x2 * v1 + (x1 - x2) * v0) / denom;
  const dx = (x0 * (y2 * u1 - y1 * u2) + y0 * (x1 * u2 - x2 * u1) + (x2 * y1 - x1 * y2) * u0) / denom;
  const dy = (x0 * (y2 * v1 - y1 * v2) + y0 * (x1 * v2 - x2 * v1) + (x2 * y1 - x1 * y2) * v0) / denom;
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.closePath();
  ctx.clip();
  
  try {
    // Apply the transformation and draw
    ctx.transform(m11, m21, m12, m22, dx, dy);
    ctx.drawImage(texture, 0, 0);
  } catch (e) {
    // Silently handle draw errors (invalid texture data, etc.)
    console.warn('Texture draw failed:', e);
  }
  
  ctx.restore();
}

/**
 * Draw a textured quad by splitting into two triangles
 * This provides proper texture warping for cloth simulation
 */
export function drawTexturedQuad(
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  // Quad corners in destination space (clockwise from top-left)
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  // Source rectangle in texture
  sx: number, sy: number, sw: number, sh: number
): void {
  // Define texture coordinates for the quad
  const t0 = new Vec2(sx, sy);
  const t1 = new Vec2(sx + sw, sy);
  const t2 = new Vec2(sx + sw, sy + sh);
  const t3 = new Vec2(sx, sy + sh);
  
  // Split quad into two triangles and render each
  // Triangle 1: top-left, top-right, bottom-right
  drawTexturedTriangle(ctx, texture, p0, p1, p2, t0, t1, t2);
  
  // Triangle 2: top-left, bottom-right, bottom-left
  drawTexturedTriangle(ctx, texture, p0, p2, p3, t0, t2, t3);
}
