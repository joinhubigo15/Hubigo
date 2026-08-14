<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hubigo Responsive Design Rule: Responsive Scaling, NOT Responsive Reflow

Whenever performing responsive updates or layout refinements across Hubigo pages:

1. **RESPONSIVE SCALING, NOT RESPONSIVE REFLOW**:
   - Do NOT use conventional mobile reflow where multi-column grids collapse to 1 stacked full-width column, horizontal rows wrap heavily, or desktop compositions are destroyed.
   - Preserve desktop composition, hierarchy, and visual density, but scale/compact it proportionally for smaller viewports.

2. **MOBILE COMPOSITION RULES**:
   - Keep business cards and content blocks in multi-column scaled arrangements (`grid-cols-2`, `grid-cols-3`, `grid-cols-4` compact) on mobile rather than stacking every card vertically.
   - Keep horizontal category/navigation items in horizontal rows.
   - Reduce dimensions, gaps, font sizes, padding, and image heights proportionally.
   - Avoid creating a completely different mobile UI layout.

3. **DESKTOP PROTECTION (≥1024px)**:
   - Desktop layout must remain visually identical and protected from regressions.
