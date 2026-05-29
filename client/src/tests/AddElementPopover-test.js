/** @jest-environment jsdom */
/* eslint-disable */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

// Mock Injector inject HOC
jest.mock('lib/Injector', () => {
  const React = require('react');
  const MockPopoverOptionSet = (props) => {
    return (
      <div data-testid="popover-option-set" className={props.extraClass}>
        {props.buttons.map((btn) => (
          <button
            key={btn.key}
            className={btn.className}
            onClick={btn.onClick}
            data-testid={`btn-${btn.key}`}
          >
            {btn.content}
          </button>
        ))}
      </div>
    );
  };

  return {
    inject: (dependencies, factory) => (Component) => {
      const injectedProps = factory(MockPopoverOptionSet);
      return (props) => <Component {...injectedProps} {...props} />;
    },
  };
}, { virtual: true });

// Mock i18n
jest.mock('i18n', () => ({
  _t: jest.fn((key, defaultValue) => defaultValue),
}), { virtual: true });

// Mock jQuery and Entwine for preview reload
const mockLoadUrl = jest.fn();
const mockFind = jest.fn(() => ({
  attr: jest.fn(() => 'http://localhost/mock-iframe-src'),
}));
const mockEntwine = jest.fn(() => ({
  _loadUrl: mockLoadUrl,
}));
const mockJquery = jest.fn(() => ({
  entwine: mockEntwine,
  find: mockFind,
}));
global.window.jQuery = mockJquery;

const AddElementPopover = require('components/AddElementPopover').default;

describe('AddElementPopover', () => {
  const mockHandleAddElementToArea = jest.fn(() => Promise.resolve());
  const mockToggle = jest.fn();

  const defaultProps = {
    elementTypes: [
      { class: 'ElementContent', name: 'content', title: 'Content Block', icon: 'font-icon-block-content' },
      { class: 'ElementImage', name: 'image', title: 'Image Block', icon: 'font-icon-block-image' },
      { class: 'ElementFile', name: 'file', title: 'File Block', icon: 'font-icon-block-file' },
    ],
    container: {},
    isOpen: true,
    target: 'some-target-id',
    toggle: mockToggle,
    areaId: 10,
    insertAfterElement: 5,
    insertAtBottom: false,
    actions: {
      handleAddElementToArea: mockHandleAddElementToArea,
    },
  };

  beforeEach(() => {
    mockHandleAddElementToArea.mockClear();
    mockToggle.mockClear();
    mockLoadUrl.mockClear();
    mockJquery.mockClear();
  });

  test('renders PopoverOptionSetComponent with correct option buttons', () => {
    const { getByTestId, getByText } = render(<AddElementPopover {...defaultProps} />);
    
    expect(getByTestId('popover-option-set')).not.toBeNull();
    
    // Check that all configured element types have option buttons
    defaultProps.elementTypes.forEach((type) => {
      const button = getByTestId(`btn-${type.name}`);
      expect(button).not.toBeNull();
      expect(button.className).toContain(type.icon);
      expect(button.textContent).toBe(type.title);
    });
  });

  test('button click calls handleAddElementToArea and triggers CMS preview reload', async () => {
    const { getByTestId } = render(<AddElementPopover {...defaultProps} />);
    const contentButton = getByTestId('btn-content');

    await act(async () => {
      fireEvent.click(contentButton);
    });

    // Verifies the add element action was called with class, insertAfter, insertAtBottom
    expect(mockHandleAddElementToArea).toHaveBeenCalledTimes(1);
    expect(mockHandleAddElementToArea).toHaveBeenCalledWith(
      'ElementContent', // elementType.class
      5,               // insertAfterElement
      false            // insertAtBottom
    );

    // Verifies jQuery entwine triggers preview frame reload on promise success
    expect(mockJquery).toHaveBeenCalledWith('.cms-preview');
    expect(mockEntwine).toHaveBeenCalledWith('ss.preview');
    expect(mockLoadUrl).toHaveBeenCalledWith('http://localhost/mock-iframe-src');

    // Verifies popover is toggled closed after adding block
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
