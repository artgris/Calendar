<?php

namespace App\Service\Yasumi;

use DateTime;
use DateTimeZone;
use Yasumi\Holiday;
use Yasumi\Provider\AbstractProvider;
use Yasumi\Provider\ChristianHolidays;
use Yasumi\Provider\CommonHolidays;

/**
 * Provider for all holidays in Luxembourg.
 */
class Luxembourg extends AbstractProvider
{
    use CommonHolidays;
    use ChristianHolidays;

    /**
     * Code to identify this Holiday Provider. Typically this is the ISO3166 code corresponding to the respective
     * country or sub-region.
     */
    public const ID = 'LU';

    /**
     * Initialize holidays for Luxembourg.
     *
     * @throws \Yasumi\Exception\InvalidDateException
     * @throws \InvalidArgumentException
     * @throws \Yasumi\Exception\UnknownLocaleException
     * @throws \Exception
     */
    public function initialize(): void
    {
        $this->timezone = 'Europe/Luxembourg';

        // Add common holidays
        $this->addHoliday($this->newYearsDay($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->easterMonday($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->internationalWorkersDay($this->year, $this->timezone, $this->locale));
        $this->calculateEuropeDay();
        $this->addHoliday($this->ascensionDay($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->pentecostMonday($this->year, $this->timezone, $this->locale));
        $this->calculateNationalDay();
        $this->addHoliday($this->assumptionOfMary($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->allSaintsDay($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->christmasDay($this->year, $this->timezone, $this->locale));
        $this->addHoliday($this->secondChristmasDay($this->year, $this->timezone, $this->locale));
    }

    public function calculateEuropeDay(): void
    {
        if ($this->year >= 2019) {
            $this->addHoliday(new Holiday('europeDay', [
                'en_US' => 'Europe day',
                'fr_FR' => "La Journée de l'Europe",
            ], new DateTime("$this->year-5-9", new DateTimeZone($this->timezone)), $this->locale));
        }
    }

    public function calculateNationalDay(): void
    {
        $this->addHoliday(new Holiday('nationalDay', [
            'en_US' => 'National day',
            'fr_FR' => 'La Fête nationale',
        ], new DateTime("$this->year-6-23", new DateTimeZone($this->timezone)), $this->locale));
    }
}
