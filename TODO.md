# TODO: Hover Bar Issues in Elemental Grid

These issues were identified during a Copilot review and need to be addressed at a later stage:

## 1. Collapsed Hover Bar

The hover bar (`element-editor__hover-bar` and `element-editor__hover-bar-area`) is being collapsed to 0 width/height and removed from flex flow via `pointer-events: none` and other styles. In Elemental, the hover bar is the primary insertion UI between blocks; collapsing it makes the 'add between blocks' controls non-interactive/undiscoverable (and can also break keyboard focus/activation).

**Considerations:**
*   Keep hover bars functional while preventing them from consuming flex space (e.g., absolutely position them over the list with a minimal height and keep `pointer-events` enabled on the button/area).
*   Alternatively, only collapse them during active drag operations.

**Relevant CSS:**
*   `client/src/styles/bundle.scss` (Line 169 onwards)

## 2. Bootstrap Grid Conflict with Column Size Controls

Bootstrap `col-lg-*` / `offset-lg-*` classes are being applied to the `.column-size-controls` sibling. These classes will likely be interpreted by the CMS Bootstrap grid (padding/margins/width constraints), which can conflict with the popover absolute positioning (e.g., unexpected padding, max-width, or margin-left for offsets). Since positioning/width is already set via inline styles in `showControls()`, consider not applying Bootstrap grid classes to the controls element (or strip Bootstrap side effects by explicitly resetting margin/padding/max-width for `.column-size-controls`).

**Relevant Code:**
*   `client/src/bundles/bundle.js` (Line 377, refers to where `ColumnSizeComponent` is rendered and receives these classes)
*   `client/src/components/ColumnSize.js` (where `.column-size-controls` is defined)
