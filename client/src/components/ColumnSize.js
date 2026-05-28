import PropTypes from 'prop-types';
import { Component } from 'react';
import { Input } from 'reactstrap';
import backend from 'lib/Backend';
import Config from 'lib/Config';
import { getConfig } from 'state/editor/elementConfig';

class ColumnSize extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSize: props.size || 12,
      currentOffset: props.offset || 0,
    };
    this.handleChangeSize = this.handleChangeSize.bind(this);
    this.handleChangeOffset = this.handleChangeOffset.bind(this);
    
    // Auto-save is enabled by default in SS6 to persist changes immediately
    // This is the only working method for grid changes in SilverStripe 6
    this.autoSaveEnabled = props.autoSaveEnabled || false;
  }

  componentDidUpdate(prevProps) {
    // Update state if props change (e.g., after a successful mutation)
    const stateUpdate = {};
    if (prevProps.size !== this.props.size) {
      stateUpdate.currentSize = this.props.size || 12;
    }
    if (prevProps.offset !== this.props.offset) {
      stateUpdate.currentOffset = this.props.offset || 0;
    }
    if (Object.keys(stateUpdate).length > 0) {
      this.setState(stateUpdate);
    }
  }

  getColSizeOptions() {
    const colSizes = [];
    const total = this.props.gridColumns || 12;
    for (let size = 1; size <= total; size++) {
      const percentage = Math.round((size / total) * 100);
      let fraction = '';
      if (total === 12) {
        if (size === 3) {
          fraction = ' - 1/4';
        } else if (size === 4) {
          fraction = ' - 1/3';
        } else if (size === 6) {
          fraction = ' - 1/2';
        } else if (size === 8) {
          fraction = ' - 2/3';
        } else if (size === 9) {
          fraction = ' - 3/4';
        } else if (size === 12) {
          fraction = ' - Full';
        }
      }
      colSizes.push({
        value: size,
        title: `${size}/${total} (${percentage}%${fraction})`
      });
    }
    return colSizes;
  }

  getOffsetOptions() {
    const offsets = [];
    offsets.push({
      value: 0,
      title: 'None'
    });
    const total = this.props.gridColumns || 12;
    for (let size = 1; size <= total; size++) {
      const percentage = Math.round((size / total) * 100);
      let fraction = '';
      if (total === 12) {
        if (size === 3) {
          fraction = ' - 1/4';
        } else if (size === 4) {
          fraction = ' - 1/3';
        } else if (size === 6) {
          fraction = ' - 1/2';
        } else if (size === 8) {
          fraction = ' - 2/3';
        } else if (size === 9) {
          fraction = ' - 3/4';
        }
      }
      offsets.push({
        value: size,
        title: `${size}/${total} (${percentage}%${fraction})`
      });
    }
    return offsets;
  }

  handleChangeSize(event) {
    const newSize = parseInt(event.target.value, 10);
    this.setState({ currentSize: newSize });

    // Only auto-save if explicitly enabled in config
    if (this.autoSaveEnabled) {
      const viewport = this.props.defaultViewport || 'MD';
      const sizeField = `size${viewport}`;
      this.updateElementGrid({ [sizeField]: newSize });
    }
    // Otherwise, the value will be submitted with the form via the name attribute

    if (typeof this.props.onChangeSize === 'function') {
      this.props.onChangeSize(event, {
        id: this.props.id,
        value: newSize,
        elementId: this.props.elementId,
        field: 'size'
      });
    }
  }

  handleChangeOffset(event) {
    const newOffset = parseInt(event.target.value, 10);
    this.setState({ currentOffset: newOffset });

    // Only auto-save if explicitly enabled in config
    if (this.autoSaveEnabled) {
      const viewport = this.props.defaultViewport || 'MD';
      const offsetField = `offset${viewport}`;
      this.updateElementGrid({ [offsetField]: newOffset });
    }
    // Otherwise, the value will be submitted with the form via the name attribute

    if (typeof this.props.onChangeOffset === 'function') {
      this.props.onChangeOffset(event, {
        id: this.props.id,
        value: newOffset,
        elementId: this.props.elementId,
        field: 'offset'
      });
    }
  }

  updateElementGrid(gridData) {
    const { elementId, onGridUpdate } = this.props;
    // Construct URL following the same pattern as api/sort
    const controllerLink = getConfig().controllerLink.replace(/\/$/, '');
    const url = `/${controllerLink}/api/updateGrid`;
    
    backend.post(url, {
      id: elementId,
      ...gridData,
    }, {
      'X-SecurityID': Config.get('SecurityID')
    })
      .then(() => {
        // Call parent callback to trigger refetch if provided
        if (typeof onGridUpdate === 'function') {
          onGridUpdate();
        }
      })
      .catch((err) => {
        console.error('[Grid] Failed to update element grid properties:', err);
      });
  }

  render() {
    const sizeId = `columnSize-${this.props.elementId}`;
    const offsetId = `columnOffset-${this.props.elementId}`;
    
    // Generate proper field names for form submission
    // Format: Elements[<elementId>][Size<Viewport>]
    const viewport = this.props.defaultViewport || 'MD';
    const sizeName = `Elements[${this.props.elementId}][Size${viewport}]`;
    const offsetName = `Elements[${this.props.elementId}][Offset${viewport}]`;

    return (
      <div
        className="column-size-controls"
        onClick={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="form-row">
          <div className="col-sm-6">
            <label htmlFor={sizeId} className="col-form-label">
              Size {this.props.defaultViewport}
            </label>
            <Input
              type="select"
              id={sizeId}
              name={sizeName}
              value={this.state.currentSize}
              onChange={this.handleChangeSize}
              className="form-control"
              aria-label={`Column span width for viewport ${viewport}`}
            >
              {this.getColSizeOptions().map((option) => (
                <option key={`size-${option.value}`} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Input>
          </div>

          <div className="col-sm-6">
            <label htmlFor={offsetId} className="col-form-label">
              Offset {this.props.defaultViewport}
            </label>
            <Input
              type="select"
              id={offsetId}
              name={offsetName}
              value={this.state.currentOffset}
              onChange={this.handleChangeOffset}
              className="form-control"
              aria-label={`Column offset spacing for viewport ${viewport}`}
            >
              {this.getOffsetOptions().map((option) => (
                <option key={`offset-${option.value}`} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Input>
          </div>
        </div>
      </div>
    );
  }
}

ColumnSize.propTypes = {
  elementId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  size: PropTypes.number,
  offset: PropTypes.number,
  defaultViewport: PropTypes.string,
  gridColumns: PropTypes.number,
  onChangeSize: PropTypes.func,
  onChangeOffset: PropTypes.func,
  onGridUpdate: PropTypes.func,
  id: PropTypes.string,
  autoSaveEnabled: PropTypes.bool,
};

ColumnSize.defaultProps = {
  size: 12,
  offset: 0,
  defaultViewport: 'MD',
  gridColumns: 12,
  onChangeSize: null,
  onChangeOffset: null,
  onGridUpdate: null,
  id: '',
  autoSaveEnabled: false,
};

export default ColumnSize;
