<?php

namespace WeDevelop\ElementalGrid\Tests;

use SilverStripe\Dev\SapphireTest;
use WeDevelop\ElementalGrid\CSSFramework\BootstrapCSSFramework;
use WeDevelop\ElementalGrid\CSSFramework\CSSFrameworkInterface;
use DNADesign\Elemental\Models\ElementContent;

class BootstrapCSSFrameworkTest extends SapphireTest
{
    protected static $extra_dataobjects = [
        ElementContent::class,
    ];

    private function createFramework(array $overrides = []): BootstrapCSSFramework
    {
        $element = ElementContent::create();
        foreach ($overrides as $key => $value) {
            $element->$key = $value;
        }
        return new BootstrapCSSFramework($element);
    }

    public function testGetRowClasses(): void
    {
        $framework = $this->createFramework();
        $classes = $framework->getRowClasses();

        $this->assertStringContainsString('row', $classes);
    }

    public function testGetColumnClass(): void
    {
        $framework = $this->createFramework();
        $this->assertEquals('col', $framework->getColumnClass());
    }

    public function testGetColumnClassesWithSize(): void
    {
        $framework = $this->createFramework(['SizeLG' => 6]);
        $classes = $framework->getColumnClasses();

        $this->assertStringContainsString('col-lg-6', $classes);
    }

    public function testGetColumnClassesWithOffset(): void
    {
        $framework = $this->createFramework(['OffsetLG' => 3]);
        $classes = $framework->getColumnClasses();

        $this->assertStringContainsString('offset-lg-3', $classes);
    }

    public function testGetContainerClassNonFluid(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContainerClass(false);

        $this->assertEquals('container', $class);
    }

    public function testGetContainerClassFluid(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContainerClass(true);

        $this->assertEquals('container-fluid', $class);
    }

    public function testGetContentColumnWidthClassWithValue(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContentColumnWidthClass('8');

        $this->assertStringContainsString('col-', $class);
        $this->assertStringContainsString('8', $class);
    }

    public function testGetContentColumnWidthClassWithoutValue(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContentColumnWidthClass(null);

        $this->assertStringContainsString('12', $class);
    }

    public function testGetMediaColumnWidthClassWithValue(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getMediaColumnWidthClass('8');

        // Should return the complementary size (12-8=4)
        $this->assertStringContainsString('col-', $class);
        $this->assertStringContainsString('4', $class);
    }

    public function testGetMediaColumnWidthClassWithoutValue(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getMediaColumnWidthClass(null);

        $this->assertNull($class);
    }

    public function testGetContentPaddingClass(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContentPaddingClass(CSSFrameworkInterface::DIRECTION_LEFT, 5);

        $this->assertStringContainsString('ps-', $class);
        $this->assertStringContainsString('5', $class);
    }

    public function testGetContentPaddingClassRight(): void
    {
        $framework = $this->createFramework();
        $class = $framework->getContentPaddingClass(CSSFrameworkInterface::DIRECTION_RIGHT, 3);

        $this->assertStringContainsString('pe-', $class);
        $this->assertStringContainsString('3', $class);
    }

    public function testVisibilityClassesXSHidden(): void
    {
        $framework = $this->createFramework(['VisibilityXS' => 'hidden']);
        $classes = $framework->getRowClasses();

        $this->assertStringContainsString('d-none', $classes);
        $this->assertStringContainsString('d-sm-block', $classes);
    }

    public function testVisibilityClassesLGHidden(): void
    {
        $framework = $this->createFramework(['VisibilityLG' => 'hidden']);
        $classes = $framework->getRowClasses();

        $this->assertStringContainsString('d-lg-none', $classes);
        $this->assertStringContainsString('d-xl-block', $classes);
    }

    public function testGetMediaColumnOrderClassesDefault(): void
    {
        $framework = $this->createFramework();
        $classes = $framework->getMediaColumnOrderClasses('order-1');

        $this->assertEquals('order-1', $classes);
    }

    public function testGetContentColumnOrderClassesDefault(): void
    {
        $framework = $this->createFramework();
        $classes = $framework->getContentColumnOrderClasses('order-1');

        $this->assertEquals('order-2', $classes);
    }

    public function testFrameworkKeyIsBootstrap(): void
    {
        $this->assertEquals('bootstrap', BootstrapCSSFramework::$framework_key);
    }
}
