import { Particle } from './Particle';

/**
 * Constraint class representing a distance constraint between two particles
 * Maintains a desired rest distance with configurable stiffness
 */
export class Constraint {
  private restLength: number;

  constructor(
    public p1: Particle,
    public p2: Particle,
    public stiffness: number = 1.0
  ) {
    // Calculate initial distance as rest length
    this.restLength = p1.pos.distanceTo(p2.pos);
  }

  /**
   * Solve the constraint by moving particles to satisfy distance
   * Uses position-based dynamics approach
   */
  solve(): void {
    // Skip if either particle is pinned (both pinned case)
    if (this.p1.pinned && this.p2.pinned) return;

    // Calculate current distance and difference from rest length
    const delta = this.p2.pos.sub(this.p1.pos);
    const currentLength = delta.length();
    
    // Avoid division by zero
    if (currentLength === 0) return;

    // Calculate correction needed
    const diff = (currentLength - this.restLength) / currentLength;
    const correction = delta.scale(diff * 0.5 * this.stiffness);

    // Apply correction to both particles (unless pinned)
    if (!this.p1.pinned && !this.p2.pinned) {
      // Both free: split correction equally
      this.p1.pos = this.p1.pos.add(correction);
      this.p2.pos = this.p2.pos.sub(correction);
    } else if (!this.p1.pinned) {
      // Only p1 is free: apply full correction to p1
      this.p1.pos = this.p1.pos.add(correction.scale(2));
    } else if (!this.p2.pinned) {
      // Only p2 is free: apply full correction to p2
      this.p2.pos = this.p2.pos.sub(correction.scale(2));
    }
  }

  /**
   * Get the current length of the constraint
   */
  getLength(): number {
    return this.p1.pos.distanceTo(this.p2.pos);
  }

  /**
   * Get the rest length of the constraint
   */
  getRestLength(): number {
    return this.restLength;
  }
}
