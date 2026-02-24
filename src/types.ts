/**
 * Core types and interfaces for the soft-paper-ui library
 */

/**
 * 2D point interface
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Grid configuration for the cloth simulation
 */
export interface GridConfig {
  cols: number;
  rows: number;
}

/**
 * Physics configuration options
 */
export interface PhysicsConfig {
  gravity: number;
  stiffness: number;
  damping: number;
  iterations: number;
}

/**
 * Main configuration options for SoftPaper
 */
export interface SoftPaperOptions {
  grid?: Partial<GridConfig>;
  gravity?: number;
  stiffness?: number;
  damping?: number;
  iterations?: number;
  interactive?: boolean;
  shadow?: boolean;
  wind?: boolean;
  windStrength?: number;
  windFrequency?: number;
  dragRadius?: number;
  canvasScale?: number;
}

/**
 * Internal particle state
 */
export interface ParticleState {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
}
