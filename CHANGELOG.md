# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-24

### Added
- Initial release of soft-paper-ui library
- Pure 2D Canvas + Verlet integration physics simulation
- Zero-dependency implementation
- Vec2 class for 2D vector operations
- Particle class with Verlet integration
- Constraint class for distance constraints
- SoftPaper main class with full API
- Mouse and touch interaction support
- Configurable physics parameters (gravity, stiffness, damping, iterations)
- Optional wind oscillation effect
- Soft shadow rendering
- ESM build output
- UMD build output for browser globals
- TypeScript type definitions
- Comprehensive README documentation
- Interactive demo page with real-time controls
- Runtime configuration updates via updateConfig()
- Wind toggle functionality via setWind()

### Performance
- Optimized for < 5% CPU usage on modern devices during interaction
- Small simulation grid (10×20 default) for efficiency
- Low constraint iteration count (6 default) for performance

### Security
- No known vulnerabilities
- Passed CodeQL security analysis
