import { Vec2 } from './Vec2.js';

/**
 * Particle class representing a point in the cloth simulation
 * Uses Verlet integration for physics with advanced features
 */
export class Particle {
  public pos: Vec2;
  public oldPos: Vec2;
  public originalPos: Vec2;  // Store original position for revert
  public acceleration: Vec2;
  public pinned: boolean;
  public mass: number;
  public radius: number;
  public friction: number;

  constructor(x: number, y: number, pinned: boolean = false, mass: number = 1.0) {
    this.pos = new Vec2(x, y);
    this.oldPos = new Vec2(x, y);
    this.originalPos = new Vec2(x, y);  // Remember starting position
    this.acceleration = new Vec2(0, 0);
    this.pinned = pinned;
    this.mass = mass;
    this.radius = 2;
    this.friction = 0.98;
  }

  /**
   * Update particle position using Verlet integration with advanced physics
   * @param damping - Damping factor (0-1) to reduce velocity over time
   * @param airResistance - Air resistance coefficient (0-1)
   */
  update(damping: number, airResistance: number = 0.99): void {
    if (this.pinned) return;

    // Verlet integration: pos += (pos - oldPos) * damping + acceleration
    const velocity = this.pos.sub(this.oldPos);
    
    // Apply air resistance based on velocity squared (more realistic)
    const speed = velocity.length();
    const airDrag = Math.max(0, 1 - (1 - airResistance) * speed);
    
    this.oldPos = this.pos.clone();
    
    // Apply damping, air resistance, and acceleration
    this.pos = this.pos
      .add(velocity.scale(damping * airDrag))
      .add(this.acceleration.scale(1 / this.mass));
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0);
  }

  /**
   * Get current velocity
   */
  getVelocity(): Vec2 {
    return this.pos.sub(this.oldPos);
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
