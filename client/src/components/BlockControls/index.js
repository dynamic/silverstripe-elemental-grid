import React from 'react';
import PropTypes from 'prop-types';

const BlockControls = ({ elementId, size, offset, onChangeSize, onChangeOffset }) => {
  return (
    <div className="grid-block-controls">
      <div className="grid-block-controls__header">
        <span className="grid-block-controls__label">Width: {size}/12</span>
        <div className="grid-block-controls__actions">
          <button 
            type="button" 
            className="grid-btn grid-btn--minus"
            onClick={() => onChangeSize(Math.max(1, size - 1))}
            disabled={size <= 1}
            title="Decrease width"
          >-</button>
          <button 
            type="button" 
            className="grid-btn grid-btn--plus"
            onClick={() => onChangeSize(Math.min(12, size + 1))}
            disabled={size >= 12}
            title="Increase width"
          >+</button>
        </div>
      </div>
      
      <div className="grid-block-controls__row">
        <span className="grid-block-controls__label">Offset: {offset}</span>
        <div className="grid-block-controls__actions">
          <button 
            type="button" 
            className="grid-btn grid-btn--minus"
            onClick={() => onChangeOffset(Math.max(0, offset - 1))}
            disabled={offset <= 0}
            title="Decrease offset"
          >-</button>
          <button 
            type="button" 
            className="grid-btn grid-btn--plus"
            onClick={() => onChangeOffset(Math.min(11, offset + 1))}
            disabled={offset >= 11}
            title="Increase offset"
          >+</button>
        </div>
      </div>
    </div>
  );
};

BlockControls.propTypes = {
  elementId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  size: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  onChangeSize: PropTypes.func.isRequired,
  onChangeOffset: PropTypes.func.isRequired,
};

export default BlockControls;
