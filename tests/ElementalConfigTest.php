<?php

namespace WeDevelop\ElementalGrid\Tests;

use SilverStripe\Dev\SapphireTest;
use WeDevelop\ElementalGrid\ElementalConfig;

class ElementalConfigTest extends SapphireTest
{
    public function testGetDefaultViewportReturnsString(): void
    {
        $viewport = ElementalConfig::getDefaultViewport();

        $this->assertIsString($viewport);
        $this->assertNotEmpty($viewport);
        $this->assertContains($viewport, ['XS', 'SM', 'MD', 'LG', 'XL']);
    }

    public function testGetCSSFrameworkNameReturnsString(): void
    {
        $name = ElementalConfig::getCSSFrameworkName();

        $this->assertIsString($name);
        $this->assertNotEmpty($name);
    }

    public function testGetGridColumnCountReturnsPositiveInt(): void
    {
        $count = ElementalConfig::getGridColumnCount();

        $this->assertIsInt($count);
        $this->assertGreaterThan(0, $count);
    }

    public function testGetDefaultTitleTagReturnsValidTag(): void
    {
        $tag = ElementalConfig::getDefaultTitleTag();

        $this->assertIsString($tag);
        $this->assertMatchesRegularExpression('/^h[1-6]$/', $tag);
    }

    public function testGetEnableCustomTitleClassesReturnsBool(): void
    {
        $enabled = ElementalConfig::getEnableCustomTitleClasses();

        $this->assertIsBool($enabled);
    }
}
