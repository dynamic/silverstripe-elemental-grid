<?php

namespace WeDevelop\ElementalGrid\Tests;

use DNADesign\Elemental\Models\ElementContent;
use SilverStripe\Dev\SapphireTest;
use WeDevelop\ElementalGrid\ElementalConfig;
use WeDevelop\ElementalGrid\Extensions\BaseElementExtension;
use WeDevelop\ElementalGrid\Models\ElementRow;

class BaseElementExtensionTest extends SapphireTest
{
    protected static $extra_dataobjects = [
        ElementContent::class,
        ElementRow::class,
    ];

    public function testPopulateDefaultsSetsFullWidth(): void
    {
        // populateDefaults is called via the extension hook system during create()
        // The extension sets the default viewport size field to the grid column count
        $defaultViewport = 'Size' . ElementalConfig::getDefaultViewport();
        $expectedCount = ElementalConfig::getGridColumnCount();

        // Create element and manually trigger populateDefaults via the extension
        $element = ElementContent::create();
        $extension = $element->getExtensionInstance(BaseElementExtension::class);
        if ($extension) {
            $extension->setOwner($element);
            $extension->populateDefaults();
            $this->assertEquals(
                $expectedCount,
                $element->$defaultViewport,
                'Default size should be the full grid column count'
            );
        } else {
            $this->markTestSkipped('BaseElementExtension not applied to ElementContent');
        }
    }

    public function testGetTitleTagReturnsDefaultWhenNull(): void
    {
        $element = ElementContent::create();
        // TitleTag is null by default
        $tag = $element->getTitleTag();

        $this->assertNotEmpty($tag);
        $this->assertIsString($tag);
    }

    public function testGetTitleTagReturnsSetValue(): void
    {
        $element = ElementContent::create();
        $element->TitleTag = 'h3';
        $tag = $element->getTitleTag();

        $this->assertEquals('h3', $tag);
    }

    public function testGetAnchorTitleFormat(): void
    {
        $element = ElementContent::create();
        $element->Title = 'My Title';
        $element->ID = 42;

        $anchor = $element->getAnchorTitle();

        $this->assertStringContainsString('My Title', $anchor);
        $this->assertStringContainsString('42', $anchor);
        $this->assertStringContainsString('_', $anchor);
    }

    public function testGetColumnClassesReturnsString(): void
    {
        $element = ElementContent::create();
        $classes = $element->getColumnClasses();

        $this->assertIsString($classes);
    }

    public function testUpdateBlockSchemaContainsGridData(): void
    {
        $element = ElementContent::create();
        $element->SizeMD = 6;
        $element->OffsetMD = 2;

        // Call updateBlockSchema directly on the extension (it uses &$blockSchema reference)
        $extension = $element->getExtensionInstance(BaseElementExtension::class);
        $this->assertNotNull($extension, 'BaseElementExtension must be applied');
        $extension->setOwner($element);

        $blockSchema = [];
        $extension->updateBlockSchema($blockSchema);

        $this->assertArrayHasKey('grid', $blockSchema);
        $this->assertArrayHasKey('isRow', $blockSchema['grid']);
        $this->assertArrayHasKey('gridColumns', $blockSchema['grid']);
        $this->assertArrayHasKey('column', $blockSchema['grid']);

        $this->assertFalse($blockSchema['grid']['isRow']);
        $this->assertEquals(ElementalConfig::getGridColumnCount(), $blockSchema['grid']['gridColumns']);
    }

    public function testUpdateBlockSchemaIdentifiesRow(): void
    {
        $row = ElementRow::create();
        $row->IsFluid = true;

        // Call directly on extension to handle the reference parameter
        $extension = $row->getExtensionInstance(BaseElementExtension::class);
        $this->assertNotNull($extension, 'BaseElementExtension must be applied');
        $extension->setOwner($row);

        $blockSchema = [];
        $extension->updateBlockSchema($blockSchema);

        $this->assertTrue($blockSchema['grid']['isRow']);
        $this->assertTrue($blockSchema['grid']['isFluid']);
    }

    public function testGetTitleHTMLTagsContainsExpectedOptions(): void
    {
        $element = ElementContent::create();
        $tags = $element->getTitleHTMLTags();

        $this->assertIsArray($tags);
        $this->assertArrayHasKey('h1', $tags);
        $this->assertArrayHasKey('h2', $tags);
        $this->assertArrayHasKey('h3', $tags);
        $this->assertArrayHasKey('h4', $tags);
        $this->assertArrayHasKey('h5', $tags);
        $this->assertArrayHasKey('h6', $tags);
    }

    public function testGetCSSFrameworkReturnsInterface(): void
    {
        $element = ElementContent::create();
        $framework = $element->getCSSFramework();

        $this->assertNotNull($framework);
    }
}
