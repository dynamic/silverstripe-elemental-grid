import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * GridOverlay - Visual 12-column grid guide for the editor
 * 
 * Shows vertical column guides to help users visualize the grid structure.
 * Can be toggled on/off via the grid toggle button.
 */
const GridOverlay = ({ visible, gridColumns, gutterWidth }) => {
  if (!visible) return null;

  const columns = [];
  const columnWidth = 100 / gridColumns;

  for (let i = 0; i < gridColumns; i++) {
    columns.push(
      <div
        key={i}
        className="grid-overlay__column"
        style={{
          left: `${i * columnWidth}%`,
          width: `${columnWidth}%`,
        }}
      >
        <div className="grid-overlay__column-inner" />
        <span className="grid-overlay__column-number">{i + 1}</span>
      </div>
    );
  }

  return (
    <div className="grid-overlay" aria-hidden="true">
      <div className="grid-overlay__columns">
        {columns}
      </div>
    </div>
  );
};

GridOverlay.propTypes = {
  visible: PropTypes.bool,
  gridColumns: PropTypes.number,
  gutterWidth: PropTypes.number,
};

GridOverlay.defaultProps = {
  visible: false,
  gridColumns: 12,
  gutterWidth: 30,
};

export default GridOverlay;
