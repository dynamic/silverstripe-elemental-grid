import Injector from 'lib/Injector';
import React from 'react';
import { createPortal } from 'react-dom';
import ColumnSize from 'components/ColumnSize';
import AddBlockToBottomButton from 'components/AddBlockToBottomButton';
import AddBlockToTopButton from 'components/AddBlockToTopButton';

// Register core grid components
Injector.component.registerMany({
  AddBlockToBottomButton,
  AddBlockToTopButton,
  ColumnSize,
});

// Portal component to render layout controls into the card header actions
const GridControlsPortal = ({ elementId, children }) => {
  const [target, setTarget] = React.useState(null);

  React.useLayoutEffect(() => {
    let active = true;
    let attempts = 0;
    const findTarget = () => {
      if (!active) return;
      const icon = document.getElementById(`element-icon-${elementId}`);
      const headerActions = icon
        ? icon.closest('.element-editor-header')?.querySelector('.element-editor-header__actions')
        : null;
      if (headerActions) {
        setTarget(headerActions);
      } else if (attempts < 30) {
        attempts++;
        requestAnimationFrame(findTarget);
      }
    };
    findTarget();
    return () => {
      active = false;
    };
  }, [elementId]);

  if (!target) return null;
  return createPortal(children, target);
};

// Higher-order component that enhances the existing Element with grid functionality
// Uses WeakMap cache to prevent duplicate component creation
const enhancedComponentCache = new WeakMap();

const withGridFunctionality = (OriginalElement) => {
  if (enhancedComponentCache.has(OriginalElement)) {
    return enhancedComponentCache.get(OriginalElement);
  }

  const GridEnhancedElement = (props) => {
    const ColumnSizeComponent = Injector.component.get('ColumnSize');

    const { element } = props;
    const hasGridSchema = element && element.blockSchema && element.blockSchema.grid;
    const isRow = hasGridSchema && element.blockSchema.grid.isRow;

    const shouldBeRowElement = isRow ||
      element.blockSchema.typeName === 'ElementRow' ||
      element.blockSchema.typeName === 'WeDevelop\\ElementalGrid\\Models\\ElementRow' ||
      (element.title && element.title.includes('Row')) ||
      (element.blockSchema.title && element.blockSchema.title.includes('Row'));

    const shouldHaveGridControls = !shouldBeRowElement && hasGridSchema;

    const gridData = hasGridSchema ? (element.blockSchema.grid.column || {}) : {};
    const initialSize = (typeof gridData.size === 'number' && gridData.size > 0) ? gridData.size : 12;
    const initialOffset = (typeof gridData.offset === 'number' && gridData.offset > 0) ? gridData.offset : 0;

    const [currentSize, setCurrentSize] = React.useState(initialSize);
    const [currentOffset, setCurrentOffset] = React.useState(initialOffset);

    React.useEffect(() => {
      setCurrentSize(initialSize);
      setCurrentOffset(initialOffset);
    }, [initialSize, initialOffset]);

    // Apply grid classes directly to the element card via useLayoutEffect to prevent flicker
    React.useLayoutEffect(() => {
      const icon = document.getElementById(`element-icon-${element.id}`);
      const elementCard = icon ? icon.closest('.element-editor__element') : null;
      if (!elementCard) return;

      // Remove existing grid classes
      elementCard.className = elementCard.className.replace(/\bcol-lg-\d+\b/g, '');
      elementCard.className = elementCard.className.replace(/\boffset-lg-\d+\b/g, '');
      elementCard.classList.remove('is-row', 'is-fluid-row', 'is-contained-row');

      if (shouldBeRowElement) {
        const isFluid = hasGridSchema && element.blockSchema.grid.isFluid;
        elementCard.classList.add('is-row', 'col-lg-12');
        elementCard.classList.add(isFluid ? 'is-fluid-row' : 'is-contained-row');

        // Hide summary for rows
        const summary = elementCard.querySelector('.element-editor-summary');
        if (summary) summary.style.display = 'none';
      } else if (hasGridSchema) {
        elementCard.classList.add(`col-lg-${currentSize}`);
        if (currentOffset > 0) {
          elementCard.classList.add(`offset-lg-${currentOffset}`);
        }
      }

      // Re-position hover bars on grid layout adjustments
      if (typeof window.positionHoverBars === 'function') {
        requestAnimationFrame(window.positionHoverBars);
      }
    }, [element.id, shouldBeRowElement, hasGridSchema, currentSize, currentOffset]);

    const originalElement = React.createElement(OriginalElement, props);

    // Create grid controls for non-row elements
    if (shouldHaveGridControls && ColumnSizeComponent) {
      const handleChangeSize = (e, data) => {
        if (data && typeof data.value === 'number') {
          setCurrentSize(data.value);
        }
      };
      const handleChangeOffset = (e, data) => {
        if (data && typeof data.value === 'number') {
          setCurrentOffset(data.value);
        }
      };

      const gridComponent = React.createElement(ColumnSizeComponent, {
        elementId: element.id,
        areaId: props.areaId,
        size: currentSize,
        defaultViewport: gridData.defaultViewport || 'LG',
        gridColumns: element.blockSchema.grid.gridColumns || 12,
        offset: currentOffset,
        onChangeSize: handleChangeSize,
        onChangeOffset: handleChangeOffset,
        id: `grid-${element.id}`,
        autoSaveEnabled: true,
        className: 'column-size-controls',
        key: `grid-control-${element.id}`,
      });

      const portalComponent = React.createElement(GridControlsPortal, {
        elementId: element.id,
        key: `grid-portal-${element.id}`,
      }, gridComponent);

      return React.createElement(
        React.Fragment,
        { key: `grid-fragment-${element.id}` },
        originalElement,
        portalComponent
      );
    }

    return originalElement;
  };

  GridEnhancedElement.displayName = `GridEnhanced(${OriginalElement.displayName || OriginalElement.name || 'Element'})`;
  enhancedComponentCache.set(OriginalElement, GridEnhancedElement);

  return GridEnhancedElement;
};

// Center contained elements that start a new visual flex row.
// CSS can only center the first element after a contained row via the adjacent sibling
// selector (+). Elements that wrap to a new flex line don't get the centering margin.
// This function detects visual row breaks and applies the margin dynamically.
const centerContainedElements = () => {
  const list = document.querySelector('.elemental-editor-list');
  if (!list || list.classList.contains('dragging-active')) return;

  const listWidth = list.offsetWidth;
  const maxContained = Math.min(listWidth, 960);
  const centeringMargin = (listWidth - maxContained) / 2;

  // Walk through all direct children in DOM order, tracking contained/fluid state
  let inContainedSection = true; // default (before any row) is contained
  let accumulatedWidth = 0;

  const children = list.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (!el.classList.contains('element-editor__element')) continue;

    // Row elements toggle the section mode
    if (el.classList.contains('is-row')) {
      if (el.classList.contains('is-fluid-row')) {
        inContainedSection = false;
      } else {
        inContainedSection = true;
      }
      accumulatedWidth = 0;
      el.style.removeProperty('margin-left');
      // Re-apply auto centering for contained rows
      if (el.classList.contains('is-contained-row')) {
        el.style.marginLeft = 'auto';
        el.style.marginRight = 'auto';
      }
      continue;
    }

    // Non-row element in a fluid section: no centering needed
    if (!inContainedSection) {
      el.classList.remove('grid-centered');
      // Don't clear margin-left since offset classes may set it
      if (!el.className.match(/\boffset-lg-\d+\b/)) {
        el.style.removeProperty('margin-left');
      }
      accumulatedWidth += el.offsetWidth;
      continue;
    }

    // Non-row element in a contained section:
    // Determine if this element starts a new visual row
    const elWidth = el.offsetWidth;

    if (accumulatedWidth === 0 || (accumulatedWidth + elWidth) > maxContained + 1) {
      // First element on a new visual row within a contained section
      // Apply centering margin
      el.classList.add('grid-centered');

      // Check for offset class to add on top of centering
      const offsetMatch = el.className.match(/\boffset-lg-(\d+)\b/);
      if (offsetMatch) {
        const offsetCols = parseInt(offsetMatch[1], 10);
        const offsetPx = maxContained * (offsetCols / 12);
        el.style.marginLeft = `${centeringMargin + offsetPx}px`;
      } else {
        el.style.marginLeft = `${centeringMargin}px`;
      }
      accumulatedWidth = elWidth;
    } else {
      // Continuation element on the same visual row
      el.classList.remove('grid-centered');
      if (!el.className.match(/\boffset-lg-\d+\b/)) {
        el.style.removeProperty('margin-left');
      }
      accumulatedWidth += elWidth;
    }
  }
};
window.centerContainedElements = centerContainedElements;

// Calculate and update positioning for all block insertion hover bars
const positionHoverBars = () => {
  const list = document.querySelector('.elemental-editor-list');
  if (!list || list.classList.contains('dragging-active')) return;

  // Center contained elements first, then position hover bars
  centerContainedElements();

  const holders = list.querySelectorAll('.element-editor__element');
  holders.forEach(holder => {
    const hoverBar = holder.nextElementSibling;
    if (!hoverBar || !hoverBar.classList.contains('element-editor__hover-bar')) {
      return;
    }

    const nextHolder = hoverBar.nextElementSibling;
    // Check if next card is on the same vertical row level (within a 15px threshold)
    const isSideBySide = nextHolder &&
                         nextHolder.classList.contains('element-editor__element') &&
                         Math.abs(holder.offsetTop - nextHolder.offsetTop) < 15;

    if (isSideBySide) {
      // Position as a Vertical Hover Bar between columns
      hoverBar.classList.add('hover-bar--vertical');
      hoverBar.classList.remove('hover-bar--horizontal');

      const top = holder.offsetTop;
      const height = Math.max(holder.offsetHeight, nextHolder.offsetHeight);
      const left = holder.offsetLeft + holder.offsetWidth;

      hoverBar.style.position = 'absolute';
      hoverBar.style.top = `${top}px`;
      hoverBar.style.left = `${left - 10}px`;
      hoverBar.style.width = '20px';
      hoverBar.style.height = `${height}px`;
      hoverBar.style.right = 'auto';
    } else {
      // Position as a Horizontal Hover Bar below the row
      hoverBar.classList.add('hover-bar--horizontal');
      hoverBar.classList.remove('hover-bar--vertical');

      const top = holder.offsetTop + holder.offsetHeight;

      hoverBar.style.position = 'absolute';
      hoverBar.style.top = `${top - 10}px`;
      hoverBar.style.left = `${holder.offsetLeft}px`;
      hoverBar.style.width = `${holder.offsetWidth}px`;
      hoverBar.style.height = '20px';
      hoverBar.style.right = 'auto';
    }
  });
};
window.positionHoverBars = positionHoverBars;

// Initialize grid system on DOMContentLoaded
window.document.addEventListener('DOMContentLoaded', () => {
  // Guard against multiple initialization
  if (window.__GRID_SYSTEM_INITIALIZED__) return;
  window.__GRID_SYSTEM_INITIALIZED__ = true;

  // Apply Element enhancement via Injector
  Injector.transform('grid-element-enhancement', (updater) => {
    updater.component('Element', withGridFunctionality);
  });

  // Set up window resize listener (throttled)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(positionHoverBars, 150);
  });

  // Watch for the injection of .elemental-editor-list into the DOM
  const initListObserver = () => {
    const list = document.querySelector('.elemental-editor-list');
    if (!list) return false;

    if (list.__GRID_OBSERVER_INITIALIZED__) return true;
    list.__GRID_OBSERVER_INITIALIZED__ = true;

    const observer = new MutationObserver(() => {
      if (list.classList.contains('dragging-active')) return;
      requestAnimationFrame(positionHoverBars);
    });

    // Only observe child additions/removals directly on the list container
    observer.observe(list, {
      childList: true,
      subtree: false
    });

    positionHoverBars();
    return true;
  };

  // Try immediately, then fall back to observing CMS content area
  if (!initListObserver()) {
    const cmsContent = document.getElementById('cms-content') || document.body;
    const cmsObserver = new MutationObserver(() => {
      if (initListObserver()) {
        cmsObserver.disconnect();
      }
    });
    cmsObserver.observe(cmsContent, {
      childList: true,
      subtree: true
    });
  }
});

export { withGridFunctionality };

