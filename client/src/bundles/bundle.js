import Injector from 'lib/Injector';
import React from 'react';
import ColumnSize from 'components/ColumnSize';
import AddBlockToBottomButton from 'components/AddBlockToBottomButton';
import AddBlockToTopButton from 'components/AddBlockToTopButton';
// Removed react-dnd dependent components - @dnd-kit uses wrapper pattern instead
// import Toolbar from 'components/ElementEditor/Toolbar';
// import ReactGridDropZone from 'components/ReactGridDropZone';

// Helper function to extract numeric ID from DOM element IDs  
const extractNumericId = (domElementId) => {
  if (!domElementId) return null;

  // If it's already numeric, return as string
  if (/^\d+$/.test(domElementId)) {
    return domElementId;
  }

  // Extract numeric part from DOM element IDs like "element-icon-71", "columnSize-71", etc.
  const match = domElementId.match(/(\d+)$/);
  if (match) {
    return match[1];
  }

  return null;
};

// Removed createGridDropZone and createRowDropZone functions - now working with SilverStripe's existing system

// Function to add grid drop zones around elements
// Removed addGridDropZonesAroundElement - now working with SilverStripe's existing system

// Remove console.log statements to fix linting
// console.log('[GRID DEBUG] ========== GRID BUNDLE LOADING (REACT DND INTEGRATION) ==========');
// console.log('[GRID DEBUG] Core components loaded for alongside implementation with React DnD zones');

// Removed OverruledToolbar - not needed with @dnd-kit architecture
// const OverruledToolbar = () => (props) => (
//   <div>
//     <Toolbar {...props} />
//   </div>
// );

// Register core grid components (no complex overrides)
Injector.component.registerMany({
  AddBlockToBottomButton,
  AddBlockToTopButton,
  ColumnSize,
  // ReactGridDropZone removed - @dnd-kit handles drop zones internally
});

// Cache for row elements to quickly restore during drag operations
const rowElementsCache = new Map();

// Throttle function to prevent excessive re-application
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

// Function to apply Bootstrap grid classes to wrapper divs (correct Bootstrap implementation)
const applyGridClassesToWrapper = (wrapperDiv, size, offset) => {
  // Remove existing grid classes from wrapper
  wrapperDiv.className = wrapperDiv.className.replace(/\bcol-lg-\d+\b/g, '');
  wrapperDiv.className = wrapperDiv.className.replace(/\boffset-lg-\d+\b/g, '');

  // Add new grid classes to wrapper (direct child of .row)
  wrapperDiv.classList.add(`col-lg-${size}`);

  if (offset && offset > 0) {
    wrapperDiv.classList.add(`offset-lg-${offset}`);
  }

  // Add Bootstrap no horizontal padding class to prevent padding conflicts
  if (!wrapperDiv.classList.contains('px-0')) {
    wrapperDiv.classList.add('px-0');
  }
};

// Function to clean up any incorrectly applied grid classes
const cleanupIncorrectGridClasses = () => {
  // Remove grid classes from the elemental-editor-list (wrong container)
  const editorList = document.querySelector('.elemental-editor-list');
  if (editorList) {
    editorList.className = editorList.className.replace(/\bcol-lg-\d+\b/g, '');
    editorList.className = editorList.className.replace(/\boffset-lg-\d+\b/g, '');
    editorList.classList.remove('px-0'); // Remove px-0 from wrong container
  }

  // Remove grid classes from element cards (wrong level - should be on wrapper divs)
  const elementCards = document.querySelectorAll('.element-editor__element');
  elementCards.forEach(elementCard => {
    // Only remove grid classes if they exist, preserving other classes like 'is-row'
    if (elementCard.className.match(/\bcol-lg-\d+\b/)) {
      elementCard.className = elementCard.className.replace(/\bcol-lg-\d+\b/g, '');
    }
    if (elementCard.className.match(/\boffset-lg-\d+\b/)) {
      elementCard.className = elementCard.className.replace(/\boffset-lg-\d+\b/g, '');
    }
    elementCard.classList.remove('px-0'); // Remove px-0 from element cards
  });
};

// Function to move grid controls into their respective cards
const moveGridControlsIntoCards = () => {
  // PAUSE grid manipulation during drag operations to prevent interference
  if (window.pauseGridClassManipulation || window.isDraggingElement) {
    return;
  }
  // First clean up any incorrectly applied grid classes
  cleanupIncorrectGridClasses();

  // Add row class to the elemental-editor-list container to enable Bootstrap flexbox grid
  const elementalEditorList = document.querySelector('.elemental-editor-list');
  if (elementalEditorList && !elementalEditorList.classList.contains('row')) {
    elementalEditorList.classList.add('row');
  }

  const gridControls = document.querySelectorAll('.column-size-controls');

  gridControls.forEach((control) => {
    // Find the element ID from the control inputs
    const sizeSelect = control.querySelector('[id^="columnSize-"]');
    const offsetSelect = control.querySelector('[id^="columnOffset-"]');
    if (!sizeSelect || !offsetSelect) {
      return;
    }

    // Extract element ID from the input's ID attribute (e.g., "columnSize-56" -> "56")
    const elementId = sizeSelect.id.replace('columnSize-', '');

    // Check if control is already inside an element card
    const existingElementCard = control.closest('.element-editor__element');
    if (existingElementCard) {
      // In SS6, element cards are direct children of .elemental-editor-list (no wrapper divs)
      // Apply grid classes directly to the element card
      if (existingElementCard.parentElement && existingElementCard.parentElement.classList.contains('elemental-editor-list')) {
        applyGridClassesToWrapper(existingElementCard, sizeSelect.value, offsetSelect.value);
      }
      return;
    }

    // The control is rendered as a sibling to the element card
    // Find the SPECIFIC element card that matches this control's element ID
    const elementalList = document.querySelector('.elemental-editor-list');
    if (!elementalList) {
      return;
    }

    // Find all element cards and search for the one matching this ID
    let targetElementCard = null;
    const allElementCards = elementalList.querySelectorAll('.element-editor__element');

    for (const card of allElementCards) {
      // Try to find element ID from various data attributes
      let cardElementId = card.getAttribute('data-element-id') ||
        card.getAttribute('data-id') ||
        card.getAttribute('data-block-id') ||
        card.getAttribute('data-element') ||
        card.id;

      // If no direct attribute found, try to find from element-icon-XX inside the card
      if (!cardElementId) {
        const icon = card.querySelector('[id^="element-icon-"]');
        if (icon) {
          cardElementId = icon.id.replace('element-icon-', '');
        }
      }

      const numericCardId = extractNumericId(cardElementId);

      if (numericCardId && numericCardId.toString() === elementId) {
        targetElementCard = card;
        break;
      }
    }

    if (!targetElementCard) {
      console.warn(`[GRID DEBUG] Could not find element card for control with element ID: ${elementId}`);
      return;
    }

    // Grid classes are applied via useLayoutEffect in the HOC
    // DOM manipulation is not needed - React manages the structure

    // In SS6, apply grid classes directly to the element card (no wrapper divs)
    if (targetElementCard.parentElement && targetElementCard.parentElement.classList.contains('elemental-editor-list')) {
      applyGridClassesToWrapper(targetElementCard, sizeSelect.value, offsetSelect.value);
    }

    // Listen for changes to the dropdowns and update classes
    if (!sizeSelect.hasAttribute('data-grid-listener')) {
      sizeSelect.setAttribute('data-grid-listener', 'true');
      sizeSelect.addEventListener('change', (e) => {
        if (targetElementCard.parentElement && targetElementCard.parentElement.classList.contains('elemental-editor-list')) {
          applyGridClassesToWrapper(targetElementCard, e.target.value, offsetSelect.value);
        }
      });
    }

    if (!offsetSelect.hasAttribute('data-grid-listener')) {
      offsetSelect.setAttribute('data-grid-listener', 'true');
      offsetSelect.addEventListener('change', (e) => {
        if (targetElementCard.parentElement && targetElementCard.parentElement.classList.contains('elemental-editor-list')) {
          applyGridClassesToWrapper(targetElementCard, sizeSelect.value, e.target.value);
        }
      });
    }
  });

  // Identify and handle row elements (elements without grid controls)
  const allElementCards = document.querySelectorAll('.element-editor__element');
  allElementCards.forEach((elementCard) => {
    const hasGridControls = elementCard.querySelector('.column-size-controls');
    const titleElement = elementCard.querySelector('.element-editor-header__title');
    const isRowElement = !hasGridControls ||
      (titleElement && titleElement.textContent.includes('Row block'));

    if (isRowElement) {
      // Add is-row class for identification to the element card
      if (!elementCard.classList.contains('is-row')) {
        elementCard.classList.add('is-row');
      }

      // Explicitly hide the element-editor-summary to prevent "No preview available" from showing
      const summaryElement = elementCard.querySelector('.element-editor-summary');
      if (summaryElement && summaryElement.style.display !== 'none') {
        summaryElement.style.display = 'none';
      }

      // Force row elements to be full-width breaks by applying classes to wrapper
      const wrapperDiv = elementCard.parentElement;
      if (wrapperDiv && wrapperDiv.parentElement && wrapperDiv.parentElement.classList.contains('elemental-editor-list')) {
        applyGridClassesToWrapper(wrapperDiv, 12, 0);
      }
    }
  });
};

// Function to quickly restore row element styling
const restoreRowElementStyling = () => {
  // PAUSE during drag operations to prevent interference
  if (window.pauseGridClassManipulation || window.isDraggingElement) {
    return;
  }
  const allElementCards = document.querySelectorAll('.element-editor__element');
  allElementCards.forEach((elementCard) => {
    const hasGridControls = elementCard.querySelector('.column-size-controls');
    const titleElement = elementCard.querySelector('.element-editor-header__title');
    const isRowElement = !hasGridControls ||
      (titleElement && titleElement.textContent.includes('Row block'));

    if (isRowElement) {
      // Add is-row class if missing
      if (!elementCard.classList.contains('is-row')) {
        elementCard.classList.add('is-row');
      }

      // Explicitly hide the element-editor-summary to prevent "No preview available" from showing
      const summaryElement = elementCard.querySelector('.element-editor-summary');
      if (summaryElement && summaryElement.style.display !== 'none') {
        summaryElement.style.display = 'none';
      }

      // Restore grid classes to wrapper if needed
      const wrapperDiv = elementCard.parentElement;
      if (wrapperDiv && wrapperDiv.parentElement && wrapperDiv.parentElement.classList.contains('elemental-editor-list')) {
        if (!wrapperDiv.classList.contains('col-lg-12')) {
          applyGridClassesToWrapper(wrapperDiv, 12, 0);
        }
      }
    }
  });
};

// Throttled version for high-frequency events
const throttledRestoreRowStyling = throttle(restoreRowElementStyling, 100);
const throttledMoveGridControls = throttle(moveGridControlsIntoCards, 200);

// Create a higher-order component that enhances the existing Element with grid functionality
// CRITICAL: Prevent duplicate component creation by caching enhanced components
const enhancedComponentCache = new WeakMap();

const withGridFunctionality = (OriginalElement) => {
  // Check if we've already enhanced this component
  if (enhancedComponentCache.has(OriginalElement)) {
    return enhancedComponentCache.get(OriginalElement);
  }

  const GridEnhancedElement = (props) => {
    // Get the ColumnSize component from Injector
    const ColumnSizeComponent = Injector.component.get('ColumnSize');

    // Check if this element needs grid functionality
    const { element } = props;
    const hasGridSchema = element && element.blockSchema && element.blockSchema.grid;
    const isRow = hasGridSchema && element.blockSchema.grid.isRow;

    // Determine if this is a row element (container type that shouldn't have grid controls)
    const shouldBeRowElement = isRow ||
      element.blockSchema.typeName === 'ElementRow' ||
      element.blockSchema.typeName === 'WeDevelop\\ElementalGrid\\Models\\ElementRow' ||
      (element.title && element.title.includes('Row')) ||
      (element.blockSchema.title && element.blockSchema.title.includes('Row'));

    // Regular elements SHOULD have grid controls unless they're rows
    const shouldHaveGridControls = !shouldBeRowElement && hasGridSchema;

    // Get initial grid data from props
    const gridData = hasGridSchema ? (element.blockSchema.grid.column || {}) : {};
    const initialSize = (typeof gridData.size === 'number' && gridData.size > 0) ? gridData.size : 12;
    const initialOffset = (typeof gridData.offset === 'number' && gridData.offset > 0) ? gridData.offset : 0;

    // Use state to track current size/offset for live updates
    const [currentSize, setCurrentSize] = React.useState(initialSize);
    const [currentOffset, setCurrentOffset] = React.useState(initialOffset);

    // Update state when props change (e.g., after save)
    React.useEffect(() => {
      setCurrentSize(initialSize);
      setCurrentOffset(initialOffset);
    }, [initialSize, initialOffset]);

    // Apply grid classes directly to the element-editor__element via useLayoutEffect
    // Using useLayoutEffect (not useEffect) to prevent visual flicker
    React.useLayoutEffect(() => {
      // Find the element card - use element-icon-{id} to traverse up since data-id isn't reliable
      const icon = document.getElementById(`element-icon-${element.id}`);
      const elementCard = icon ? icon.closest('.element-editor__element') : null;
      if (!elementCard) {
        console.warn(`[GRID] Could not find element card for ID ${element.id}`);
        return;
      }

      // Remove existing grid classes
      elementCard.className = elementCard.className.replace(/\bcol-lg-\d+\b/g, '');
      elementCard.className = elementCard.className.replace(/\boffset-lg-\d+\b/g, '');
      elementCard.classList.remove('is-row');

      // Add grid classes
      if (shouldBeRowElement) {
        elementCard.classList.add('is-row', 'col-lg-12');
        // Hide summary for rows
        const summary = elementCard.querySelector('.element-editor-summary');
        if (summary) summary.style.display = 'none';
      } else if (hasGridSchema) {
        elementCard.classList.add(`col-lg-${currentSize}`);
        if (currentOffset > 0) {
          elementCard.classList.add(`offset-lg-${currentOffset}`);
        }
      }
    }, [element.id, shouldBeRowElement, hasGridSchema, currentSize, currentOffset]);

    // Pass through original props - don't modify sortable behavior
    const enhancedProps = {
      ...props,
    };

    // Render the original element
    const originalElement = React.createElement(OriginalElement, enhancedProps);

    // Create grid controls for non-row elements
    if (shouldHaveGridControls && !shouldBeRowElement && ColumnSizeComponent) {
      // Handle size/offset changes - update local state for immediate CSS update
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

      // Return Fragment with element + controls (no wrapper div!)
      return React.createElement(React.Fragment, { key: `grid-fragment-${element.id}` }, [
        originalElement,
        gridComponent,
      ]);
    }

    // For rows or elements without grid schema, just return the original
    return originalElement;
  };

  GridEnhancedElement.displayName = `GridEnhanced(${OriginalElement.displayName || OriginalElement.name || 'Element'})`;

  // Cache the enhanced component
  enhancedComponentCache.set(OriginalElement, GridEnhancedElement);

  return GridEnhancedElement;
};

// NOTE: window.reapplyGridClasses disabled - grid classes are now managed by React HOC
// Calling moveGridControlsIntoCards() would overwrite the correct React-applied classes
// window.reapplyGridClasses = () => {
//   moveGridControlsIntoCards();
// };

// Intercept form submissions to ensure grid values are included
const interceptFormSubmissions = () => {
  // Listen for form submissions in the CMS
  document.addEventListener('submit', (e) => {
    const form = e.target;

    // Check if this is an element form that might have grid controls
    if (!form.closest('.cms-content') && !form.querySelector('[name^="Elements"]')) {
      return; // Not a CMS form, ignore
    }

    // Find all grid control dropdowns in the page
    const sizeDropdowns = document.querySelectorAll('[id^="columnSize-"]');
    const offsetDropdowns = document.querySelectorAll('[id^="columnOffset-"]');

    // Add hidden inputs for each grid control to ensure values are submitted
    sizeDropdowns.forEach((dropdown) => {
      const fieldName = dropdown.getAttribute('name');
      const fieldValue = dropdown.value;

      if (fieldName && fieldValue) {
        // Check if field already exists in form
        const existingField = form.querySelector(`input[name="${fieldName}"]`);
        if (!existingField) {
          // Create hidden input
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = fieldName;
          hiddenInput.value = fieldValue;
          hiddenInput.setAttribute('data-grid-injected', 'true');
          form.appendChild(hiddenInput);
          console.log('[GRID] Injected size field:', fieldName, '=', fieldValue);
        }
      }
    });

    offsetDropdowns.forEach((dropdown) => {
      const fieldName = dropdown.getAttribute('name');
      const fieldValue = dropdown.value;

      if (fieldName && fieldValue) {
        // Check if field already exists in form
        const existingField = form.querySelector(`input[name="${fieldName}"]`);
        if (!existingField) {
          // Create hidden input
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = fieldName;
          hiddenInput.value = fieldValue;
          hiddenInput.setAttribute('data-grid-injected', 'true');
          form.appendChild(hiddenInput);
          console.log('[GRID] Injected offset field:', fieldName, '=', fieldValue);
        }
      }
    });
  }, true); // Use capture phase to ensure we intercept before React

  console.log('[GRID DEBUG] Form submission interceptor installed');
};

// Add event listeners for drag operations
const addDragEventListeners = () => {
  // Listen for drag start events
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.element-editor__element')) {
      // Mark that we're in a drag operation
      window.isDraggingElement = true;

      // Capture the dragged element ID for our drop zones
      const draggedElement = e.target.closest('.element-editor__element');
      if (draggedElement) {
        // Debug: log all attributes to see what's available
        console.log('[GRID DEBUG] Dragged element attributes:', {
          tagName: draggedElement.tagName,
          className: draggedElement.className,
          id: draggedElement.id,
          attributes: Array.from(draggedElement.attributes).map(attr => `${attr.name}="${attr.value}"`),
          innerHTML: `${draggedElement.innerHTML.substring(0, 500)}...`
        });

        // Look for all elements with ID attributes to understand the structure
        const elementsWithIds = draggedElement.querySelectorAll('[id]');
        console.log('[GRID DEBUG] All child elements with IDs:');
        Array.from(elementsWithIds).forEach((el, index) => {
          console.log(`  [${index}] ${el.tagName} id="${el.id}" class="${el.className}"`);
        });

        // Look for any data attributes that might contain the block ID
        const allElements = [draggedElement, ...draggedElement.querySelectorAll('*')];
        const dataAttributes = [];
        allElements.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
              dataAttributes.push({ element: el.tagName, attribute: attr.name, value: attr.value });
            }
          });
        });
        console.log('[GRID DEBUG] All data attributes in dragged element:');
        dataAttributes.forEach((attr, index) => {
          console.log(`  [${index}] ${attr.element} ${attr.attribute}="${attr.value}"`);
        });

        const elementId = draggedElement.getAttribute('data-element-id') ||
          draggedElement.getAttribute('data-id') ||
          draggedElement.getAttribute('data-block-id') ||
          draggedElement.getAttribute('data-element') ||
          draggedElement.id;
        const numericElementId = extractNumericId(elementId);
        window.currentDraggedElement = numericElementId;
        console.log('[GRID DEBUG] Captured dragged element ID on drag start:', elementId, '-> converted to numeric:', numericElementId);

        // If still no ID, try to find it in child elements
        if (!elementId) {
          const childWithId = draggedElement.querySelector('[data-element-id], [data-id], [data-block-id], [id]');
          if (childWithId) {
            const childId = childWithId.getAttribute('data-element-id') ||
              childWithId.getAttribute('data-id') ||
              childWithId.getAttribute('data-block-id') ||
              childWithId.id;
            const numericChildId = extractNumericId(childId);
            window.currentDraggedElement = numericChildId;
            console.log('[GRID DEBUG] Found element ID in child element:', childId, '-> converted to numeric:', numericChildId);
          }
        }
      }

      // Add fallback class for browsers without :has() support
      const elementalList = document.querySelector('.elemental-editor-list');
      if (elementalList) {
        elementalList.classList.add('dragging-active');
      }

      // STOP grid class manipulation during drag to prevent interference
      window.pauseGridClassManipulation = true;

      // Cache current row elements state
      rowElementsCache.clear();
      document.querySelectorAll('.element-editor__element.is-row').forEach((row) => {
        rowElementsCache.set(row, {
          hasIsRowClass: row.classList.contains('is-row'),
          wrapperGridClasses: row.parentElement ? row.parentElement.className : ''
        });
      });
    }
  });

  // Listen for drag end events
  document.addEventListener('dragend', (e) => {
    if (e.target.closest('.element-editor__element')) {
      // Clear the drag flag
      window.isDraggingElement = false;
      window.pauseGridClassManipulation = false;

      // Clear the captured element ID
      window.currentDraggedElement = null;

      // Remove fallback class for browsers without :has() support
      const elementalList = document.querySelector('.elemental-editor-list');
      if (elementalList) {
        elementalList.classList.remove('dragging-active');
      }

      // Re-apply grid classes after a short delay to ensure DOM is stable
      setTimeout(() => {
        moveGridControlsIntoCards();
      }, 100);

      // Clear cache
      setTimeout(() => {
        rowElementsCache.clear();
      }, 1000);
    }
  });

  // Listen for drop events
  document.addEventListener('drop', (e) => {
    if (e.target.closest('.elemental-editor-list')) {
      // Re-apply grid classes immediately using requestAnimationFrame
      requestAnimationFrame(() => {
        moveGridControlsIntoCards();
      });
    }
  });

  // Listen for drag over events to catch styling loss during hover
  document.addEventListener('dragover', (e) => {
    if (window.isDraggingElement && e.target.closest('.elemental-editor-list')) {
      // Throttled restoration to prevent excessive calls
      throttledRestoreRowStyling();
    }
  });

  // Listen for drag enter events for immediate restoration
  document.addEventListener('dragenter', (e) => {
    if (window.isDraggingElement) {
      const targetElement = e.target.closest('.element-editor__element');
      if (targetElement && targetElement.classList.contains('is-row')) {
        // Immediately restore styling for row elements being hovered
        restoreRowElementStyling();
      }
    }
  });

  // Listen for drag leave events
  document.addEventListener('dragleave', (e) => {
    if (window.isDraggingElement && e.target.closest('.element-editor__element')) {
      // Small delay restoration to catch React re-renders
      setTimeout(() => {
        if (window.isDraggingElement) {
          throttledRestoreRowStyling();
        }
      }, 50);
    }
  });
};

// Hover bar enhancements removed - we now use our own drop zones for visual feedback

// Removed custom drop zone injection - now working with SilverStripe's existing system

// Trigger existing SilverStripe hover bar functionality
const triggerHoverBarClick = (hoverBar) => {
  if (!hoverBar) return;

  console.log('[GRID DEBUG] Attempting to trigger hover bar click');

  // Find the button inside the hover bar
  const hoverButton = hoverBar.querySelector('.element-editor__hover-bar-area');
  if (hoverButton) {
    console.log('[GRID DEBUG] Found hover bar button, triggering click');
    hoverButton.click();
  } else {
    console.log('[GRID DEBUG] No hover bar button found');
  }
};

// Helper function to get element ID from any element using our detection method
const getElementIdFromElement = (element) => {
  if (!element) return null;

  // Try direct attributes first
  const directId = element.getAttribute('data-element-id') ||
    element.getAttribute('data-id') ||
    element.getAttribute('data-block-id') ||
    element.getAttribute('data-element') ||
    element.id;

  if (directId) return extractNumericId(directId);

  // Try to find ID in child elements
  const childWithId = element.querySelector('[data-element-id], [data-id], [data-block-id], [id]');
  if (childWithId) {
    const childId = childWithId.getAttribute('data-element-id') ||
      childWithId.getAttribute('data-id') ||
      childWithId.getAttribute('data-block-id') ||
      childWithId.id;
    return extractNumericId(childId);
  }

  return null;
};



// Calculate insertion position for grid drop zones
const calculateGridInsertionPosition = (position, targetElement) => {
  const targetElementId = getElementIdFromElement(targetElement);
  const elementWrapper = targetElement.parentElement;

  console.log('[GRID DEBUG] Calculating insertion for position:', position, 'target:', targetElementId);

  if (!elementWrapper) {
    console.warn('[GRID DEBUG] No element wrapper found');
    // Find any element to use as reference instead of null
    const anyElement = document.querySelector('.element-editor__element');
    const anyElementId = getElementIdFromElement(anyElement);
    return { insertAfterElementId: anyElementId || 'fallback', dropSpot: 'bottom' };
  }

  // Find all elements in the list to understand positioning
  const elementsList = elementWrapper.parentElement;
  const allElements = Array.from(elementsList.children).filter(child =>
    child.querySelector('.element-editor__element')
  );

  const currentIndex = allElements.findIndex(element =>
    element.querySelector('.element-editor__element') === targetElement
  );

  console.log('[GRID DEBUG] Current element index:', currentIndex, 'of', allElements.length);

  switch (position) {
    case 'left':
      // Insert before this element (same row, left position)
      if (currentIndex > 0) {
        const prevElement = allElements[currentIndex - 1].querySelector('.element-editor__element');
        const prevElementId = getElementIdFromElement(prevElement);
        return { insertAfterElementId: prevElementId, dropSpot: 'bottom' };
      }
      // For inserting at the beginning, we need a valid element ID instead of null
      const firstElement = allElements[0].querySelector('.element-editor__element');
      const firstElementId = getElementIdFromElement(firstElement);
      return { insertAfterElementId: firstElementId, dropSpot: 'top' };

    case 'right':
      // Insert after this element (same row, right position)
      return { insertAfterElementId: targetElementId, dropSpot: 'bottom' };

    case 'above':
      // Insert before this element (new row above)
      if (currentIndex > 0) {
        const prevElement = allElements[currentIndex - 1].querySelector('.element-editor__element');
        const prevElementId = getElementIdFromElement(prevElement);
        return { insertAfterElementId: prevElementId, dropSpot: 'bottom' };
      }
      // For inserting at the beginning, we need a valid element ID instead of null
      const firstElementForAbove = allElements[0].querySelector('.element-editor__element');
      const firstElementIdForAbove = getElementIdFromElement(firstElementForAbove);
      return { insertAfterElementId: firstElementIdForAbove, dropSpot: 'top' };

    case 'below':
      // Insert after this element (new row below)
      return { insertAfterElementId: targetElementId, dropSpot: 'bottom' };

    default:
      console.warn('[GRID DEBUG] Unknown position:', position);
      return { insertAfterElementId: targetElementId || 'fallback', dropSpot: 'bottom' };
  }
};

// Old manual drag/drop event handling removed - React DnD components handle this now

// Trigger SilverStripe's drag end handler with the correct parameters
const triggerSilverStripeDragEnd = (draggedElementId, insertAfterElementId) => {
  console.log('[GRID DEBUG] Triggering SilverStripe drag end:', { draggedElementId, insertAfterElementId });

  // Try multiple methods to trigger the drag end
  const elementList = document.querySelector('.elemental-editor-list');
  if (!elementList) {
    console.warn('[GRID DEBUG] Could not find elemental-editor-list');
    return;
  }

  // Method 1: Try React fiber (React 17/18)
  const fiberKey = Object.keys(elementList).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
  if (fiberKey && elementList[fiberKey]) {
    let reactComponent = elementList[fiberKey];
    let attempts = 0;
    while (reactComponent && attempts < 10) {
      if (reactComponent.memoizedProps && reactComponent.memoizedProps.onDragEnd) {
        console.log('[GRID DEBUG] Found React component with onDragEnd handler via fiber');
        reactComponent.memoizedProps.onDragEnd(draggedElementId, insertAfterElementId);
        return;
      }
      reactComponent = reactComponent.return || reactComponent.child;
      attempts++;
    }
  }

  // Method 2: Try to find React instance via properties
  if (elementList._reactInternalInstance) {
    let reactComponent = elementList._reactInternalInstance;
    let attempts = 0;
    while (reactComponent && attempts < 10) {
      if (reactComponent.props && reactComponent.props.onDragEnd) {
        console.log('[GRID DEBUG] Found React component with onDragEnd handler via instance');
        reactComponent.props.onDragEnd(draggedElementId, insertAfterElementId);
        return;
      }
      reactComponent = reactComponent._currentElement && reactComponent._currentElement._owner;
      attempts++;
    }
  }

  // Method 3: Fallback - try to simulate a hover bar click for the same effect
  console.log('[GRID DEBUG] React component access failed, falling back to hover bar simulation');
  const targetElement = document.querySelector(`[data-element-id="${insertAfterElementId}"]`) ||
    document.querySelector('.element-editor__element');

  if (targetElement) {
    const elementWrapper = targetElement.parentElement;
    const hoverBar = elementWrapper && elementWrapper.nextElementSibling;
    if (hoverBar && hoverBar.classList.contains('element-editor__hover-bar')) {
      console.log('[GRID DEBUG] Triggering hover bar as fallback');
      triggerHoverBarClick(hoverBar);
    }
  }
};

// Helper function to get area ID from the context
const getAreaIdFromContext = (targetElement) => {
  // Try to find the area ID from the elemental editor list
  const elementalList = targetElement.closest('.elemental-editor-list');
  if (elementalList) {
    // Look for data attributes or React fiber props that contain area ID
    const areaIdAttribute = elementalList.getAttribute('data-area-id');
    if (areaIdAttribute) {
      return parseInt(areaIdAttribute, 10);
    }
  }

  // Fallback: try to extract from URL or other context
  const urlParams = new URLSearchParams(window.location.search);
  const areaIdFromUrl = urlParams.get('ElementalAreaID');
  if (areaIdFromUrl) {
    return parseInt(areaIdFromUrl, 10);
  }

  // Default fallback
  console.warn('[GRID DEBUG] Could not determine area ID, using default');
  return 1;
};

// Helper function to trigger the appropriate hover bar based on position
const triggerHoverBarForPosition = (targetElement, position) => {
  const elementWrapper = targetElement.parentElement;
  if (!elementWrapper) return;

  let hoverBar = null;

  if (position === 'left' || position === 'above') {
    // For left/above positions, use the hover bar before this element
    hoverBar = elementWrapper.previousElementSibling;
  } else if (position === 'right' || position === 'below') {
    // For right/below positions, use the hover bar after this element
    hoverBar = elementWrapper.nextElementSibling;
  }

  if (hoverBar && hoverBar.classList.contains('element-editor__hover-bar')) {
    console.log('[GRID DEBUG] Triggering hover bar for', position, 'position');
    triggerHoverBarClick(hoverBar);
  } else {
    console.log('[GRID DEBUG] No hover bar found for', position, 'position');
  }
};

// Prevent multiple initialization - use window object for cross-bundle scope
window.document.addEventListener('DOMContentLoaded', () => {
  // CRITICAL: Guard against multiple initialization (memory leak prevention)
  // Use window object to ensure this persists across bundle reloads
  if (window.__GRID_SYSTEM_INITIALIZED__) {
    console.warn('[GRID] Already initialized (cross-bundle check), skipping duplicate setup');
    return;
  }
  window.__GRID_SYSTEM_INITIALIZED__ = true;

  console.log('[GRID DEBUG] DOMContentLoaded - Starting alongside grid enhancements...');

  // Keep the Element enhancement (this works well)
  console.log('[GRID DEBUG] Applying Element enhancement...');
  Injector.transform('grid-element-enhancement', (updater) => {
    updater.component('Element', withGridFunctionality);
    console.log('[GRID DEBUG] Element enhanced with grid functionality');
  });

  // Removed toolbar enhancement - not needed with @dnd-kit architecture

  // NOTE: Native drag event listeners removed - @dnd-kit uses pointer events internally
  // and native HTML5 drag events conflict with its state management.
  // Grid class application now happens via React useLayoutEffect in withGridFunctionality.

  // Set up form submission interceptor to ensure grid values are saved
  interceptFormSubmissions();

  // NOTE: moveGridControlsIntoCards() DISABLED on initial load
  // Grid classes are now applied directly by the React HOC (withGridFunctionality)
  // Calling moveGridControlsIntoCards() here would OVERWRITE the correct React-applied classes
  setTimeout(() => {
    // moveGridControlsIntoCards(); // DISABLED - conflicts with React
    console.log('[GRID DEBUG] Grid enhancements applied - initial setup complete (React HOC manages classes)');

    // NOTE: MutationObserver DISABLED
    // The observer was causing conflicts with @dnd-kit during drag operations.
    // @dnd-kit manages its own DOM updates, and our observer triggering
    // moveGridControlsIntoCards() during those updates causes React
    // reconciliation errors (removeChild error).
    // 
    // Grid classes are now managed via:
    // 1. Initial application on DOMContentLoaded (above)
    // 2. React useLayoutEffect in withGridFunctionality HOC
    // 3. ColumnSize component onChange handlers
    //
    // If new elements don't get grid classes after save, consider
    // implementing a lighter-weight solution that doesn't conflict
    // with @dnd-kit (e.g., hook into SilverStripe's form save events).
  }, 1000);
});
