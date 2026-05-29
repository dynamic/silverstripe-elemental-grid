/** @jest-environment jsdom */
/* eslint-disable */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

/**
 * ColumnSize Component Unit Tests
 *
 * Tests the core business logic and DOM interactions of the ColumnSize component.
 * Uses mocks for SilverStripe admin module dependencies.
 */

const mockPost = jest.fn(() => Promise.resolve());
const mockConfigGet = jest.fn(() => 'mock-security-id');

// Mock SilverStripe admin modules before require
jest.mock('lib/Backend', () => ({
  __esModule: true,
  default: { post: mockPost },
}), { virtual: true });

jest.mock('lib/Config', () => ({
  __esModule: true,
  default: { get: mockConfigGet },
}), { virtual: true });

jest.mock('state/editor/elementConfig', () => ({
  getConfig: jest.fn(() => ({
    controllerLink: '/admin/elemental-area',
  })),
}), { virtual: true });

jest.mock('reactstrap', () => {
  const React = require('react');
  return {
    Input: ({ innerRef, ...props }) => {
      if (props.type === 'select') {
        return (
          <select {...props} ref={innerRef}>
            {props.children}
          </select>
        );
      }
      return <input {...props} ref={innerRef} />;
    },
    Button: ({ innerRef, ...props }) => (
      <button {...props} ref={innerRef} />
    ),
    Popover: (props) => props.isOpen ? <div data-testid="popover">{props.children}</div> : null,
    PopoverHeader: (props) => <div {...props} />,
    PopoverBody: (props) => <div {...props} />,
  };
}, { virtual: true });

jest.mock('lib/Injector', () => ({
  component: { get: jest.fn(), registerMany: jest.fn() },
  transform: jest.fn(),
}), { virtual: true });

const ColumnSize = require('components/ColumnSize').default;

describe('ColumnSize - Option Generation', () => {
  const defaultProps = {
    elementId: 42,
    size: 6,
    offset: 0,
    defaultViewport: 'LG',
    gridColumns: 12,
    id: 'test-grid',
    autoSaveEnabled: false,
  };

  test('getColSizeOptions returns 12 options for 12-column grid', () => {
    const instance = new ColumnSize(defaultProps);
    const options = instance.getColSizeOptions();

    expect(options).toHaveLength(12);
    expect(options[0].value).toBe(1);
    expect(options[11].value).toBe(12);
  });

  test('getColSizeOptions includes correct fraction labels', () => {
    const instance = new ColumnSize(defaultProps);
    const options = instance.getColSizeOptions();

    expect(options[2].title).toContain('1/4');   // 3/12 = 25%
    expect(options[2].title).toContain('25%');
    expect(options[3].title).toContain('1/3');   // 4/12 = 33%
    expect(options[3].title).toContain('33%');
    expect(options[5].title).toContain('1/2');   // 6/12 = 50%
    expect(options[5].title).toContain('50%');
    expect(options[7].title).toContain('2/3');   // 8/12 = 67%
    expect(options[7].title).toContain('67%');
    expect(options[8].title).toContain('3/4');   // 9/12 = 75%
    expect(options[8].title).toContain('75%');
    expect(options[11].title).toContain('Full'); // 12/12 = 100%
    expect(options[11].title).toContain('100%');
  });

  test('getColSizeOptions omits fractions for non-12 grids', () => {
    const instance = new ColumnSize({ ...defaultProps, gridColumns: 10 });
    const options = instance.getColSizeOptions();

    expect(options).toHaveLength(10);
    options.forEach((opt) => {
      expect(opt.title).not.toContain('1/4');
      expect(opt.title).not.toContain('1/2');
      expect(opt.title).not.toContain('Full');
    });
  });

  test('getColSizeOptions format: N/total (percentage%...)', () => {
    const instance = new ColumnSize(defaultProps);
    const options = instance.getColSizeOptions();

    options.forEach((opt) => {
      expect(opt.title).toMatch(/^\d+\/12 \(\d+%/);
    });
  });

  test('getOffsetOptions starts with None at value 0', () => {
    const instance = new ColumnSize(defaultProps);
    const options = instance.getOffsetOptions();

    expect(options[0].value).toBe(0);
    expect(options[0].title).toBe('None');
    expect(options).toHaveLength(13); // None + 1..12
  });

  test('getOffsetOptions includes fraction labels', () => {
    const instance = new ColumnSize(defaultProps);
    const options = instance.getOffsetOptions();

    expect(options[3].title).toContain('1/4');
    expect(options[6].title).toContain('1/2');
    expect(options[9].title).toContain('3/4');
  });
});

describe('ColumnSize - State Management', () => {
  const defaultProps = {
    elementId: 42,
    size: 6,
    offset: 0,
    defaultViewport: 'LG',
    gridColumns: 12,
    id: 'test-grid',
    autoSaveEnabled: false,
  };

  test('initial state matches props', () => {
    const instance = new ColumnSize({ ...defaultProps, size: 8, offset: 2 });

    expect(instance.state.currentSize).toBe(8);
    expect(instance.state.currentOffset).toBe(2);
    expect(instance.state.popoverOpen).toBe(false);
  });

  test('defaults to 12 when no size provided', () => {
    const instance = new ColumnSize({ ...defaultProps, size: undefined });
    expect(instance.state.currentSize).toBe(12);
  });

  test('defaults to 0 when no offset provided', () => {
    const instance = new ColumnSize({ ...defaultProps, offset: undefined });
    expect(instance.state.currentOffset).toBe(0);
  });

  test('handleChangeSize updates state and select value', () => {
    const { getByRole, getByLabelText } = render(<ColumnSize {...defaultProps} />);
    // Open popover
    fireEvent.click(getByRole('button'));
    const select = getByLabelText(/Size/i);
    fireEvent.change(select, { target: { value: '4' } });
    expect(select.value).toBe('4');
  });

  test('handleChangeOffset updates state and select value', () => {
    const { getByRole, getByLabelText } = render(<ColumnSize {...defaultProps} />);
    // Open popover
    fireEvent.click(getByRole('button'));
    const select = getByLabelText(/Offset/i);
    fireEvent.change(select, { target: { value: '3' } });
    expect(select.value).toBe('3');
  });

  test('handleChangeSize calls onChangeSize callback', () => {
    const onChangeSize = jest.fn();
    const instance = new ColumnSize({ ...defaultProps, onChangeSize });
    const event = { target: { value: '4' } };

    instance.handleChangeSize(event);

    expect(onChangeSize).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        id: defaultProps.id,
        value: 4,
        elementId: defaultProps.elementId,
        field: 'size',
      })
    );
  });

  test('handleChangeOffset calls onChangeOffset callback', () => {
    const onChangeOffset = jest.fn();
    const instance = new ColumnSize({ ...defaultProps, onChangeOffset });
    const event = { target: { value: '2' } };

    instance.handleChangeOffset(event);

    expect(onChangeOffset).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        id: defaultProps.id,
        value: 2,
        elementId: defaultProps.elementId,
        field: 'offset',
      })
    );
  });

  test('no callback does not throw', () => {
    const instance = new ColumnSize({ ...defaultProps, onChangeSize: null });
    expect(() => instance.handleChangeSize({ target: { value: '4' } })).not.toThrow();
  });

  test('togglePopover toggles popover visibility', () => {
    const { getByRole, queryByTestId } = render(<ColumnSize {...defaultProps} />);
    expect(queryByTestId('popover')).toBeNull();
    
    // Toggle to open
    fireEvent.click(getByRole('button'));
    expect(queryByTestId('popover')).not.toBeNull();
    
    // Toggle to close
    fireEvent.click(getByRole('button'));
    expect(queryByTestId('popover')).toBeNull();
  });
});

describe('ColumnSize - Auto-save', () => {
  const defaultProps = {
    elementId: 42,
    size: 6,
    offset: 0,
    defaultViewport: 'LG',
    gridColumns: 12,
    id: 'test-grid',
    autoSaveEnabled: true,
  };

  beforeEach(() => {
    mockPost.mockClear();
    mockConfigGet.mockClear();
  });

  test('handleChangeSize calls backend.post when autoSaveEnabled', () => {
    const instance = new ColumnSize(defaultProps);
    instance.handleChangeSize({ target: { value: '8' } });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('api/updateGrid'),
      expect.objectContaining({ id: 42, sizeLG: 8 }),
      expect.any(Object)
    );
  });

  test('handleChangeOffset calls backend.post when autoSaveEnabled', () => {
    const instance = new ColumnSize(defaultProps);
    instance.handleChangeOffset({ target: { value: '3' } });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('api/updateGrid'),
      expect.objectContaining({ id: 42, offsetLG: 3 }),
      expect.any(Object)
    );
  });

  test('does not call backend when autoSaveEnabled is false', () => {
    const instance = new ColumnSize({ ...defaultProps, autoSaveEnabled: false });
    instance.handleChangeSize({ target: { value: '4' } });
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('ColumnSize - Keyboard Handling', () => {
  const defaultProps = {
    elementId: 42,
    size: 6,
    offset: 0,
    defaultViewport: 'LG',
    gridColumns: 12,
    id: 'test-grid',
    autoSaveEnabled: false,
  };

  test('Escape key closes popover', () => {
    const { getByRole, queryByTestId, getByLabelText } = render(<ColumnSize {...defaultProps} />);
    // Open popover
    fireEvent.click(getByRole('button'));
    expect(queryByTestId('popover')).not.toBeNull();
    
    // Trigger Escape key
    const sizeSelect = getByLabelText(/Size/i);
    fireEvent.keyDown(sizeSelect, { key: 'Escape', code: 'Escape' });
    expect(queryByTestId('popover')).toBeNull();
  });

  test('non-Escape keys do not close popover', () => {
    const { getByRole, queryByTestId, getByLabelText } = render(<ColumnSize {...defaultProps} />);
    // Open popover
    fireEvent.click(getByRole('button'));
    expect(queryByTestId('popover')).not.toBeNull();
    
    // Keydown non-escape
    const sizeSelect = getByLabelText(/Size/i);
    fireEvent.keyDown(sizeSelect, { key: 'ArrowDown', code: 'ArrowDown' });
    
    expect(queryByTestId('popover')).not.toBeNull();
  });

  test('Tab key stops propagation', () => {
    const instance = new ColumnSize(defaultProps);
    instance.setState({ popoverOpen: true });

    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    instance.handlePopoverKeyDown(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
