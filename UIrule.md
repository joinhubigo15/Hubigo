Yep. You want a **project-level `RULE.md`** that tells Antigravity how to behave whenever it encounters mobile/smaller breakpoints — essentially **"responsive ≠ stacked."**

Use this as `RULE.md`:

````md
# Hubigo Responsive UI Rules

## Core Principle

**Responsive design must preserve the original UI composition, proportions, density, and visual hierarchy.**

DO NOT interpret smaller screens as a reason to enlarge components, stack everything vertically, or redesign the interface.

The desktop/mobile design is an intentional UI composition. Smaller screens should adapt the composition only where physically necessary.

---

# 1. NEVER Automatically Stack Components

A smaller viewport does NOT mean:

- `grid-cols-1`
- one card per row
- vertical stacking
- full-width cards
- oversized components
- large gaps between sections

Do not convert a multi-column or horizontal layout into a vertical layout unless the existing design explicitly requires it.

### WRONG

```text
Desktop:
[Card] [Card] [Card] [Card]

Mobile:
[       Card       ]
[       Card       ]
[       Card       ]
[       Card       ]
````

### PREFERRED

```text
Mobile:
[Card] [Card]
[Card] [Card]

or

[Card] → [Card] → [Card] →
```

Preserve the original composition whenever possible.

---

# 2. Preserve Component Dimensions

When moving to a smaller viewport:

* Preserve card proportions.
* Preserve approximate card heights.
* Preserve image aspect ratios.
* Preserve button proportions.
* Preserve icon sizes.
* Preserve section density.
* Preserve typography hierarchy.
* Preserve reasonable internal padding.

Do NOT make components significantly larger simply because there is more available horizontal space after stacking.

The mobile UI should feel **compact and intentional**, not like a desktop page stretched vertically.

---

# 3. Preserve Visual Density

Hubigo is a business-discovery platform with information-dense interfaces.

Mobile screens should still be able to display multiple pieces of content within one viewport.

Avoid excessive:

```css
padding
margin
gap
min-height
height
```

especially at mobile breakpoints.

Do not add whitespace merely to make the interface "feel cleaner."

The reference design's visual density is part of the design.

---

# 4. Horizontal Content Must Stay Horizontal

If a section contains multiple cards/items in a horizontal row, keep it horizontal on smaller screens.

Use horizontal scrolling instead of stacking.

Preferred implementation:

```css
overflow-x: auto;
display: flex;
flex-wrap: nowrap;
```

or an equivalent grid/carousel implementation.

Examples:

* Deals
* Businesses
* Recently Viewed
* Testimonials
* Services
* Categories
* Recommendations
* Promotional cards

### Example

```text
Mobile viewport

┌──────────────────────────────┐
│ Deals Near You               │
│                              │
│ [Card] [Card] [Card] →       │
└──────────────────────────────┘
```

NOT:

```text
┌──────────────────────────────┐
│ Deals Near You               │
│                              │
│ [       Card       ]         │
│                              │
│ [       Card       ]         │
│                              │
│ [       Card       ]         │
└──────────────────────────────┘
```

---

# 5. Preserve Multi-Column Grids

Do not automatically reduce every grid to one column.

For compact UI sections, maintain multiple columns where practical.

For example:

```text
Desktop:
4 columns

Tablet:
3 columns

Mobile:
2 columns
```

Do NOT automatically do:

```text
Desktop: 4
Tablet: 2
Mobile: 1
```

unless the content genuinely cannot fit.

The goal is to preserve the composition, not simply eliminate columns.

---

# 6. Do Not Enlarge Mobile Cards

A common responsive mistake is:

```css
width: 100%;
```

combined with:

```css
grid-template-columns: 1fr;
```

which causes cards to become unnecessarily large.

Avoid this when it conflicts with the intended design.

Cards should have controlled dimensions:

```css
min-width
max-width
width
aspect-ratio
```

as appropriate.

The available mobile width should not automatically determine that a component must occupy the entire viewport.

---

# 7. Prevent Unnecessary Text Wrapping

Text wrapping can unexpectedly increase component height and destroy the intended visual density.

Where appropriate:

* Use `text-overflow: ellipsis`
* Use `overflow: hidden`
* Use `white-space: nowrap`
* Limit text to a controlled number of lines
* Reduce font size slightly at smaller breakpoints when necessary

Example:

```css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

For descriptions:

```css
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
```

Do not allow a short card title to create a disproportionately tall card.

---

# 8. Preserve Image Dimensions and Aspect Ratios

Do not make images excessively tall on mobile.

Maintain the intended aspect ratio:

```css
aspect-ratio: 16 / 9;
```

or the ratio already established by the design.

Use:

```css
object-fit: cover;
```

where appropriate.

Images should not expand vertically just because the card became full-width.

---

# 9. Preserve Section Heights

Do not allow responsive changes to unnecessarily increase the height of entire sections.

If the reference contains:

```text
Section A
↓
Section B
↓
Section C
↓
Section D
```

and all four sections are visible within a relatively compact mobile viewport, preserve that density.

Do not turn it into:

```text
Huge Section A
↓
Huge Section B
↓
Huge Section C
↓
Huge Section D
```

---

# 10. Mobile Is NOT a Redesigned Desktop

The mobile breakpoint must NOT be treated as:

> "Take desktop and stack everything."

Instead:

> "Adapt the existing composition to a smaller viewport while preserving its visual identity."

Responsive changes should be **minimal and intentional**.

Only change what is necessary because of reduced viewport width.

---

# 11. Breakpoint Changes Must Have a Reason

Before changing a component at a breakpoint, ask:

1. Does the current layout actually overflow?
2. Can the existing composition fit with smaller spacing?
3. Can horizontal scrolling solve the problem?
4. Can text truncation solve the problem?
5. Can a smaller gap/padding solve the problem?
6. Can the component use a controlled width instead of becoming full-width?

Only after these options are exhausted should the layout be structurally changed.

---

# 12. Preserve Reference Screenshots

When a reference screenshot is provided, treat it as the **visual source of truth**.

Do not reinterpret the design.

Match:

* Component dimensions
* Relative spacing
* Card proportions
* Typography scale
* Section density
* Number of visible items
* Horizontal/vertical arrangement
* Image proportions
* Navigation dimensions
* Overall visual hierarchy

The implementation should visually resemble the reference at the target viewport width.

---

# 13. Target Mobile Widths

Always test the UI at:

```text
320px
360px
375px
390px
414px
```

At each width:

* Do not unnecessarily stack components.
* Do not enlarge cards.
* Do not create excessive vertical whitespace.
* Do not break horizontal sections.
* Do not cause horizontal overflow on the PAGE itself.

Horizontal scrolling should be intentional and limited to the relevant component.

---

# 14. Page-Level Overflow

Never solve a responsive problem by allowing the entire page to overflow horizontally.

Avoid:

```css
body {
    overflow-x: auto;
}
```

Instead, isolate horizontal scrolling to the specific component:

```css
.section {
    overflow-x: auto;
}
```

The viewport should remain stable while individual carousels/rows can scroll horizontally.

---

# 15. Bottom Navigation

Mobile bottom navigation must remain:

* Compact
* Fixed to the viewport
* Consistent in height
* Easy to access
* Visually proportional

Do not allow responsive rules to make the bottom navigation excessively tall.

---

# 16. Do Not Modify Desktop While Fixing Mobile

When fixing mobile responsiveness:

**Do not alter the desktop composition unless the change is explicitly requested.**

Prefer breakpoint-specific adjustments:

```css
@media (max-width: ...)
```

or responsive utility classes.

Desktop must remain visually unchanged.

---

# 17. No "Responsive Improvements" Without Permission

Do not independently:

* Redesign cards
* Change layouts
* Increase spacing
* Stack sections
* Change typography hierarchy
* Remove horizontal scrolling
* Make components full-width
* Simplify the UI

under the assumption that it is "better for mobile."

The existing design takes priority.

---

# 18. Implementation Priority

When adapting an existing component to a smaller screen, use this priority:

### Priority 1

Preserve the existing layout.

### Priority 2

Reduce unnecessary spacing.

### Priority 3

Reduce dimensions slightly where necessary.

### Priority 4

Use truncation/clamping for text.

### Priority 5

Use horizontal scrolling for horizontally-oriented content.

### Priority 6

Reduce columns only when content genuinely cannot fit.

### Priority 7

Only as a last resort, restructure the component.

---

# 19. Definition of Done

A responsive implementation is NOT complete merely because:

* It fits the screen.
* It has no CSS errors.
* It technically responds to breakpoints.
* Lighthouse/DevTools shows no overflow.

It is complete only when:

1. The original visual composition is preserved.
2. Component dimensions remain proportional.
3. The UI maintains its intended density.
4. Horizontal sections remain horizontal.
5. Cards do not become unnecessarily large.
6. Sections do not become unnecessarily tall.
7. Mobile does not look like a vertically stacked desktop page.
8. The reference screenshot is visually matched as closely as practical.

---

# FINAL RULE

**RESPONSIVE ≠ STACK EVERYTHING.**

**SMALLER SCREEN ≠ BIGGER CARDS.**

**PRESERVE THE DESIGN FIRST. ADAPT ONLY WHEN NECESSARY.**

When in doubt, preserve the existing composition rather than inventing a new responsive layout.

```


