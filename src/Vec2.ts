/**
 * Tiny 2D vector helper class for physics calculations
 */
export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  /**
   * Add another vector to this vector
   */
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtract another vector from this vector
   */
  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  /**
   * Scale this vector by a scalar
   */
  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  /**
   * Get the length (magnitude) of this vector
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get the squared length (avoids sqrt for performance)
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize this vector to unit length
   */
  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return new Vec2(this.x / len, this.y / len);
  }

  /**
   * Get the distance to another vector
   */
  distanceTo(v: Vec2): number {
    return this.sub(v).length();
  }

  /**
   * Get the squared distance to another vector (avoids sqrt for performance)
   */
  distanceSquaredTo(v: Vec2): number {
    return this.sub(v).lengthSquared();
  }

  /**
   * Dot product with another vector
   */
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Create a copy of this vector
   */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  /**
   * Set the components of this vector
   */
  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
