/* global window */

import { inject } from 'lib/Injector';
import i18n from 'i18n';
import * as TabsActions from 'state/tabs/TabsActions';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { loadElementFormStateName } from 'state/editor/loadElementFormStateName';
import { loadElementSchemaValue } from 'state/editor/loadElementSchemaValue';
import { elementTypeType } from 'types/elementTypeType';
import { elementType } from 'types/elementType';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * The Element component used in the context of an ElementEditor shows the summary
 * of an element's details when used in the CMS, including ID, Title and Summary.
 */
const Element = (props) => {
  // Safely access grid schema with fallbacks
  const gridSchema = props.element && props.element.blockSchema && props.element.blockSchema.grid;
  const columnData = (gridSchema && gridSchema.column) || {};

  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [initialTab, setInitialTab] = useState('');
  const [loadingError, setLoadingError] = useState(false);
  const [childRenderingError, setChildRenderingError] = useState(false);


  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: props.element.id,
    disabled: previewExpanded // Disable dragging when expanded
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Returns the applicable versioned state class names for the element
   *
   * @returns {string}
   */
  const getVersionedStateClassName = () => {
    const { element } = props;

    const baseClassName = 'element-editor__element';

    if (!element.isPublished) {
      return `${baseClassName}--draft`;
    }

    if (element.isPublished && !element.isLiveVersion) {
      return `${baseClassName}--modified`;
    }

    return `${baseClassName}--published`;
  };

  /**
   * Returns the link title for this element
   *
   * @param {Object} type
   * @returns {string}
   */
  const getLinkTitle = (type) => {
    if (type.broken) {
      return i18n._t('ElementalElement.ARCHIVE_BROKEN', 'Archive this block');
    }
    return i18n.inject(
      i18n._t('ElementalElement.TITLE', 'Edit this {type} block'),
      { type: type.title }
    );
  };

  /**
   * Returns the summary for this element
   *
   * @param {Object} element
   * @param {Object} type
   * @returns {string|JSX.Element}
   */
  const getSummary = (element, type) => {
    if (type.broken) {
      // Return a message about the broken block.
      return element.title ? i18n.inject(
        i18n._t(
          'ElementalElement.BROKEN_DESCRIPTION_TITLE',
          'This block had the title "{title}". It is broken and will not display on the front-end. You can archive it to remove it from this elemental area.'
        ),
        { title: element.title }
      ) : i18n._t(
        'ElementalElement.BROKEN_DESCRIPTION',
        'This block is broken and will not display on the front-end. You can archive it to remove it from this elemental area.'
      );
    }
    // Return the configured summary for this block.
    return element.blockSchema.content;
  };

  const getColumnSizeClassNames = () => {
    const { element } = props;
    const gridSchema = element && element.blockSchema && element.blockSchema.grid;
    const columnData = (gridSchema && gridSchema.column) || {};
    const cardSize = columnData.size || 12;
    const cardOffset = columnData.offset || 0;

    return {
      [`col-lg-${cardSize}`]: true,
      [`offset-lg-${cardOffset}`]: cardOffset > 0,
      'is-row': gridSchema && gridSchema.isRow === true,
      'is-dragged-top': props.isDraggedOver && props.isDraggedOverPosition === 'top',
      'is-dragged-bottom': props.isDraggedOver && props.isDraggedOverPosition === 'bottom'
    };
  };

  /**
   * Prevents the Element from being expanded in case a loading error occurred.
   * This gets triggered from the InlineEditForm component.
   */
  const handleLoadingError = () => {
    setLoadingError(true);
  };

  /**
   * Dispatcher to Tabs redux store for this element's tabset
   *
   * @param {string} activeTab Name prop of the active tab
   */
  const updateFormTab = (activeTab) => {
    const { tabSetName, onActivateTab } = props;

    if (!initialTab) {
      setInitialTab(activeTab);
    }

    if (activeTab || initialTab) {
      onActivateTab(tabSetName, activeTab || initialTab);
    } else {
      const defaultFirstTab = 'Main';
      onActivateTab(tabSetName, defaultFirstTab);
    }
  };

  /**
   * Update the active tab on tab actions menu button click event. Is passed down to InlineEditForm.
   *
   * @param {string} toBeActiveTab
   */
  const handleTabClick = (toBeActiveTab) => {
    const { activeTab } = props;

    if (toBeActiveTab !== activeTab && !loadingError) {
      setPreviewExpanded(true);
      updateFormTab(toBeActiveTab);
    }
  };

  /**
   * Expand the element to show the preview
   * If the element is not inline-editable, take user to the GridFieldDetailForm to edit the record
   */
  const handleExpand = (event) => {
    const { type, link } = props;

    if (type.broken) {
      return;
    }

    if (event.target.type === 'button') {
      // Stop bubbling if the click target was a button within this container
      event.stopPropagation();
      return;
    }

    if (type.inlineEditable && !loadingError) {
      setPreviewExpanded(prev => !prev);
      return;
    }

    // If inline editing is disabled for this element, send them to the standalone
    // edit form
    window.location = link;
  };

  /**
   * If pressing enter or space key, treat it like a mouse click
   *
   * @param {Object} event
   */
  const handleKeyUp = (event) => {
    const { nodeName } = event.target;

    if (
      (event.key === ' ' || event.key === 'Enter')
      // Ignore presses while focusing inputs and textareas
      && !['input', 'textarea'].includes(nodeName.toLowerCase())
    ) {
      handleExpand(event);
    }
  };



  // Render
  const {
    element,
    type,
    areaId,
    HeaderComponent,
    ContentComponent,
    ColumnSizeComponent,
    link,
    activeTab,
    onDragEnd,
  } = props;

  if (!element.id) {
    return null;
  }

  const elementClassNames = classNames(
    'element-editor__element',
    {
      'element-editor__element--broken': type.broken,
      'element-editor__element--expandable': type.inlineEditable && !type.broken,
      'element-editor__element--dragging': isDragging,
      'element-editor__element--dragged-over': isOver,
    },
    getVersionedStateClassName(),
  );

  return (
    <div 
      className={classNames('element-editor__element-holder', getColumnSizeClassNames())}
    >
      <div
        className={elementClassNames}
        onClick={handleExpand}
        onKeyUp={handleKeyUp}
        role="button"
        tabIndex={0}
        title={getLinkTitle(type)}
        key={element.id}
        ref={setNodeRef}
        {...(!previewExpanded ? attributes : {})}
        {...(!previewExpanded ? listeners : {})}
        style={style}
      >
        <HeaderComponent
          element={element}
          type={type}
          areaId={areaId}
          expandable={type.inlineEditable}
          link={link}
          previewExpanded={previewExpanded && !childRenderingError}
          handleEditTabsClick={handleTabClick}
          activeTab={activeTab}
          disableTooltip={isDragging}
          onDragEnd={onDragEnd}
        />

        {
          !childRenderingError &&
          <ContentComponent
            id={element.id}
            fileUrl={element.blockSchema.fileURL}
            fileTitle={element.blockSchema.fileTitle}
            content={getSummary(element, type)}
            previewExpanded={previewExpanded && !isDragging}
            activeTab={activeTab}
            onFormInit={() => updateFormTab(activeTab)}
            handleLoadingError={handleLoadingError}
            broken={type.broken}
          />
        }

        {
          childRenderingError &&
          <div className="alert alert-danger mt-2">
            {i18n._t('ElementalElement.CHILD_RENDERING_ERROR', 'Something went wrong with this block. Please try saving and refreshing the CMS.')}
          </div>
        }


      </div>
    </div>
  );
};

function mapStateToProps(state, ownProps) {
  const elementId = ownProps.element.id;
  const elementName = loadElementFormStateName(elementId);
  const elementFormSchema = loadElementSchemaValue('schemaUrl', elementId);

  const filterFieldsForTabs = (field) => field.component === 'Tabs';

  // Find name of the first Tabs component in the form
  // Only defined - and needed - once the form is loaded
  const tabSet =
    state.form &&
    state.form.formSchemas[elementFormSchema] &&
    state.form.formSchemas[elementFormSchema].schema &&
    state.form.formSchemas[elementFormSchema].schema.fields.find(filterFieldsForTabs);

  const tabSetName = tabSet && tabSet.id;
  const uniqueFieldId = `element.${elementName}__${tabSetName}`;

  // Find name of the active tab in the tab set
  // Only defined once an element form is expanded for the first time
  const activeTab =
    state.tabs &&
    state.tabs.fields &&
    state.tabs.fields[uniqueFieldId] &&
    state.tabs.fields[uniqueFieldId].activeTab;
  return {
    tabSetName,
    activeTab,
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  const elementName = loadElementFormStateName(ownProps.element.id);

  return {
    onActivateTab(tabSetName, activeTabName) {
      dispatch(TabsActions.activateTab(`element.${elementName}__${tabSetName}`, activeTabName));
    },
  };
}

Element.propTypes = {
  element: elementType,
  type: elementTypeType.isRequired,
  areaId: PropTypes.number.isRequired,
  link: PropTypes.string.isRequired,
  // Redux mapped props:
  activeTab: PropTypes.string,
  tabSetName: PropTypes.string,
  onActivateTab: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDragStart: PropTypes.func,
  isDraggedOver: PropTypes.bool,
  isDraggedOverPosition: PropTypes.string
};

Element.defaultProps = {
  element: null,
};

export { Element as Component };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  inject(
    ['ElementHeader', 'ElementContent', 'ColumnSize'],
    (HeaderComponent, ContentComponent, ColumnSizeComponent) => ({
      HeaderComponent, ContentComponent, ColumnSizeComponent
    }),
    () => 'Element'
  )
)(Element);
