import { Vec2 } from './Vec2';

/**
 * Particle class representing a point in the cloth simulation
 * Uses Verlet integration for physics
 */
export class Particle {
  public pos: Vec2;
  public oldPos: Vec2;
  public acceleration: Vec2;
  public pinned: boolean;

  constructor(x: number, y: number, pinned: boolean = false) {
    this.pos = new Vec2(x, y);
    this.oldPos = new Vec2(x, y);
    this.acceleration = new Vec2(0, 0);
    this.pinned = pinned;
  }

  /**
   * Update particle position using Verlet integration
   * @param damping - Damping factor (0-1) to reduce velocity over time
   */
  update(damping: number): void {
    if (this.pinned) return;

    // Verlet integration: pos += (pos - oldPos) * damping + acceleration
    const velocity = this.pos.sub(this.oldPos);
    this.oldPos = this.pos.clone();
    
    // Apply damping and acceleration
    this.pos = this.pos.add(velocity.scale(damping)).add(this.acceleration);
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0);
  }

  /**
   * Apply a force to this particle (adds to acceleration)
   */
  applyForce(force: Vec2): void {
    if (this.pinned) return;
    this.acceleration = this.acceleration.add(force);
  }

  /**
   * Pin this particle at its current position
   */
  pin(): void {
    this.pinned = true;
  }

  /**
   * Unpin this particle
   */
  unpin(): void {
    this.pinned = false;
  }

  /**
   * Move particle to a specific position (used for dragging)
   */
  moveTo(x: number, y: number): void {
    if (this.pinned) return;
    this.pos.set(x, y);
  }
}
