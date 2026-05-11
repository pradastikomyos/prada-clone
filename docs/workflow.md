# High-Fidelity UI Development Workflow

This document outlines the systematic process used by Antigravity to achieve "liquid smooth" staggered animations and pixel-perfect UI parity with luxury brands like Prada and Zara.

## 1. Visual Audit & Research Phase
Before writing code, we perform a deep visual audit of the reference site.
- **Tool:** Browser Subagent (Playwright-based).
- **Process:**
    1. Navigate to the reference URL (e.g., Prada.com or Zara.com).
    2. Analyze the **Layout Architecture** (e.g., 50/50 split, sticky panels, grid column counts).
    3. Audit **Typography** (Font family, weight, tracking, and specific transformations like `uppercase`).
    4. Observe **Micro-animations** (Staggered entry, ease-out timings, scroll-triggered reveals).
    5. Screenshot key breakpoints and interaction states (Hover, Menu Open, Filter Drawer).

## 2. Infrastructure & State Management
Transitioning from simple props to a professional architecture.
- **Zustand (Global Store):** Used for UI states that affect multiple components (e.g., `menuOpen`, `searchOpen`, `scrolled`).
- **TanStack Query:** Implemented for future server-side data handling to ensure high performance and caching.
- **Local Assets:** Fonts are moved from external URLs to local folders (`/src/fonts/`) to prevent CORS blocking and ensure instant loading.

## 3. High-Fidelity Styling Strategy
Achieving the "Luxury Look" requires specific CSS techniques:
- **Hair-line Borders:** Using `gap: 1px` with a container background color (e.g., `#e4e4e4`) to create razor-thin grid lines.
- **Minimalist Positioning:** Using `position: fixed` or `position: absolute` with `pointer-events: none` on parent containers to anchor utility links (CARI, MENU, BAG) in screen corners without breaking layout flow.
- **Extreme Typography:** Using responsive units and tight line-heights (e.g., `line-height: 0.82`) for giant "stacked" titles.
- **Negative Space:** Prioritizing "breathable" layouts by avoiding cluttered borders and using `justify-content: center` on sticky side-panels.

## 4. Animation & Smoothness
Animations must be "liquid" rather than "choppy".
- **GSAP (GreenSock):** Used for advanced scroll-triggered animations and entry sequences.
- **Staggered Delays:** Calculating `transition-delay` based on item index (e.g., `delay: index * 0.1s`) for cascading menu effects.
- **Cubic Bezier:** Avoiding `ease-in` defaults; using luxury curves like `cubic-bezier(0.16, 1, 0.3, 1)`.

## 5. Iterative Refinement & Human-Guided Correction
Achieving a "Perfect Copy" requires abandoning assumptions and relying on exact data extraction and pragmatic human feedback.
1. **Initial Assumption vs. Reality:** Avoid assuming stylistic intent (e.g., assuming a "luxury" title must be giant and stacked). Rely entirely on the reference material.
2. **Data-Driven Extraction:** Use the Browser Subagent (Playwright) to inspect the live reference site (e.g., an active Zara product tab). Do not guess CSS values.
    - Extract exact text content to replicate DOM structure perfectly.
    - Extract exact computed CSS values: Font weights (e.g., `300`), pixel-perfect font sizes, exact line heights, and specific border thicknesses (e.g., `0.66px`).
3. **Local Review:** Open `localhost:5173` via browser tool to perform a side-by-side comparison with the reference.
4. **Pragmatic Iteration:** Address human prompts objectively. If told a design element is incorrect (e.g., "no one tells you that"), immediately discard the assumption, re-inspect the live DOM using Playwright, and apply the exact extracted values to override the erroneous styles.

## 6. Testing & Quality Control
- **Playwright Tests:** (Located in `/tests/`) Used to verify critical interactions like menu opening, search overlays, and navigation flows.
- **Console Audit:** Monitoring terminal for HMR failures or Vite build errors to ensure the dev server remains stable.
