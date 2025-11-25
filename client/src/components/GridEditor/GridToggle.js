import React from 'react';
import PropTypes from 'prop-types';

/**
 * GridToggle - Button to show/hide the grid overlay
 */
const GridToggle = ({ active, onClick }) => {
  return (
    <button
      type="button"
      className={`grid-toggle btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
      onClick={onClick}
      title={active ? 'Hide grid guides' : 'Show grid guides'}
      aria-pressed={active}
    >
      <span className="grid-toggle__icon font-icon-columns" />
      <span className="grid-toggle__label">
        {active ? 'Hide Grid' : 'Show Grid'}
      </span>
    </button>
  );
};

GridToggle.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

GridToggle.defaultProps = {
  active: false,
};

export default GridToggle;
