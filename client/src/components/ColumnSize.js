import PropTypes from 'prop-types';
import { Component } from 'react';
import { Input, Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import backend from 'lib/Backend';
import Config from 'lib/Config';
import { getConfig } from 'state/editor/elementConfig';

class ColumnSize extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSize: props.size || 12,
      currentOffset: props.offset || 0,
      popoverOpen: false,
    };
    this.handleChangeSize = this.handleChangeSize.bind(this);
    this.handleChangeOffset = this.handleChangeOffset.bind(this);
    this.togglePopover = this.togglePopover.bind(this);
    this.handlePopoverKeyDown = this.handlePopoverKeyDown.bind(this);
    
    // Auto-save is enabled by default in SS6 to persist changes immediately
    // This is the only working method for grid changes in SilverStripe 6
    this.autoSaveEnabled = props.autoSaveEnabled || false;

    this.toggleBtnRef = null;
    this.sizeSelectRef = null;
    this.offsetSelectRef = null;
  }

  togglePopover() {
    this.setState((prevState) => ({
      popoverOpen: !prevState.popoverOpen,
    }));
  }

  handlePopoverKeyDown(event) {
    // Stop propagation so it doesn't expand/collapse elemental cards or trigger shortcuts
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      this.setState({ popoverOpen: false });
      return;
    }

    if (event.key === 'Tab') {
      const sizeEl = this.sizeSelectRef;
      const offsetEl = this.offsetSelectRef;
      if (!sizeEl || !offsetEl) {
        return;
      }

      const activeEl = document.activeElement;

      // Trap focus between Size and Offset dropdowns inside the popover
      if (event.shiftKey) {
        if (activeEl === sizeEl) {
          event.preventDefault();
          offsetEl.focus({ preventScroll: true });
        }
      } else {
        if (activeEl === offsetEl) {
          event.preventDefault();
          sizeEl.focus({ preventScroll: true });
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
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

    // Auto-focus management
    if (prevState.popoverOpen !== this.state.popoverOpen) {
      if (this.state.popoverOpen) {
        setTimeout(() => {
          if (this.sizeSelectRef) {
            this.sizeSelectRef.focus({ preventScroll: true });
          }
        }, 50);
      } else {
        if (this.toggleBtnRef) {
          this.toggleBtnRef.focus({ preventScroll: true });
        }
      }
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
        className="column-size-controls-wrapper"
        onClick={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          color="link"
          className="btn--icon-only font-icon-columns element-editor-header__action"
          id={`grid-toggle-${this.props.elementId}`}
          title="Grid Layout Settings"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            this.togglePopover();
          }}
          innerRef={(el) => { this.toggleBtnRef = el; }}
        />
        <Popover
          isOpen={this.state.popoverOpen}
          toggle={this.togglePopover}
          placement="bottom-end"
          target={`grid-toggle-${this.props.elementId}`}
          className="grid-layout-popover"
          autoFocus={false}
          container="body"
          modifiers={[
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
              },
            },
            {
              name: 'flip',
              options: {
                boundary: 'viewport',
              },
            },
          ]}
        >
          <PopoverHeader>Grid Layout</PopoverHeader>
          <PopoverBody
            onKeyDown={this.handlePopoverKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="form-group grid-popover-form">
              <div className="mb-2">
                <label htmlFor={sizeId} className="form-label">
                  Size ({viewport})
                </label>
                <Input
                  type="select"
                  id={sizeId}
                  name={sizeName}
                  value={this.state.currentSize}
                  onChange={this.handleChangeSize}
                  className="form-control"
                  aria-label={`Column span width for viewport ${viewport}`}
                  innerRef={(el) => { this.sizeSelectRef = el; }}
                >
                  {this.getColSizeOptions().map((option) => (
                    <option key={`size-${option.value}`} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </Input>
              </div>

              <div>
                <label htmlFor={offsetId} className="form-label">
                  Offset ({viewport})
                </label>
                <Input
                  type="select"
                  id={offsetId}
                  name={offsetName}
                  value={this.state.currentOffset}
                  onChange={this.handleChangeOffset}
                  className="form-control"
                  aria-label={`Column offset spacing for viewport ${viewport}`}
                  innerRef={(el) => { this.offsetSelectRef = el; }}
                >
                  {this.getOffsetOptions().map((option) => (
                    <option key={`offset-${option.value}`} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </Input>
              </div>
            </div>
          </PopoverBody>
        </Popover>
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
