# Custom Grid Interface Plan

## Overview

This document outlines a potential approach to replace/augment the default Elemental interface with a custom grid-aware interface inspired by modern block editors like Genesis Blocks.

## Current State

### Branch: `feature/traditional-form-submission` (commit 69ae17a)
- Minimal HOC approach that works
- Grid values persist correctly
- Drag/drop preserved
- Layout quirk: controls render as siblings

### Reference: commit `69530ed7`
- Redux Form autofill approach
- Controls render inside element cards
- More complex component replacement
- Uses `{ force: true }` component registration (SS5 pattern)

## Option 3: Custom Grid Interface

### Inspiration
- [Genesis Blocks](https://wordpress.org/plugins/genesis-blocks/) - WordPress
- Modern drag/drop interfaces with visual grid preview
- Real-time column width visualization

### Key Features to Implement

1. **Visual Grid Preview**
   - Show column boundaries while editing
   - Real-time width/offset visualization
   - Snap-to-grid behavior

2. **Inline Grid Controls**
   - Resize handles on element edges
   - Drag-to-resize columns
   - Quick-access toolbar for size presets

3. **Modern Add Block UX**
   - Keep "add between blocks" (team preference)
   - Grid-aware block insertion
   - Row auto-creation

4. **Responsive Preview**
   - Toggle viewport sizes
   - Preview how grid responds
   - Per-breakpoint controls

### Architecture Options

#### A. Complete React Override
Replace Elemental's ElementEditor entirely:

```javascript
Injector.component.registerMany({
  ElementEditor: CustomGridEditor,
}, { force: true });
```

**Pros:**
- Full control over UX
- Can implement any design

**Cons:**
- Must reimplement all Elemental features
- Maintenance burden
- May break on Elemental updates

#### B. Enhanced Elemental Extension
Keep Elemental but heavily customize:

```javascript
Injector.transform('grid-interface', (updater) => {
  updater.component('ElementList', withGridVisualization);
  updater.component('Element', withResizeHandles);
  updater.component('AddElementPopover', withGridAwarePlacement);
});
```

**Pros:**
- Leverages existing Elemental code
- Less maintenance
- Benefits from Elemental updates

**Cons:**
- Limited by Elemental's architecture
- May hit constraints

#### C. Hybrid Approach
Use Elemental for data management, custom UI for editing:

```javascript
// Custom grid editor that uses Elemental's GraphQL/mutations
// but completely own UI
```

**Pros:**
- Best of both worlds
- Data layer handled by Elemental
- Full UI control

**Cons:**
- Complexity
- Two code paths to maintain

### Recommended Approach

**Start with Option B (Enhanced Extension)**, then migrate to C if needed.

### Implementation Phases

#### Phase 1: Visual Grid Preview (2-3 days)
- Add grid overlay CSS
- Show column boundaries
- Visual feedback on hover

#### Phase 2: Inline Resize (3-5 days)
- Resize handle components
- Drag-to-resize functionality
- Snap-to-grid logic

#### Phase 3: Modern Controls (2-3 days)
- Quick-size toolbar
- Preset buttons (1/2, 1/3, 1/4, etc.)
- Offset controls

#### Phase 4: Responsive Preview (2-3 days)
- Viewport toggle
- Per-breakpoint editing
- Preview panel

### Technical Considerations

1. **@dnd-kit Integration**
   - SS6 Elemental uses `@dnd-kit` for drag/drop
   - Must work alongside existing sortable behavior
   - Resize handles need separate drag context

2. **State Management**
   - Grid state needs real-time sync
   - Consider local state vs Redux
   - Optimistic updates for UX

3. **GraphQL Mutations**
   - Elemental uses GraphQL for persistence
   - Grid values may need custom mutation
   - Batch updates for performance

4. **CSS Framework**
   - Elemental uses Bootstrap grid
   - Consider CSS Grid for editor UI
   - Ensure consistency with frontend output

### Files to Create/Modify

```
client/src/
├── components/
│   ├── GridEditor/
│   │   ├── GridEditor.js           # Main container
│   │   ├── GridOverlay.js          # Visual grid lines
│   │   ├── ResizableElement.js     # Element with resize handles
│   │   ├── GridToolbar.js          # Size/offset quick controls
│   │   └── ResponsiveToggle.js     # Viewport switcher
│   └── ColumnSize.js               # Keep existing (fallback)
├── styles/
│   ├── grid-editor.scss
│   └── resize-handles.scss
└── bundles/
    └── bundle.js                   # Entry point
```

### Decision Points

Before proceeding, decide:

1. **Scope**: Full replacement or enhancement?
2. **Timeline**: MVP in weeks or full feature in months?
3. **Team**: Who will maintain this long-term?
4. **Compatibility**: Must work with existing content?

### Next Steps

1. [ ] Review this plan with team
2. [ ] Decide on approach (A, B, or C)
3. [ ] Create mockups/wireframes
4. [ ] Prototype Phase 1 (visual grid preview)
5. [ ] User testing feedback
6. [ ] Iterate based on feedback

---

## References

- [Genesis Blocks](https://wordpress.org/plugins/genesis-blocks/)
- [Gutenberg Block Editor](https://developer.wordpress.org/block-editor/)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [SS6 Elemental Source](https://github.com/silverstripe/silverstripe-elemental)
- Working SS5 implementation: `skanaaluminum` site
