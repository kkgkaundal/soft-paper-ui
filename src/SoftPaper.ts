import { Particle } from './Particle.js';
import { Constraint } from './Constraint.js';
import { Vec2 } from './Vec2.js';
import { SoftPaperOptions, GridConfig, PhysicsConfig } from './types.js';
import { drawTexturedQuad } from './TextureMapper.js';

/**
 * Main SoftPaper class - creates a soft, draggable, gravity-affected paper effect
 * for any HTML element using canvas-based physics simulation
 */
export class SoftPaper {
  private element: HTMLElement;
  private wrapper!: HTMLElement;
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
  private boundaries: boolean;
  private hoverEffect: boolean;
  private hoverRadius: number;
  
  private draggingParticle: Particle | null = null;
  private draggingParticles: Array<{particle: Particle, influence: number}> = []; // Multiple particles for cloth grab
  private grabRadius: number = 60; // Radius for cloth cluster grab
  private mousePos: Vec2 = new Vec2(0, 0);
  private prevMousePos: Vec2 = new Vec2(0, 0); // Track mouse velocity
  private mouseVelocity: Vec2 = new Vec2(0, 0);
  private windTime: number = 0;
  
  private width: number = 0;
  private height: number = 0;
  private spacingX: number = 0;
  private spacingY: number = 0;
  
  private animationFrame: number | null = null;
  private isDestroyed: boolean = false;
  private isTextureReady: boolean = false;
  private _hasRendered: boolean = false;

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
      gravity: options.gravity ?? 0.4,  // Natural cloth gravity
      stiffness: options.stiffness ?? 0.98,  // High stiffness for cloth integrity
      damping: options.damping ?? 0.99,  // Natural damping
      iterations: options.iterations ?? 8,  // Balanced solve
      airResistance: options.airResistance ?? 0.999,  // Light air resistance
      friction: options.friction ?? 0.98,  // Natural friction
      tearThreshold: options.tearThreshold ?? 3.5  // Tears when stretched ~3.5x
    };

    this.interactive = options.interactive ?? true;
    this.shadow = options.shadow ?? true;
    this.wind = options.wind ?? false;  // No wind by default
    this.windStrength = options.windStrength ?? 0.01;
    this.windFrequency = options.windFrequency ?? 0.01;
    this.dragRadius = options.dragRadius ?? 30;  // Direct mouse grab
    this.grabRadius = options.grabRadius ?? 30;  // Smaller grab area
    this.canvasScale = options.canvasScale ?? 1.0;
    this.boundaries = options.boundaries ?? false;  // No boundaries
    this.hoverEffect = options.hoverEffect ?? false;  // No hover by default
    this.hoverRadius = options.hoverRadius ?? 100;

    // Create canvas overlay
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Create offscreen canvas for element texture
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    // Initialize - capture BEFORE hiding element
    this.setupCanvasInitial();
    
    // Wait for texture capture before starting simulation
    this.captureElement()
      .then(() => {
        console.log('✅ Texture captured successfully');
        this.isTextureReady = true;
        this.hideElementAndFinishSetup();
        this.initPhysics();
        this.setupInteraction();
        this.start();
      })
      .catch((error) => {
        console.error('❌ Texture capture failed:', error);
        // Still mark as ready to allow rendering with fallback
        this.isTextureReady = true;
        this.hideElementAndFinishSetup();
        this.initPhysics();
        this.setupInteraction();
        this.start();
      });
  }

  /**
   * Initial canvas setup - don't hide element yet
   */
  private setupCanvasInitial(): void {
    const rect = this.element.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // Capture original element's computed styles
    const computedStyle = window.getComputedStyle(this.element);
    const originalPosition = computedStyle.position;
    const originalDisplay = computedStyle.display;

    // Create wrapper to contain both element and canvas
    this.wrapper = document.createElement('div');
    
    // Wrapper should take the element's place in the document flow
    // Preserve original positioning context
    if (originalPosition === 'absolute' || originalPosition === 'fixed') {
      this.wrapper.style.position = originalPosition;
      this.wrapper.style.top = computedStyle.top;
      this.wrapper.style.left = computedStyle.left;
      this.wrapper.style.right = computedStyle.right;
      this.wrapper.style.bottom = computedStyle.bottom;
    } else {
      this.wrapper.style.position = 'relative';
    }
    
    // Preserve display type
    this.wrapper.style.display = originalDisplay === 'inline' ? 'inline-block' : originalDisplay;
    
    // Set dimensions
    this.wrapper.style.width = `${this.width}px`;
    this.wrapper.style.height = `${this.height}px`;
    
    // Preserve spacing
    this.wrapper.style.margin = computedStyle.margin;
    this.wrapper.style.padding = '0'; // Wrapper has no padding, element has it
    this.wrapper.style.verticalAlign = computedStyle.verticalAlign;
    this.wrapper.style.float = computedStyle.float;

    // Set canvas size
    this.canvas.width = this.width * this.canvasScale;
    this.canvas.height = this.height * this.canvasScale;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    // Position canvas absolutely within wrapper (on top)
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '10';
    this.canvas.style.pointerEvents = this.interactive ? 'auto' : 'none';
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.cursor = this.interactive ? 'grab' : 'default';
    
    // Position element absolutely within wrapper (behind canvas) for capture
    // Keep it visible and at full size for proper capture
    this.element.style.position = 'absolute';
    this.element.style.top = '0';
    this.element.style.left = '0';
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.element.style.margin = '0'; // Remove margins (wrapper has them)
    this.element.style.visibility = 'visible'; // Ensure visible for capture
    
    // Insert wrapper and move element into it
    this.element.parentNode?.insertBefore(this.wrapper, this.element);
    this.wrapper.appendChild(this.element);
    this.wrapper.appendChild(this.canvas);
  }

  /**
   * Hide element after successful capture
   */
  private hideElementAndFinishSetup(): void {
    // Now hide the original element (texture is captured)
    // It's already positioned absolutely within wrapper, just hide it
    this.element.style.visibility = 'hidden';
    this.element.style.pointerEvents = 'none'; // Don't intercept clicks
  }

  /**
   * Capture the element as a texture on offscreen canvas
   * Uses advanced DOM cloning and rendering for full CSS support
   */
  private async captureElement(): Promise<void> {
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;

    console.log(`Capturing element: ${this.width}x${this.height}px`);

    // Try to use DOM cloning with inline styles for better rendering
    const success = await this.captureElementAdvanced();
    
    if (!success) {
      // Fallback to manual rendering
      this.captureElementFallback();
    }
    
    // Verify capture succeeded by checking if canvas has content
    // Note: Canvas may be tainted, so getImageData might fail - that's OK
    let hasContent = true; // Assume success unless proven otherwise
    
    try {
      const imageData = this.offscreenCtx.getImageData(0, 0, 
        Math.min(10, this.width), Math.min(10, this.height));
      hasContent = imageData.data.some((value, index) => {
        // Check if any pixel has non-zero alpha
        return index % 4 === 3 && value > 0;
      });
      console.log(`Texture validation: ${hasContent ? 'HAS CONTENT ✅' : 'EMPTY ❌'}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'SecurityError') {
        // Canvas is tainted but that's OK - we can still use it for drawing
        console.log('⚠️ Canvas tainted (security restriction) - skipping validation');
        console.log('   This is normal and does not affect functionality');
        hasContent = true; // Assume texture is good
      } else {
        console.warn('Texture validation failed:', e);
        hasContent = false;
      }
    }
    
    if (!hasContent) {
      console.warn('⚠️ Texture capture appears empty, applying emergency fallback');
      
      // Emergency fallback: Draw something visible
      // Use bright colors to make debugging easier
      const gradient = this.offscreenCtx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      
      this.offscreenCtx.fillStyle = gradient;
      this.offscreenCtx.fillRect(0, 0, this.width, this.height);
      
      // Draw text
      this.offscreenCtx.fillStyle = '#ffffff';
      this.offscreenCtx.font = 'bold 20px sans-serif';
      this.offscreenCtx.textAlign = 'center';
      this.offscreenCtx.textBaseline = 'middle';
      this.offscreenCtx.fillText('Soft Paper', this.width / 2, this.height / 2 - 10);
      
      this.offscreenCtx.font = '14px sans-serif';
      this.offscreenCtx.fillText('Element Captured', this.width / 2, this.height / 2 + 15);
      
      console.log('✅ Emergency fallback applied');
    }
    
    console.log(`Element capture complete, texture ready (${this.width}x${this.height})`);
  }

  /**
   * Advanced element capture using DOM cloning and foreignObject
   */
  private async captureElementAdvanced(): Promise<boolean> {
    try {
      console.log('Attempting advanced element capture...');
      
      // Clone the element and inline all computed styles
      const clone = this.element.cloneNode(true) as HTMLElement;
      
      // Inline styles recursively
      this.inlineStyles(this.element, clone);
      
      // Create SVG with foreignObject
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', String(this.width));
      svg.setAttribute('height', String(this.height));
      svg.setAttribute('xmlns', svgNS);
      
      const foreignObject = document.createElementNS(svgNS, 'foreignObject');
      foreignObject.setAttribute('width', '100%');
      foreignObject.setAttribute('height', '100%');
      foreignObject.setAttribute('x', '0');
      foreignObject.setAttribute('y', '0');
      
      foreignObject.appendChild(clone);
      svg.appendChild(foreignObject);
      
      // Serialize SVG to data URL
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      console.log('SVG created, loading as image...');
      
      // Load as image and draw to canvas
      return new Promise<boolean>((resolve) => {
        const img = new Image();
        let timeout: number;
        
        const cleanup = (success: boolean) => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          if (success) {
            console.log('✅ Advanced capture successful');
          } else {
            console.log('❌ Advanced capture failed');
          }
          resolve(success);
        };
        
        img.onload = () => {
          try {
            this.offscreenCtx.drawImage(img, 0, 0, this.width, this.height);
            cleanup(true);
          } catch (e) {
            console.error('Error drawing image:', e);
            cleanup(false);
          }
        };
        img.onerror = (e) => {
          console.error('Image load error:', e);
          cleanup(false);
        };
        
        // Timeout after 2 seconds
        timeout = window.setTimeout(() => {
          console.warn('Advanced capture timeout');
          cleanup(false);
        }, 2000);
        
        img.src = url;
      });
    } catch (e) {
      console.error('Advanced capture exception:', e);
      return false;
    }
  }

  /**
   * Inline all computed styles for better rendering
   */
  private inlineStyles(original: Element, clone: Element): void {
    const computedStyle = window.getComputedStyle(original);
    const styleString = Array.from(computedStyle).map(
      key => `${key}:${computedStyle.getPropertyValue(key)}`
    ).join(';');
    
    (clone as HTMLElement).setAttribute('style', styleString);
    
    // Recursively process children
    const originalChildren = original.children;
    const cloneChildren = clone.children;
    for (let i = 0; i < originalChildren.length; i++) {
      this.inlineStyles(originalChildren[i], cloneChildren[i]);
    }
  }

  /**
   * Fallback element capture with manual CSS rendering
   */
  private captureElementFallback(): void {
    console.log('Using fallback element capture...');
    
    // Get all computed styles from the visible element
    const computedStyle = window.getComputedStyle(this.element);
    
    // Extract color values properly - handle defaults
    const bgColor = computedStyle.backgroundColor;
    const bgImage = computedStyle.backgroundImage;
    const textColor = computedStyle.color || '#000000';
    const borderRadius = computedStyle.borderRadius;
    
    // Clear canvas first
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    
    // Draw background with border radius
    this.offscreenCtx.save();
    
    // Apply border radius if present
    const radius = parseFloat(borderRadius) || 0;
    if (radius > 0) {
      this.roundRect(this.offscreenCtx, 0, 0, this.width, this.height, radius);
      this.offscreenCtx.clip();
    }
    
    // Fill background - check if color is valid
    const isTransparent = !bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent';
    if (!isTransparent) {
      console.log(`Rendering background: ${bgColor}`);
      this.offscreenCtx.fillStyle = bgColor;
      this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    } else {
      // Use element's parent background or white
      const parentBg = this.element.parentElement ? 
        window.getComputedStyle(this.element.parentElement).backgroundColor : '';
      const isParentTransparent = !parentBg || parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent';
      
      const finalBg = isParentTransparent ? '#f5f5f5' : parentBg;
      console.log(`Using background: ${finalBg}`);
      this.offscreenCtx.fillStyle = finalBg;
      this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    }
    
    // Try to handle background gradients
    if (bgImage && bgImage !== 'none') {
      console.log(`Background image/gradient detected: ${bgImage.substring(0, 50)}...`);
      if (bgImage.includes('gradient')) {
        // For gradients, we've already filled with background color - that's the best we can do
        console.log('Note: Full gradient rendering not supported in fallback mode');
      }
    }
    
    // Draw border if present
    const borderWidth = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderColor = computedStyle.borderTopColor;
    if (borderWidth > 0 && borderColor) {
      console.log(`Rendering border: ${borderWidth}px ${borderColor}`);
      this.offscreenCtx.strokeStyle = borderColor;
      this.offscreenCtx.lineWidth = borderWidth;
      if (radius > 0) {
        this.roundRect(this.offscreenCtx, borderWidth / 2, borderWidth / 2, 
                      this.width - borderWidth, this.height - borderWidth, radius);
      } else {
        this.offscreenCtx.strokeRect(borderWidth / 2, borderWidth / 2,
                                     this.width - borderWidth, this.height - borderWidth);
      }
      this.offscreenCtx.stroke();
    }
    
    this.offscreenCtx.restore();
    
    // Render text content with all styles
    console.log('Rendering text content...');
    this.renderElementContent(this.element, computedStyle);
    
    // Render any child images
    console.log('Rendering child images...');
    this.renderImages(this.element);
    
    console.log('✅ Fallback capture complete');
  }

  /**
   * Helper to draw rounded rectangle
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, 
                    width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  /**
   * Render element content to canvas with proper styling
   */
  private renderElementContent(element: HTMLElement, computedStyle: CSSStyleDeclaration): void {
    // Get padding with safe defaults
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    
    // Calculate content area
    const contentWidth = this.width - paddingLeft - paddingRight;
    
    // Set text styles with safe defaults
    const fontSize = parseFloat(computedStyle.fontSize) || 14;
    const fontSizeStr = computedStyle.fontSize || '14px';
    const fontFamily = computedStyle.fontFamily || 'Arial, sans-serif';
    const fontWeight = computedStyle.fontWeight || 'normal';
    const textColor = computedStyle.color || '#000000';
    const textAlign = computedStyle.textAlign as CanvasTextAlign || 'start';
    
    // Handle lineHeight - can be 'normal', a number, or a pixel value
    let lineHeight = fontSize * 1.5; // Default multiplier
    const lineHeightValue = computedStyle.lineHeight;
    if (lineHeightValue && lineHeightValue !== 'normal') {
      const parsed = parseFloat(lineHeightValue);
      if (!isNaN(parsed)) {
        lineHeight = parsed;
      }
    }
    
    this.offscreenCtx.fillStyle = textColor;
    this.offscreenCtx.font = `${fontWeight} ${fontSizeStr} ${fontFamily}`;
    this.offscreenCtx.textBaseline = 'top';
    
    let currentY = paddingTop;
    let currentX = paddingLeft;
    
    // Simple approach: render all text content with proper wrapping
    const allText = element.textContent || '';
    const lines = allText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        currentY += lineHeight * 0.5; // Empty line spacing
        continue;
      }
      
      // Word wrap
      const words = trimmedLine.split(/\s+/);
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = this.offscreenCtx.measureText(testLine);
        
        if (metrics.width > contentWidth - 10 && currentLine) {
          // Draw current line
          this.drawTextLine(currentLine, currentX, currentY, contentWidth, textAlign);
          currentY += lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw remaining text
      if (currentLine) {
        this.drawTextLine(currentLine, currentX, currentY, contentWidth, textAlign);
        currentY += lineHeight;
      }
    }
  }

  /**
   * Draw a line of text with proper alignment
   */
  private drawTextLine(text: string, x: number, y: number, maxWidth: number, align: CanvasTextAlign): void {
    let drawX = x;
    
    if (align === 'center') {
      drawX = x + maxWidth / 2;
      this.offscreenCtx.textAlign = 'center';
    } else if (align === 'right') {
      drawX = x + maxWidth;
      this.offscreenCtx.textAlign = 'right';
    } else {
      this.offscreenCtx.textAlign = 'left';
    }
    
    this.offscreenCtx.fillText(text, drawX, y, maxWidth);
  }

  /**
   * Render images found in the element
   */
  private renderImages(element: HTMLElement): void {
    const images = element.querySelectorAll('img');
    const rect = element.getBoundingClientRect();
    
    images.forEach((img) => {
      if (!img.complete || !img.naturalWidth) return; // Skip unloaded images
      
      const imgRect = img.getBoundingClientRect();
      // Calculate position relative to parent element
      const x = imgRect.left - rect.left;
      const y = imgRect.top - rect.top;
      const w = imgRect.width;
      const h = imgRect.height;
      
      try {
        this.offscreenCtx.drawImage(img, x, y, w, h);
      } catch (e) {
        // CORS or other error - skip this image
        console.warn('Could not render image:', e);
      }
    });
  }

  /**
   * Initialize physics simulation grid with natural weight distribution
   */
  private initPhysics(): void {
    const { cols, rows } = this.gridConfig;
    
    this.spacingX = this.width / (cols - 1);
    this.spacingY = this.height / (rows - 1);

    // Create particle grid with weight distribution (bottom heavier)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * this.spacingX;
        const py = y * this.spacingY;
        
        // Pin entire top edge for stability (cloth hangs from top)
        const pinned = (y === 0);
        
        // Bottom particles are heavier (more fabric weight accumulation)
        const weightFactor = 1.0 + (y / (rows - 1)) * 0.5; // 1.0 to 1.5x mass
        const mass = 1.0 * weightFactor;
        
        this.particles.push(new Particle(px, py, pinned, mass));
      }
    }

    // Create constraints
    // Horizontal constraints
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i1 = y * cols + x;
        const i2 = y * cols + (x + 1);
        this.constraints.push(
          new Constraint(
            this.particles[i1], 
            this.particles[i2], 
            this.physicsConfig.stiffness,
            this.physicsConfig.tearThreshold
          )
        );
      }
    }

    // Vertical constraints
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const i1 = y * cols + x;
        const i2 = (y + 1) * cols + x;
        this.constraints.push(
          new Constraint(
            this.particles[i1], 
            this.particles[i2], 
            this.physicsConfig.stiffness,
            this.physicsConfig.tearThreshold
          )
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
          new Constraint(
            this.particles[i1], 
            this.particles[i2], 
            this.physicsConfig.stiffness * 0.5,
            this.physicsConfig.tearThreshold
          )
        );
        this.constraints.push(
          new Constraint(
            this.particles[i3], 
            this.particles[i4], 
            this.physicsConfig.stiffness * 0.5,
            this.physicsConfig.tearThreshold
          )
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
      this.prevMousePos = this.mousePos.clone();
      this.canvas.style.cursor = 'grabbing';
      
      // Gentle ripple on click - subtle like CodePen
      const punchStrength = 2.0;  // Gentle push
      const punchRadius = 60;     // Smaller area
      
      for (const p of this.particles) {
        if (p.pinned) continue;
        
        const dist = p.pos.distanceTo(this.mousePos);
        if (dist < punchRadius && dist > 0) {
          // Gentle ripple effect
          const falloff = 1.0 - (dist / punchRadius);
          const rippleForce = falloff * falloff * punchStrength;
          
          const direction = p.pos.sub(this.mousePos).normalize();
          const punch = direction.scale(rippleForce);
          
          // Apply gentle impulse
          p.oldPos = p.oldPos.sub(punch);
        }
      }
      
      // Find closest particle to grab - simple direct grab like CodePen
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
      e.preventDefault();
      const newMousePos = getPos(e);
      
      // Calculate mouse velocity for momentum
      this.mouseVelocity = newMousePos.sub(this.mousePos);
      this.prevMousePos = this.mousePos.clone();
      this.mousePos = newMousePos;
      
      // Apply hover effect even when not dragging
      if (this.draggingParticles.length === 0 && this.hoverEffect) {
        this.applyHoverEffect();
      }
    };

    const onEnd = () => {
      // Apply gentle momentum to released particles (reduced for smoother release)
      if (this.draggingParticles.length > 0 && this.mouseVelocity.length() > 0.5) {
        for (const { particle, influence } of this.draggingParticles) {
          // Give particles gentle momentum based on mouse velocity and influence
          const momentum = this.mouseVelocity.scale(influence * 0.2); // Reduced from 0.3
          particle.oldPos = particle.pos.sub(momentum);
        }
      }
      
      this.draggingParticle = null;
      this.draggingParticles = [];
      this.mouseVelocity.set(0, 0);
      
      if (this.interactive) {
        this.canvas.style.cursor = 'grab';
      }
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
   * Physics update step with advanced features
   */
  private updatePhysics(): void {
    // Apply gravity
    const gravity = new Vec2(0, this.physicsConfig.gravity);
    for (const p of this.particles) {
      p.applyForce(gravity);
    }

    // Apply natural wind oscillation with turbulence (always-on for living cloth feel)
    if (this.wind) {
      this.windTime += this.windFrequency;
      
      // Multi-frequency wind for natural turbulence
      const primaryWind = Math.sin(this.windTime) * this.windStrength;
      const secondaryWind = Math.sin(this.windTime * 2.3) * this.windStrength * 0.4;  // Gusts
      const verticalFlow = Math.cos(this.windTime * 0.7) * this.windStrength * 0.5;  // Rising air
      
      const windX = primaryWind + secondaryWind;
      const windY = verticalFlow + Math.sin(this.windTime * 1.1) * this.windStrength * 0.2;
      const windForce = new Vec2(windX, windY);
      
      for (const p of this.particles) {
        if (!p.pinned) {
          // Add slight position-based variation for wave-like effect
          const positionVariation = Math.sin(p.pos.x * 0.02 + this.windTime) * 0.3;
          const localWind = windForce.scale(1.0 + positionVariation);
          p.applyForce(localWind);
        }
      }
    }
    
    // No edge forces - let cloth hang naturally like CodePen example

    // Direct cloth grab - pin dragged particle to mouse like CodePen
    if (this.draggingParticle) {
      // Direct position setting for responsive feel
      this.draggingParticle.pos = this.mousePos.clone();
      this.draggingParticle.oldPos = this.mousePos.clone();
    }

    // Verlet integration with air resistance
    for (const p of this.particles) {
      p.update(this.physicsConfig.damping, this.physicsConfig.airResistance);
    }

    // Apply boundary constraints if enabled
    if (this.boundaries) {
      this.applyBoundaries();
    }

    // Solve constraints multiple times
    for (let i = 0; i < this.physicsConfig.iterations; i++) {
      for (const c of this.constraints) {
        c.solve();
      }
    }
  }

  /**
   * Apply hover effect - smooth silk-like response to mouse presence
   */
  private applyHoverEffect(): void {
    for (const p of this.particles) {
      if (p.pinned) continue;
      
      const dist = p.pos.distanceTo(this.mousePos);
      if (dist < this.hoverRadius && dist > 0) {
        // Smooth silk response: ultra-gentle push like touching fine fabric
        const falloff = 1 - dist / this.hoverRadius;
        
        // Quintic falloff for maximum smoothness (x^5)
        const smoothFalloff = falloff * falloff * falloff * falloff * falloff;
        
        // Direction away from mouse
        const direction = p.pos.sub(this.mousePos).normalize();
        
        // Ultra-gentle force for smooth paper/cloth feeling
        const baseForce = 0.04 * smoothFalloff;  // Gentle touch
        
        // Minimal turbulence for organic smooth feel
        const turbulence = Math.sin(p.pos.x * 0.05 + p.pos.y * 0.05) * 0.008;
        const force = direction.scale(baseForce + turbulence);
        
        p.applyForce(force);
      }
    }
  }

  /**
   * Apply boundary constraints with friction
   */
  private applyBoundaries(): void {
    const margin = 0;
    
    for (const p of this.particles) {
      if (p.pinned) continue;
      
      const velocity = p.getVelocity();
      
      // Left boundary
      if (p.pos.x < margin) {
        p.pos.x = margin;
        p.oldPos.x = p.pos.x + velocity.x * this.physicsConfig.friction;
      }
      // Right boundary
      if (p.pos.x > this.width - margin) {
        p.pos.x = this.width - margin;
        p.oldPos.x = p.pos.x + velocity.x * this.physicsConfig.friction;
      }
      // Top boundary
      if (p.pos.y < margin) {
        p.pos.y = margin;
        p.oldPos.y = p.pos.y + velocity.y * this.physicsConfig.friction;
      }
      // Bottom boundary (with more friction for ground)
      if (p.pos.y > this.height - margin) {
        p.pos.y = this.height - margin;
        // Apply ground friction
        p.oldPos.x = p.pos.x - velocity.x * (this.physicsConfig.friction * 0.8);
        p.oldPos.y = p.pos.y + velocity.y * (this.physicsConfig.friction * 0.3);
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
    
    // Don't render if texture isn't ready yet
    if (!this.isTextureReady) {
      // Draw loading indicator
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading texture...', this.canvas.width / 2, this.canvas.height / 2);
      ctx.restore();
      return;
    }

    // Apply canvas scale
    ctx.save();
    ctx.scale(this.canvasScale, this.canvasScale);
    
    // Log first render (once)
    if (!this._hasRendered) {
      this._hasRendered = true;
      console.log(`🎨 First render: texture=${this.offscreenCanvas.width}x${this.offscreenCanvas.height}, canvas=${this.canvas.width}x${this.canvas.height}, particles=${this.particles.length}`);
    }

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

    // Render cloth - simple textured quads like CodePen example
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

        // Validate texture before drawing
        if (!this.offscreenCanvas || this.offscreenCanvas.width === 0 || this.offscreenCanvas.height === 0) {
          // Fallback: draw white quad
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p1.pos.x, p1.pos.y, 
                      Math.abs(p2.pos.x - p1.pos.x), 
                      Math.abs(p4.pos.y - p1.pos.y));
          continue;
        }

        // Simple texture mapping like CodePen cloth
        drawTexturedQuad(
          ctx,
          this.offscreenCanvas,
          p1.pos, p2.pos, p3.pos, p4.pos,
          sx, sy, sw, sh
        );
      }
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
    if (this.animationFrame !== null) {
      console.log('Animation already running');
      return;
    }
    console.log('🎬 Starting animation loop');
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
    
    // Restore element to original state
    this.element.style.visibility = 'visible';
    this.element.style.position = '';
    this.element.style.top = '';
    this.element.style.left = '';
    
    // Remove wrapper and restore element to original position
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
      this.wrapper.remove();
    }
    
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
   * Get the captured texture canvas for debugging
   */
  public getTexture(): HTMLCanvasElement {
    return this.offscreenCanvas;
  }

  /**
   * Get the main rendering canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get texture as data URL for inspection
   * Note: May throw SecurityError if canvas is tainted
   */
  public getTextureDataURL(): string {
    try {
      return this.offscreenCanvas.toDataURL();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'SecurityError') {
        console.warn('Cannot export texture: Canvas is tainted by cross-origin data');
        console.warn('This is a browser security restriction and does not affect physics rendering');
        throw new Error('Canvas tainted: Cannot export as data URL (see console for details)');
      }
      throw e;
    }
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

  /**
   * Get torn constraint count
   */
  public getTornCount(): number {
    return this.constraints.filter(c => c.isBroken()).length;
  }

  /**
   * Repair all torn constraints
   */
  public repairTears(): void {
    for (const c of this.constraints) {
      if (c.isBroken()) {
        c.repair();
      }
    }
  }

  /**
   * Smoothly revert all particles back to their original positions
   * Creates a beautiful flowing animation as the cloth returns to rest
   * @param duration - Animation duration in milliseconds (default: 2000ms)
   * @param easing - Easing function: 'smooth' (cubic), 'bounce', or 'elastic' (default: 'smooth')
   */
  public revertToOriginal(duration: number = 2000, easing: 'smooth' | 'bounce' | 'elastic' = 'smooth'): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const originalPositions = this.particles.map(p => p.originalPos.clone());
      const startPositions = this.particles.map(p => p.pos.clone());
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing function
        let easedProgress: number;
        if (easing === 'bounce') {
          // Bounce easing out
          if (progress < 1) {
            easedProgress = 1 - Math.pow(1 - progress, 2) * Math.abs(Math.cos(progress * Math.PI * 3));
          } else {
            easedProgress = 1;
          }
        } else if (easing === 'elastic') {
          // Elastic easing out
          if (progress === 0 || progress === 1) {
            easedProgress = progress;
          } else {
            easedProgress = Math.pow(2, -10 * progress) * Math.sin((progress - 0.1) * 5 * Math.PI) + 1;
          }
        } else {
          // Smooth cubic easing
          easedProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
        
        // Interpolate all particles
        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];
          if (p.pinned) continue; // Skip pinned particles
          
          const start = startPositions[i];
          const target = originalPositions[i];
          
          // Smoothly interpolate position
          p.pos.x = start.x + (target.x - start.x) * easedProgress;
          p.pos.y = start.y + (target.y - start.y) * easedProgress;
          
          // Update oldPos to maintain smooth velocity
          p.oldPos.x = p.pos.x;
          p.oldPos.y = p.pos.y;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure exact final positions
          for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.pinned) {
              p.pos.x = originalPositions[i].x;
              p.pos.y = originalPositions[i].y;
              p.oldPos.x = p.pos.x;
              p.oldPos.y = p.pos.y;
            }
          }
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Create a ripple effect at a specific point
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param strength - Ripple strength (default: 5)
   * @param radius - Ripple radius (default: 150)
   */
  public createRipple(x: number, y: number, strength: number = 5, radius: number = 150): void {
    const ripplePoint = new Vec2(x, y);
    
    for (const p of this.particles) {
      if (p.pinned) continue;
      
      const dist = p.pos.distanceTo(ripplePoint);
      if (dist < radius) {
        // Create outward ripple with smooth falloff
        const falloff = 1 - (dist / radius);
        const rippleStrength = strength * falloff * falloff;
        const direction = p.pos.sub(ripplePoint).normalize();
        
        p.applyForce(direction.scale(rippleStrength));
      }
    }
  }

  /**
   * Create a wave effect across the cloth
   * @param direction - Wave direction: 'horizontal', 'vertical', or angle in radians
   * @param amplitude - Wave strength (default: 8)
   * @param frequency - Wave frequency (default: 0.5)
   */
  public createWave(direction: 'horizontal' | 'vertical' | number = 'horizontal', amplitude: number = 8, frequency: number = 0.5): void {
    const time = Date.now() / 1000;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;
      
      let phase: number;
      if (direction === 'horizontal') {
        phase = (p.pos.x / this.width) * Math.PI * 2 * frequency;
      } else if (direction === 'vertical') {
        phase = (p.pos.y / this.height) * Math.PI * 2 * frequency;
      } else {
        // Custom angle
        const cos = Math.cos(direction);
        const sin = Math.sin(direction);
        phase = ((p.pos.x * cos + p.pos.y * sin) / Math.max(this.width, this.height)) * Math.PI * 2 * frequency;
      }
      
      const wave = Math.sin(phase + time * 2) * amplitude;
      p.applyForce(new Vec2(0, wave));
    }
  }

  /**
   * Shake the entire cloth
   * @param intensity - Shake intensity (default: 3)
   * @param duration - Shake duration in milliseconds (default: 500)
   */
  public shake(intensity: number = 3, duration: number = 500): void {
    const startTime = Date.now();
    
    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(shakeInterval);
        return;
      }
      
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress); // Fade out
      
      for (const p of this.particles) {
        if (p.pinned) continue;
        
        const randomForce = new Vec2(
          (Math.random() - 0.5) * currentIntensity * 2,
          (Math.random() - 0.5) * currentIntensity * 2
        );
        p.applyForce(randomForce);
      }
    }, 16); // ~60fps
  }
}
