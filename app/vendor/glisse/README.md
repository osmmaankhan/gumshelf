# Glisse source adaptation

Upstream: https://github.com/0kzh/glisse
Reviewed revision: 46be5ba07b60eb507e887ff338ded7840576a79f (package 0.5.0).
Copyright (c) 2026 Kelvin Zhang. MIT; full license included alongside this file.

liquid-map.js adapts the rounded-rectangle signed-distance equation and separate greyscale displacement passes described in src/internal/lens.ts. GumShelf uses a bounded smoothstep edge normal, token dimensions and the existing tested Chromium backdrop path. It does not copy Glisse's calibration, dispersion, dome lighting or cross-browser content-capture engine. Glass and native desktop blur sample different planes.

liquid-interactions.js and liquid-controls.css independently adapt press/tug, held-slider lift and real-input layering patterns studied in internal/press.ts, slider.tsx, switch.tsx and styles.css. Original native input/click events remain their owners. Timing, displacement, spacing, theme colours and motion amplitude come from GumShelf's active tokens. There are no React, npm or remote runtime dependencies.

The source study also covered internal/hold.ts and spring.ts, internal/refraction.ts, segments.tsx, button.tsx, menu.tsx and input.tsx. Menu dismissal/focus remains GumShelf's existing implementation; night mode uses its existing native/device-aware appearance policy. Button tugs are visual feedback, not a product-reordering feature. No upstream default numbers were promoted to active project tokens.

upstream-source.zip is the supplied reference snapshot. The app uses the local adaptations above at runtime.
