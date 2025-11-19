<?php

namespace WeDevelop\ElementalGrid\Tasks;

use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Dev\BuildTask;
use SilverStripe\ORM\Queries\SQLSelect;
use SilverStripe\ORM\Queries\SQLUpdate;
use SilverStripe\PolyExecution\PolyOutput;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use WeDevelop\ElementalGrid\Models\ElementRow;

class MigrateNamespaceTask extends BuildTask
{
    protected string $title = 'Elemental grid namespace migration';

    protected static string $description = 'Migrate elemental grid TheWebmen namespace to WeDevelop namespace';

    private static string $segment = 'migrate-elemental-grid-namespace';

    protected function execute(InputInterface $input, PolyOutput $output): int
    {
        $elements = BaseElement::get()
            ->where([
                'ClassName' => 'TheWebmen\ElementalGrid\Models\ElementRow'
            ]);

        $counter = 0;
        $totalElements = $elements->count();

        $output->writeln(sprintf("Starting migration of %s elements\n", $totalElements));

        /** @var BaseElement $element */
        foreach ($elements as $element) {
            $isPublished = $element->isPublished();

            $element->setField('ClassName', 'WeDevelop\ElementalGrid\Models\ElementRow');
            $element->write();

            if ($isPublished) {
                $element->publishSingle();
            }

            $counter++;

            $output->writeln(sprintf("Migrated %s of %s elements", $counter, $totalElements));
        }

        $output->writeln(sprintf("\nMigration done for %s elements!", $counter));
        
        return Command::SUCCESS;
    }
}
