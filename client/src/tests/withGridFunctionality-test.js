/** @jest-environment jsdom */
/* eslint-disable */
import React from 'react';
import { render } from '@testing-library/react';

// Mock Injector
const mockComponents = {};
jest.mock('lib/Injector', () => ({
  __esModule: true,
  default: {
    component: {
      registerMany: jest.fn((components) => {
        Object.assign(mockComponents, components);
      }),
      get: jest.fn((name) => mockComponents[name] || (() => <div data-testid={name} />)),
    },
  },
}), { virtual: true });

// Mock other components in bundle.js
jest.mock('components/ColumnSize', () => () => <div data-testid="ColumnSize" />, { virtual: true });
jest.mock('components/AddBlockToBottomButton', () => () => <div data-testid="AddBlockToBottomButton" />, { virtual: true });
jest.mock('components/AddBlockToTopButton', () => () => <div data-testid="AddBlockToTopButton" />, { virtual: true });

// Now import the HOC from bundle.js
const { withGridFunctionality } = require('bundles/bundle');

const DummyComponent = (props) => <div data-testid="dummy">{props.element.id}</div>;
const EnhancedComponent = withGridFunctionality(DummyComponent);

describe('withGridFunctionality - Higher Order Component', () => {
  const setupTest = (element, props = {}) => {
    const elementId = element.id;
    return render(
      <div className="element-editor__element" data-testid="card-wrapper">
        <div id={`element-icon-${elementId}`}></div>
        <div className="element-editor-summary" data-testid="summary" style={{ display: 'block' }}>
          summary
        </div>
        <div className="element-editor-header">
          <div className="element-editor-header__actions" data-testid="actions"></div>
        </div>
        <EnhancedComponent element={element} {...props} />
      </div>
    );
  };

  test('identifies row elements and applies row classes', () => {
    const rowElement = {
      id: 1,
      blockSchema: {
        typeName: 'ElementRow',
        grid: {
          isRow: true,
          isFluid: false,
        },
      },
    };

    const { getByTestId } = setupTest(rowElement);
    const wrapper = getByTestId('card-wrapper');
    const summary = getByTestId('summary');

    expect(wrapper.className).toContain('is-row');
    expect(wrapper.className).toContain('col-lg-12');
    expect(wrapper.className).toContain('is-contained-row');
    expect(wrapper.className).not.toContain('is-fluid-row');
    expect(summary.style.display).toBe('none');
  });

  test('identifies fluid row elements and applies fluid row class', () => {
    const fluidRowElement = {
      id: 2,
      blockSchema: {
        typeName: 'ElementRow',
        grid: {
          isRow: true,
          isFluid: true,
        },
      },
    };

    const { getByTestId } = setupTest(fluidRowElement);
    const wrapper = getByTestId('card-wrapper');

    expect(wrapper.className).toContain('is-row');
    expect(wrapper.className).toContain('col-lg-12');
    expect(wrapper.className).toContain('is-fluid-row');
    expect(wrapper.className).not.toContain('is-contained-row');
  });

  test('identifies row elements by class name or titles', () => {
    const rowByTitle = {
      id: 3,
      title: 'Our Custom Row Block',
      blockSchema: {
        typeName: 'ElementCustomBlock',
        grid: {
          isRow: false, // overridden by title/type heuristics in bundle.js
        },
      },
    };

    const { getByTestId } = setupTest(rowByTitle);
    const wrapper = getByTestId('card-wrapper');
    expect(wrapper.className).toContain('is-row');
  });

  test('applies grid size col-lg-{size} class for column blocks', () => {
    const colElement = {
      id: 4,
      blockSchema: {
        typeName: 'ElementContent',
        grid: {
          isRow: false,
          column: {
            size: 8,
            offset: 0,
          },
        },
      },
    };

    const { getByTestId } = setupTest(colElement);
    const wrapper = getByTestId('card-wrapper');
    const summary = getByTestId('summary');

    expect(wrapper.className).toContain('col-lg-8');
    expect(wrapper.className).not.toContain('is-row');
    expect(wrapper.className).not.toContain('offset-lg-');
    expect(summary.style.display).toBe('block');
  });

  test('applies offset class if offset is non-zero', () => {
    const offsetElement = {
      id: 5,
      blockSchema: {
        typeName: 'ElementContent',
        grid: {
          isRow: false,
          column: {
            size: 6,
            offset: 3,
          },
        },
      },
    };

    const { getByTestId } = setupTest(offsetElement);
    const wrapper = getByTestId('card-wrapper');

    expect(wrapper.className).toContain('col-lg-6');
    expect(wrapper.className).toContain('offset-lg-3');
  });
});
