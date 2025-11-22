<?php

namespace WeDevelop\ElementalGrid\Extensions;

use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Control\Controller;
use SilverStripe\Core\Extension;
use SilverStripe\ORM\DataObject;

/**
 * Extension to handle saving of Elemental Grid fields from CMS form submission.
 * 
 * This processes the nested Elements array data that comes from the Redux Form submission,
 * which includes grid fields like SizeMD, OffsetMD, etc. The standard form saveInto() 
 * doesn't cascade to related Element records, so we handle it here.
 */
class SiteTreeGridSaveExtension extends Extension
{
    /**
     * Handle grid field data from ElementForm submissions before writing the page
     */
    public function onBeforeWrite()
    {
        // Only process if this is a CMS request with form data
        $controller = Controller::curr();
        if (!$controller) {
            return;
        }
        
        $request = $controller->getRequest();
        $allPostVars = $request->postVars();
        
        // Grid fields we're looking for
        $gridFields = [
            'SizeMD', 'OffsetMD', 
            'SizeXS', 'SizeSM', 'SizeLG', 'SizeXL',
            'OffsetXS', 'OffsetSM', 'OffsetLG', 'OffsetXL'
        ];
        
        // Look for ElementForm_* POST vars that contain grid field data
        foreach ($allPostVars as $key => $value) {
            // Match pattern: ElementForm_123
            if (preg_match('/^ElementForm_(\d+)$/', $key, $matches)) {
                $elementId = $matches[1];
                
                if (!is_array($value)) {
                    continue;
                }
                
                $element = DataObject::get_by_id(BaseElement::class, $elementId);
                if (!$element) {
                    continue;
                }
                
                // Update grid fields from the ElementForm data
                foreach ($value as $field => $fieldValue) {
                    if (in_array($field, $gridFields)) {
                        $element->$field = $fieldValue;
                    }
                }
                
                $element->write();
            }
        }
    }
}
