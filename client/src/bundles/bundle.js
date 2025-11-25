/* global window, document */
import Injector from 'lib/Injector';
import React from 'react';
import { connect } from 'react-redux';
import ColumnSize from 'components/ColumnSize';

/**
 * Simplified Grid Bundle - minimal implementation focused on:
 * 1. Rendering grid controls (ColumnSize dropdowns)
 * 2. Moving controls into element cards for proper layout
 * 3. Intercepting form submissions to save grid values
 */

// Register ColumnSize component
Injector.component.registerMany({
  ColumnSize,
});

// Helper function to extract numeric ID from DOM element IDs
const extractNumericId = (domElementId) => {
  if (!domElementId) return null;
  if (/^\d+$/.test(domElementId)) return domElementId;
  const match = domElementId.match(/(\d+)$/);
  return match ? match[1] : null;
};

// Throttle function to prevent excessive calls
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Apply Bootstrap grid classes to element cards
const applyGridClassesToElement = (elementCard, size, offset) => {
  // Remove existing grid classes
  elementCard.className = elementCard.className.replace(/\bcol-lg-\d+\b/g, '');
  elementCard.className = elementCard.className.replace(/\boffset-lg-\d+\b/g, '');

  // Add new grid classes
  elementCard.classList.add(`col-lg-${size}`);
  if (offset && offset > 0) {
    elementCard.classList.add(`offset-lg-${offset}`);
  }

  // Add Bootstrap no horizontal padding class
  if (!elementCard.classList.contains('px-0')) {
    elementCard.classList.add('px-0');
  }
};

// Clean up grid classes from wrong containers
const cleanupIncorrectGridClasses = () => {
  const editorList = document.querySelector('.elemental-editor-list');
  if (editorList) {
    editorList.className = editorList.className.replace(/\bcol-lg-\d+\b/g, '');
    editorList.className = editorList.className.replace(/\boffset-lg-\d+\b/g, '');
    editorList.classList.remove('px-0');
  }
};

// Apply grid classes only - NO DOM manipulation to avoid breaking drag/drop
const applyGridClassesOnly = () => {
  // Add row class to the elemental-editor-list container for Bootstrap flexbox grid
  const elementalEditorList = document.querySelector('.elemental-editor-list');
  if (elementalEditorList && !elementalEditorList.classList.contains('row')) {
    elementalEditorList.classList.add('row');
  }

  // Find all grid controls and apply classes to their parent element cards
  const gridControls = document.querySelectorAll('.column-size-controls');

  gridControls.forEach((control) => {
    const sizeSelect = control.querySelector('[id^="columnSize-"]');
    const offsetSelect = control.querySelector('[id^="columnOffset-"]');
    if (!sizeSelect || !offsetSelect) return;

    // Find the parent element card (controls are rendered as siblings by React)
    // Walk up to find .element-editor__element
    let elementCard = control.closest('.element-editor__element');
    
    // If not inside a card, the control is a sibling - find matching card by ID
    if (!elementCard) {
      const elementId = sizeSelect.id.replace('columnSize-', '');
      const elementalList = document.querySelector('.elemental-editor-list');
      if (!elementalList) return;

      const allElementCards = elementalList.querySelectorAll('.element-editor__element');
      for (const card of allElementCards) {
        let cardElementId = card.getAttribute('data-element-id') ||
                            card.getAttribute('data-id') ||
                            card.getAttribute('data-block-id') ||
                            card.id;

        if (!cardElementId) {
          const icon = card.querySelector('[id^="element-icon-"]');
          if (icon) {
            cardElementId = icon.id.replace('element-icon-', '');
          }
        }

        const numericCardId = extractNumericId(cardElementId);
        if (numericCardId && numericCardId.toString() === elementId) {
          elementCard = card;
          break;
        }
      }
    }

    if (!elementCard) return;

    // Apply grid classes to the element card - NO appendChild/DOM movement
    if (elementCard.parentElement &&
        elementCard.parentElement.classList.contains('elemental-editor-list')) {
      applyGridClassesToElement(elementCard, sizeSelect.value, offsetSelect.value);
    }
  });
};

// Intercept form submissions to ensure grid values are saved
const interceptFormSubmissions = () => {
  document.addEventListener('submit', (e) => {
    const form = e.target;

    // Check if this is a CMS form
    if (!form.closest('.cms-content') && !form.querySelector('[name^="Elements"]')) {
      return;
    }

    // Find all grid control dropdowns
    const sizeDropdowns = document.querySelectorAll('[id^="columnSize-"]');
    const offsetDropdowns = document.querySelectorAll('[id^="columnOffset-"]');

    // Add hidden inputs for each grid control
    sizeDropdowns.forEach((dropdown) => {
      const fieldName = dropdown.getAttribute('name');
      const fieldValue = dropdown.value;

      if (fieldName && fieldValue) {
        const existingField = form.querySelector(`input[name="${fieldName}"]`);
        if (!existingField) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = fieldName;
          hiddenInput.value = fieldValue;
          hiddenInput.setAttribute('data-grid-injected', 'true');
          form.appendChild(hiddenInput);
        }
      }
    });

    offsetDropdowns.forEach((dropdown) => {
      const fieldName = dropdown.getAttribute('name');
      const fieldValue = dropdown.value;

      if (fieldName && fieldValue) {
        const existingField = form.querySelector(`input[name="${fieldName}"]`);
        if (!existingField) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = fieldName;
          hiddenInput.value = fieldValue;
          hiddenInput.setAttribute('data-grid-injected', 'true');
          form.appendChild(hiddenInput);
        }
      }
    });
  }, true);
};

// Cache for enhanced components to prevent duplicates
const enhancedComponentCache = new WeakMap();

// Higher-order component that enhances Element with grid functionality
const withGridFunctionality = (OriginalElement) => {
  // Check if already enhanced
  if (enhancedComponentCache.has(OriginalElement)) {
    return enhancedComponentCache.get(OriginalElement);
  }

  const GridEnhancedElement = (props) => {
    const ColumnSizeComponent = Injector.component.get('ColumnSize');
    const { element } = props;
    const hasGridSchema = element && element.blockSchema && element.blockSchema.grid;
    const isRow = hasGridSchema && element.blockSchema.grid.isRow;

    // Determine if this is a row element
    const shouldBeRowElement = isRow ||
      element.blockSchema.typeName === 'ElementRow' ||
      element.blockSchema.typeName === 'WeDevelop\\ElementalGrid\\Models\\ElementRow' ||
      (element.title && element.title.includes('Row')) ||
      (element.blockSchema.title && element.blockSchema.title.includes('Row'));

    // Regular elements should have grid controls unless they're rows
    const shouldHaveGridControls = !shouldBeRowElement && hasGridSchema;

    // Get grid data - note: server sends data in blockSchema.grid.column structure
    const gridData = hasGridSchema ? element.blockSchema.grid : { column: { size: 12, offset: 0 } };
    const columnData = gridData.column || { size: 12, offset: 0 };
    const defaultViewport = columnData.defaultViewport || gridData.defaultViewport || 'MD';

    // Trigger save button to show dirty state
    const triggerSaveButtonState = () => {
      const saveButton = document.querySelector('[name="action_save"]');
      if (saveButton) {
        const removeClasses = (saveButton.getAttribute('data-btn-alternate-remove') || '').split(' ');
        const addClasses = (saveButton.getAttribute('data-btn-alternate-add') || '').split(' ');
        const alternateText = saveButton.getAttribute('data-text-alternate');

        removeClasses.forEach(cls => cls && saveButton.classList.remove(cls));
        addClasses.forEach(cls => cls && saveButton.classList.add(cls));
        if (alternateText) {
          saveButton.innerHTML = alternateText;
        }
      }
    };

    const handleChangeSize = () => {
      triggerSaveButtonState();
    };

    const handleChangeOffset = () => {
      triggerSaveButtonState();
    };

    // Render original element
    const originalElement = React.createElement(OriginalElement, props);

    // If no grid controls needed, return just the original element
    if (!shouldHaveGridControls || !ColumnSizeComponent) {
      return originalElement;
    }

    // Create ColumnSize component
    const gridComponent = React.createElement(ColumnSizeComponent, {
      elementId: element.id,
      areaId: props.areaId,
      size: columnData.size || 12,
      defaultViewport: defaultViewport,
      gridColumns: gridData.gridColumns || 12,
      offset: columnData.offset || 0,
      onChangeSize: handleChangeSize,
      onChangeOffset: handleChangeOffset,
      id: `grid-${element.id}`,
    });

    // Return enhanced element with grid controls
    return React.createElement(React.Fragment, null, originalElement, gridComponent);
  };

  GridEnhancedElement.displayName = `GridEnhanced(${OriginalElement.displayName || OriginalElement.name || 'Element'})`;

  // Connect to Redux
  const ConnectedGridEnhancedElement = connect()(GridEnhancedElement);

  // Cache the enhanced component
  enhancedComponentCache.set(OriginalElement, ConnectedGridEnhancedElement);

  return ConnectedGridEnhancedElement;
};

// Throttled version for mutation observer
const throttledApplyGridClasses = throttle(applyGridClassesOnly, 200);

// Initialize when DOM is ready
window.document.addEventListener('DOMContentLoaded', () => {
  // Register the Element enhancement
  Injector.transform('grid-element-enhancement', (updater) => {
    updater.component('Element', withGridFunctionality);
  });

  // Set up form submission interceptor
  interceptFormSubmissions();

  // Initial DOM manipulation
  setTimeout(() => {
    applyGridClassesOnly();

    // Watch for DOM changes to reapply grid layout
    const observer = new MutationObserver(() => {
      throttledApplyGridClasses();
    });

    const cmsContent = document.querySelector('.cms-content');
    if (cmsContent) {
      observer.observe(cmsContent, {
        childList: true,
        subtree: true,
      });
    }
  }, 500);
});

export default withGridFunctionality;
