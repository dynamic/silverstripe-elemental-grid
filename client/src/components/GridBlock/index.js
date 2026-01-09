import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { autofill } from 'redux-form';
import BlockControls from 'components/BlockControls';

const GridBlock = (OriginalComponent) => {
  const GridBlockComponent = (props) => {
    const { element, dispatch } = props;
    const [elementNode, setElementNode] = useState(null);

    // Get grid data
    const gridData = element.blockSchema?.grid || {};
    const columnData = gridData.column || { size: 12, offset: 0 };
    const size = parseInt(columnData.size || 12, 10);
    const offset = parseInt(columnData.offset || 0, 10);

    // Find the DOM node
    useEffect(() => {
      const node = document.querySelector(`.element-editor__element[data-id="${element.id}"]`) 
        || document.querySelector(`[data-element-id="${element.id}"]`)?.closest('.element-editor__element');
      
      if (node && node !== elementNode) {
        setElementNode(node);
      }
    });

    // Apply classes
    useEffect(() => {
      if (elementNode) {
        // Remove old grid classes
        elementNode.className = elementNode.className.replace(/\bcol-md-\d+\b/g, '');
        elementNode.className = elementNode.className.replace(/\boffset-md-\d+\b/g, '');
        
        // Add new classes
        elementNode.classList.add(`col-md-${size}`);
        if (offset > 0) {
          elementNode.classList.add(`offset-md-${offset}`);
        }
        
        // Ensure the parent list has the 'row' class
        if (elementNode.parentElement && !elementNode.parentElement.classList.contains('row')) {
          elementNode.parentElement.classList.add('row');
        }
        
        // Ensure relative positioning for controls
        if (getComputedStyle(elementNode).position === 'static') {
          elementNode.style.position = 'relative';
        }
      }
    }, [elementNode, size, offset]);

    const handleSizeChange = (newSize) => {
      const fieldName = `Elements[${element.id}][SizeMD]`;
      dispatch(autofill('page-form', fieldName, newSize));
      
      // Trigger save button (dirty state)
      // We might need a more robust way to mark form dirty if autofill doesn't do it automatically for hidden fields
      // But usually Redux Form handles it.
    };

    const handleOffsetChange = (newOffset) => {
      const fieldName = `Elements[${element.id}][OffsetMD]`;
      dispatch(autofill('page-form', fieldName, newOffset));
    };

    return (
      <>
        <OriginalComponent {...props} />
        {elementNode && ReactDOM.createPortal(
          <BlockControls 
            elementId={element.id}
            size={size}
            offset={offset}
            onChangeSize={handleSizeChange}
            onChangeOffset={handleOffsetChange}
          />,
          elementNode
        )}
      </>
    );
  };

  return connect()(GridBlockComponent);
};

export default GridBlock;
