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

#### C. Hybrid Approach (SELECTED)
Custom UI that uses Elemental's data layer and Redux Form for persistence:

```javascript
// Custom grid editor with own UI
// Uses Redux Form autofill for persistence (like SS5 approach)
// Example from working SS5 ColumnSize.js:
this.props.actions.reduxForm.autofill(
  `element.ElementForm_${elementId}`,
  `PageElements_${elementId}_Size${defaultViewport}`,
  event.target.value
);
```

**Pros:**
- Full UI control - can implement Genesis Blocks style interface
- Proven persistence mechanism (Redux Form autofill)
- Data layer handled by Elemental's existing forms
- Can evolve UI independently

**Cons:**
- Need to understand Redux Form integration
- Must maintain custom UI code

### Recommended Approach

**Option C (Hybrid)** - Custom UI with Redux Form autofill for persistence.

Key insight: GraphQL has been removed from SS6 Elemental. The SS5 pattern of using
`redux-form.autofill()` to inject values into Elemental's form state is still the
correct approach for persisting grid values.

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

2. **State Management & Persistence**
   - **Redux Form autofill is the correct approach** (not GraphQL)
   - SS5 pattern: `reduxForm.autofill(formName, fieldName, value)`
   - Form name format: `element.ElementForm_${elementId}`
   - Field name format: `PageElements_${elementId}_Size${viewport}`
   - This marks form dirty and includes values in submission

3. **Form Integration**
   - Elemental uses Redux Form for inline editing
   - Grid values must be injected into form state
   - Reference: commit `69530ed7` for working autofill implementation
   - Reference: SS5 `ColumnSize.js` in skanaaluminum site

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

---

## Key Code References

### SS5 Redux Form Autofill Pattern (from ColumnSize.js)

```javascript
import { autofill } from 'redux-form';
import { compose, bindActionCreators } from 'redux';
import { connect } from 'react-redux';

// In component:
handleChangeSize(event) {
  const { elementId, defaultViewport } = this.props;
  this.props.actions.reduxForm.autofill(
    `element.ElementForm_${elementId}`,
    `PageElements_${elementId}_Size${defaultViewport}`,
    event.target.value
  );
  // Also update local state for UI
  this.props.handleChangeSize(event);
}

// Connect to Redux:
function mapDispatchToProps(dispatch) {
  return {
    actions: {
      reduxForm: bindActionCreators({ autofill }, dispatch),
    },
  };
}

export default compose(
  connect(() => {}, mapDispatchToProps)
)(ColumnSize);
```

### Commit References

| Commit | Description |
|--------|-------------|
| `69530ed7` | Redux Form autofill approach (Option 2 - partial) |
| `69ae17a` | Minimal HOC approach (current stable) |
