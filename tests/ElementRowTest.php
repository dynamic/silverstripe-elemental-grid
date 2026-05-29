<?php

namespace WeDevelop\ElementalGrid\Tests;

use SilverStripe\Dev\SapphireTest;
use WeDevelop\ElementalGrid\Models\ElementRow;

class ElementRowTest extends SapphireTest
{
    protected static $extra_dataobjects = [
        ElementRow::class,
    ];

    public function testGetTypeReturnsRowLabel(): void
    {
        $row = ElementRow::create();
        $type = $row->getType();

        $this->assertNotEmpty($type);
        $this->assertIsString($type);
    }

    public function testGetRowClassesContainsRowClass(): void
    {
        $row = ElementRow::create();
        $classes = $row->getRowClasses();

        $this->assertStringContainsString('row', $classes);
    }

    public function testGetRowClassesIncludesExtraClass(): void
    {
        $row = ElementRow::create();
        $row->ExtraClass = 'custom-row-class';
        $classes = $row->getRowClasses();

        $this->assertStringContainsString('custom-row-class', $classes);
    }

    public function testGetSectionClassesContainsSectionClass(): void
    {
        $row = ElementRow::create();
        $classes = $row->getSectionClasses();

        $this->assertStringContainsString('section', $classes);
    }

    public function testGetSectionClassesIncludesCustomSectionClass(): void
    {
        $row = ElementRow::create();
        $row->CustomSectionClass = 'my-section';
        $classes = $row->getSectionClasses();

        $this->assertStringContainsString('my-section', $classes);
    }

    public function testGetContainerClassesNonFluid(): void
    {
        $row = ElementRow::create();
        $row->IsFluid = false;
        $classes = $row->getContainerClasses();

        $this->assertStringContainsString('container', $classes);
        $this->assertStringNotContainsString('container-fluid', $classes);
    }

    public function testGetContainerClassesFluid(): void
    {
        $row = ElementRow::create();
        $row->IsFluid = true;
        $classes = $row->getContainerClasses();

        $this->assertStringContainsString('container-fluid', $classes);
    }

    public function testGetCMSFieldsRemovesSizeAndOffsetFields(): void
    {
        $row = ElementRow::create();
        $fields = $row->getCMSFields();

        // Size and Offset fields should be removed from rows
        $this->assertNull($fields->dataFieldByName('SizeXS'));
        $this->assertNull($fields->dataFieldByName('SizeSM'));
        $this->assertNull($fields->dataFieldByName('SizeMD'));
        $this->assertNull($fields->dataFieldByName('SizeLG'));
        $this->assertNull($fields->dataFieldByName('SizeXL'));
        $this->assertNull($fields->dataFieldByName('OffsetXS'));
        $this->assertNull($fields->dataFieldByName('OffsetSM'));
        $this->assertNull($fields->dataFieldByName('OffsetMD'));
        $this->assertNull($fields->dataFieldByName('OffsetLG'));
        $this->assertNull($fields->dataFieldByName('OffsetXL'));
    }

    public function testGetCMSFieldsIncludesCustomSectionClassField(): void
    {
        $row = ElementRow::create();
        $fields = $row->getCMSFields();

        $this->assertNotNull($fields->dataFieldByName('CustomSectionClass'));
    }

    public function testDatabaseFieldsExist(): void
    {
        $row = ElementRow::create();

        // Verify the model has the expected DB fields
        $dbFields = $row->config()->get('db');
        $this->assertArrayHasKey('IsFluid', $dbFields);
        $this->assertArrayHasKey('CustomSectionClass', $dbFields);
    }

    public function testTableName(): void
    {
        $this->assertEquals('ElementRow', ElementRow::config()->get('table_name'));
    }
}
