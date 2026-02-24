import { Particle } from './Particle.js';
import { Constraint } from './Constraint.js';
import { Vec2 } from './Vec2.js';
import { SoftPaperOptions, GridConfig, PhysicsConfig } from './types.js';

/**
 * Main SoftPaper class - creates a soft, draggable, gravity-affected paper effect
 * for any HTML element using canvas-based physics simulation
 */
export class SoftPaper {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  
  private particles: Particle[] = [];
  private constraints: Constraint[] = [];
  
  private gridConfig: GridConfig;
  private physicsConfig: PhysicsConfig;
  
  private interactive: boolean;
  private shadow: boolean;
  private wind: boolean;
  private windStrength: number;
  private windFrequency: number;
  private dragRadius: number;
  private canvasScale: number;
  
  private draggingParticle: Particle | null = null;
  private mousePos: Vec2 = new Vec2(0, 0);
  private windTime: number = 0;
  
  private width: number = 0;
  private height: number = 0;
  private spacingX: number = 0;
  private spacingY: number = 0;
  
  private animationFrame: number | null = null;
  private isDestroyed: boolean = false;

  constructor(element: HTMLElement | string, options: SoftPaperOptions = {}) {
    // Get element reference
    if (typeof element === 'string') {
      const el = document.querySelector(element);
      if (!el) throw new Error(`Element not found: ${element}`);
      this.element = el as HTMLElement;
    } else {
      this.element = element;
    }

    // Parse options with defaults
    this.gridConfig = {
      cols: options.grid?.cols ?? 10,
      rows: options.grid?.rows ?? 20
    };

    this.physicsConfig = {
      gravity: options.gravity ?? 0.18,
      stiffness: options.stiffness ?? 0.85,
      damping: options.damping ?? 0.92,
      iterations: options.iterations ?? 6
    };

    this.interactive = options.interactive ?? true;
    this.shadow = options.shadow ?? true;
    this.wind = options.wind ?? false;
    this.windStrength = options.windStrength ?? 0.05;
    this.windFrequency = options.windFrequency ?? 0.02;
    this.dragRadius = options.dragRadius ?? 50;
    this.canvasScale = options.canvasScale ?? 1.0;

    // Create canvas overlay
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Create offscreen canvas for element texture
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    // Initialize
    this.setupCanvas();
    this.captureElement();
    this.initPhysics();
    this.setupInteraction();
    this.start();
  }

  /**
   * Setup canvas overlay on top of the element
   */
  private setupCanvas(): void {
    const rect = this.element.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Set canvas size
    this.canvas.width = this.width * this.canvasScale;
    this.canvas.height = this.height * this.canvasScale;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    // Position canvas over element
    const position = window.getComputedStyle(this.element).position;
    if (position === 'static') {
      this.element.style.position = 'relative';
    }
    
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = this.interactive ? 'auto' : 'none';
    this.canvas.style.touchAction = 'none';
    
    // Hide original element (we'll render it on canvas)
    this.element.style.visibility = 'hidden';
    
    // Insert canvas after element
    this.element.parentNode?.insertBefore(this.canvas, this.element.nextSibling);
  }

  /**
   * Capture the element as a texture on offscreen canvas
   */
  private captureElement(): void {
    const rect = this.element.getBoundingClientRect();
    this.offscreenCanvas.width = rect.width;
    this.offscreenCanvas.height = rect.height;

    // Temporarily show element to capture it
    this.element.style.visibility = 'visible';
    
    // Use html2canvas-like approach: draw element to canvas
    // For now, we'll use a simple approach with drawImage on the element
    // In production, you might want to use a proper HTML-to-canvas library
    
    // Draw white background
    this.offscreenCtx.fillStyle = '#ffffff';
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    
    // Draw element text content (simplified approach)
    this.offscreenCtx.fillStyle = '#000000';
    this.offscreenCtx.font = '14px Arial';
    this.offscreenCtx.textAlign = 'center';
    this.offscreenCtx.textBaseline = 'middle';
    
    const text = this.element.textContent || 'Soft Paper';
    const lines = text.split('\n').filter(l => l.trim());
    const lineHeight = 20;
    const startY = (this.offscreenCanvas.height - lines.length * lineHeight) / 2;
    
    lines.forEach((line, i) => {
      this.offscreenCtx.fillText(
        line.trim(),
        this.offscreenCanvas.width / 2,
        startY + i * lineHeight
      );
    });
    
    // Hide element again
    this.element.style.visibility = 'hidden';
  }

  /**
   * Initialize physics simulation grid
   */
  private initPhysics(): void {
    const { cols, rows } = this.gridConfig;
    
    this.spacingX = this.width / (cols - 1);
    this.spacingY = this.height / (rows - 1);

    // Create particle grid
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * this.spacingX;
        const py = y * this.spacingY;
        const pinned = y === 0; // Pin top row
        this.particles.push(new Particle(px, py, pinned));
      }
    }

    // Create constraints
    // Horizontal constraints
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i1 = y * cols + x;
        const i2 = y * cols + (x + 1);
        this.constraints.push(
          new Constraint(this.particles[i1], this.particles[i2], this.physicsConfig.stiffness)
        );
      }
    }

    // Vertical constraints
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const i1 = y * cols + x;
        const i2 = (y + 1) * cols + x;
        this.constraints.push(
          new Constraint(this.particles[i1], this.particles[i2], this.physicsConfig.stiffness)
        );
      }
    }

    // Diagonal constraints for extra stability (optional but recommended)
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i1 = y * cols + x;
        const i2 = (y + 1) * cols + (x + 1);
        const i3 = y * cols + (x + 1);
        const i4 = (y + 1) * cols + x;
        
        this.constraints.push(
          new Constraint(this.particles[i1], this.particles[i2], this.physicsConfig.stiffness * 0.5)
        );
        this.constraints.push(
          new Constraint(this.particles[i3], this.particles[i4], this.physicsConfig.stiffness * 0.5)
        );
      }
    }
  }

  /**
   * Setup mouse/touch interaction
   */
  private setupInteraction(): void {
    if (!this.interactive) return;

    const getPos = (e: MouseEvent | TouchEvent): Vec2 => {
      const rect = this.canvas.getBoundingClientRect();
      if (e instanceof MouseEvent) {
        return new Vec2(e.clientX - rect.left, e.clientY - rect.top);
      } else {
        const touch = e.touches[0];
        return new Vec2(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      this.mousePos = getPos(e);
      
      // Find closest particle within drag radius
      let closest: Particle | null = null;
      let minDist = this.dragRadius;
      
      for (const p of this.particles) {
        if (p.pinned) continue;
        const dist = p.pos.distanceTo(this.mousePos);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      
      this.draggingParticle = closest;
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.draggingParticle) return;
      e.preventDefault();
      this.mousePos = getPos(e);
    };

    const onEnd = () => {
      this.draggingParticle = null;
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', onStart);
    this.canvas.addEventListener('mousemove', onMove);
    this.canvas.addEventListener('mouseup', onEnd);
    this.canvas.addEventListener('mouseleave', onEnd);

    // Touch events
    this.canvas.addEventListener('touchstart', onStart, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
    this.canvas.addEventListener('touchend', onEnd);
    this.canvas.addEventListener('touchcancel', onEnd);
  }

  /**
   * Physics update step
   */
  private updatePhysics(): void {
    // Apply gravity
    const gravity = new Vec2(0, this.physicsConfig.gravity);
    for (const p of this.particles) {
      p.applyForce(gravity);
    }

    // Apply wind oscillation if enabled
    if (this.wind) {
      this.windTime += this.windFrequency;
      const windX = Math.sin(this.windTime) * this.windStrength;
      const windForce = new Vec2(windX, 0);
      
      for (const p of this.particles) {
        if (!p.pinned) {
          p.applyForce(windForce);
        }
      }
    }

    // Drag interaction
    if (this.draggingParticle) {
      // Smoothly move particle towards mouse
      const delta = this.mousePos.sub(this.draggingParticle.pos);
      this.draggingParticle.pos = this.draggingParticle.pos.add(delta.scale(0.5));
    }

    // Verlet integration
    for (const p of this.particles) {
      p.update(this.physicsConfig.damping);
    }

    // Solve constraints multiple times
    for (let i = 0; i < this.physicsConfig.iterations; i++) {
      for (const c of this.constraints) {
        c.solve();
      }
    }
  }

  /**
   * Render the cloth with warped texture
   */
  private render(): void {
    const ctx = this.ctx;
    const { cols, rows } = this.gridConfig;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply canvas scale
    ctx.save();
    ctx.scale(this.canvasScale, this.canvasScale);

    // Draw shadow if enabled
    if (this.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      
      // Draw shadow shape (simplified as filled polygon)
      ctx.beginPath();
      for (let y = 0; y < rows; y++) {
        const x = y === 0 ? 0 : cols - 1;
        const i = y * cols + x;
        const p = this.particles[i];
        if (y === 0) {
          ctx.moveTo(p.pos.x, p.pos.y);
        } else {
          ctx.lineTo(p.pos.x, p.pos.y);
        }
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      ctx.restore();
    }

    // Render cloth by drawing warped horizontal strips
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i1 = y * cols + x;
        const i2 = y * cols + (x + 1);
        const i3 = (y + 1) * cols + (x + 1);
        const i4 = (y + 1) * cols + x;

        const p1 = this.particles[i1];
        const p2 = this.particles[i2];
        const p3 = this.particles[i3];
        const p4 = this.particles[i4];

        // Calculate source rectangle in texture
        const sx = x * this.spacingX;
        const sy = y * this.spacingY;
        const sw = this.spacingX;
        const sh = this.spacingY;

        // Draw quad as two triangles with texture mapping
        // This is a simplified approach - draw as textured quad
        this.drawTexturedQuad(
          ctx,
          p1.pos, p2.pos, p3.pos, p4.pos,
          sx, sy, sw, sh
        );
      }
    }

    ctx.restore();
  }

  /**
   * Draw a textured quad (simplified approach using transform)
   */
  private drawTexturedQuad(
    ctx: CanvasRenderingContext2D,
    p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2,
    sx: number, sy: number, sw: number, sh: number
  ): void {
    // Use a simplified approach: draw the texture piece and apply transform
    // This is an approximation - proper texture mapping would require WebGL
    
    ctx.save();
    
    // Calculate center point
    const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
    const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
    
    // Calculate average scale
    const width = (p2.x - p1.x + p3.x - p4.x) / 2;
    const height = (p4.y - p1.y + p3.y - p2.y) / 2;
    const scaleX = width / sw;
    const scaleY = height / sh;
    
    // Apply transform
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    
    // Draw texture piece
    try {
      ctx.drawImage(
        this.offscreenCanvas,
        sx, sy, sw, sh,
        -sw / 2, -sh / 2, sw, sh
      );
    } catch (e) {
      // Fallback: draw colored quad
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    }
    
    ctx.restore();
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (this.isDestroyed) return;

    this.updatePhysics();
    this.render();

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  /**
   * Start the animation
   */
  public start(): void {
    if (this.animationFrame !== null) return;
    this.animate();
  }

  /**
   * Stop the animation
   */
  public stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Destroy the instance and clean up
   */
  public destroy(): void {
    this.stop();
    this.isDestroyed = true;
    
    // Remove canvas
    this.canvas.remove();
    
    // Restore element visibility
    this.element.style.visibility = 'visible';
    
    // Clear references
    this.particles = [];
    this.constraints = [];
  }

  /**
   * Get current configuration
   */
  public getConfig(): { grid: GridConfig; physics: PhysicsConfig } {
    return {
      grid: { ...this.gridConfig },
      physics: { ...this.physicsConfig }
    };
  }

  /**
   * Update physics configuration
   */
  public updateConfig(config: Partial<PhysicsConfig>): void {
    Object.assign(this.physicsConfig, config);
    
    // Update constraint stiffness if changed
    if (config.stiffness !== undefined) {
      for (const c of this.constraints) {
        c.stiffness = config.stiffness;
      }
    }
  }

  /**
   * Toggle wind effect on/off
   */
  public setWind(enabled: boolean): void {
    this.wind = enabled;
  }

  /**
   * Get wind state
   */
  public isWindEnabled(): boolean {
    return this.wind;
  }
}
