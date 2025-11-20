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
  }

  componentDidUpdate(prevProps) {
    // Update state if props change (e.g., after a successful mutation)
    if (prevProps.size !== this.props.size) {
      this.setState({ currentSize: this.props.size || 12 });
    }
    if (prevProps.offset !== this.props.offset) {
      this.setState({ currentOffset: this.props.offset || 0 });
    }
  }

  getColSizeOptions() {
    const colSizes = [];
    for (let size = 1; size <= this.props.gridColumns; size++) {
      colSizes.push({
        value: size,
        title: `Column ${size}/${this.props.gridColumns}`
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
    for (let size = 1; size <= this.props.gridColumns; size++) {
      offsets.push({
        value: size,
        title: `Column ${size}/${this.props.gridColumns}`
      });
    }
    return offsets;
  }

  handleChangeSize(event) {
    const newSize = parseInt(event.target.value, 10);
    this.setState({ currentSize: newSize });

    // Update via REST API using the correct viewport
    const viewport = this.props.defaultViewport || 'MD';
    const sizeField = `size${viewport}`;
    this.updateElementGrid({ [sizeField]: newSize });

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

    // Update via REST API using the correct viewport
    const viewport = this.props.defaultViewport || 'MD';
    const offsetField = `offset${viewport}`;
    this.updateElementGrid({ [offsetField]: newOffset });

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
    const { elementId, areaId, onGridUpdate } = this.props;
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

    return (
      <div className="column-size-controls">
        <hr />
        <div className="form-row">
          <div className="col-sm-6">
            <label htmlFor={sizeId} className="col-form-label">
              Size {this.props.defaultViewport}
            </label>
            <Input
              type="select"
              id={sizeId}
              value={this.state.currentSize}
              onChange={this.handleChangeSize}
              className="form-control"
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
              value={this.state.currentOffset}
              onChange={this.handleChangeOffset}
              className="form-control"
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
};

export default ColumnSize;
