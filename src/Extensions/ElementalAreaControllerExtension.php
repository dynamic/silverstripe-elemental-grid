<?php

namespace WeDevelop\ElementalGrid\Extensions;

use DNADesign\Elemental\Models\BaseElement;
use Psr\Log\LoggerInterface;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Extension;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\Security\SecurityToken;

/**
 * Extension for ElementalAreaController to add grid update API endpoint
 * This provides SilverStripe 6 compatibility while maintaining backward compatibility
 */
class ElementalAreaControllerExtension extends Extension
{
    /**
     * Get the logger instance for grid operations
     */
    private function getLogger(): LoggerInterface
    {
        return Injector::inst()->get(LoggerInterface::class);
    }

    private static $url_handlers = [
        'POST api/updateGrid' => 'apiUpdateGrid',
    ];

    private static $allowed_actions = [
        'apiUpdateGrid',
    ];

    /**
     * JSON endpoint to update grid properties on an element
     * This updates the element's grid size/offset without creating a new version
     */
    public function apiUpdateGrid(HTTPRequest $request): HTTPResponse
    {
        $logger = $this->getLogger();
        $logger->info('apiUpdateGrid called', [
            'method' => $request->httpMethod(),
            'url' => $request->getURL(),
            'body_raw' => $request->getBody()
        ]);

        // Check security token
        if (!SecurityToken::inst()->checkRequest($request)) {
            $logger->warning('Security token check failed', [
                'token_provided' => $request->getHeader('X-SecurityID') ?: $request->postVar('SecurityID'),
                'token_expected' => SecurityToken::inst()->getValue()
            ]);
            return $this->owner->getResponse()
                ->addHeader('Content-Type', 'application/json')
                ->setStatusCode(400)
                ->setBody(json_encode(['error' => 'Invalid security token']));
        }

        // Get grid data from request
        $data = json_decode($request->getBody(), true);
        $logger->debug('Decoded grid data', [
            'data' => $data,
            'json_error' => json_last_error_msg()
        ]);

        if (!$data || !isset($data['id'])) {
            $logger->error('Invalid request data', ['body' => $request->getBody()]);
            return $this->owner->getResponse()
                ->addHeader('Content-Type', 'application/json')
                ->setStatusCode(400)
                ->setBody(json_encode(['error' => 'Missing required field: id']));
        }

        $id = $data['id'];
        $logger->debug('Element ID extracted', ['id' => $id]);

        $element = BaseElement::get()->byID($id);

        if (!$element) {
            $logger->error('Element not found', ['id' => $id]);
            return $this->owner->getResponse()
                ->addHeader('Content-Type', 'application/json')
                ->setStatusCode(404)
                ->setBody(json_encode(['error' => 'Element not found']));
        }

        if (!$element->canEdit()) {
            $logger->warning('Element canEdit() returned false', [
                'element_id' => $id,
                'element_class' => get_class($element)
            ]);
            return $this->owner->getResponse()
                ->addHeader('Content-Type', 'application/json')
                ->setStatusCode(403)
                ->setBody(json_encode(['error' => 'Insufficient permissions to edit this element']));
        }

        // Get grid field mapping
        $gridFields = $this->getGridFieldMapping();

        // Update only the provided fields
        $updated = false;
        $updatedFields = [];
        foreach ($gridFields as $jsonKey => $dbField) {
            if (array_key_exists($jsonKey, $data) && $data[$jsonKey] !== null) {
                $element->$dbField = (int)$data[$jsonKey];
                $updated = true;
                $updatedFields[$jsonKey] = $data[$jsonKey];
            }
        }

        $logger->debug('Fields to update', ['updated_fields' => $updatedFields]);

        // Write changes immediately without versioning
        // This allows the GridField display to update without creating a draft
        if ($updated) {
            try {
                $element->write();
                $logger->info('Grid properties updated successfully', [
                    'element_id' => $id,
                    'element_class' => get_class($element),
                    'updated_fields' => $updatedFields
                ]);
            } catch (\Exception $e) {
                $logger->error('Failed to write element', [
                    'element_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return $this->owner->getResponse()
                    ->addHeader('Content-Type', 'application/json')
                    ->setStatusCode(500)
                    ->setBody(json_encode(['error' => 'Failed to save element: ' . $e->getMessage()]));
            }
        } else {
            $logger->info('No grid fields updated', ['element_id' => $id, 'data_received' => $data]);
        }

        return $this->owner->getResponse()
            ->addHeader('Content-Type', 'application/json')
            ->setStatusCode(204);
    }

    /**
     * Get the grid field mapping
     */
    private function getGridFieldMapping(): array
    {
        return [
            'sizeXS' => 'SizeXS',
            'sizeSM' => 'SizeSM',
            'sizeMD' => 'SizeMD',
            'sizeLG' => 'SizeLG',
            'sizeXL' => 'SizeXL',
            'offsetXS' => 'OffsetXS',
            'offsetSM' => 'OffsetSM',
            'offsetMD' => 'OffsetMD',
            'offsetLG' => 'OffsetLG',
            'offsetXL' => 'OffsetXL',
        ];
    }
}
