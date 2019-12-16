<?php

namespace App\Service\Yasumi;

use Yasumi\Yasumi;

class Holidays
{
    public function all(): array
    {
        $years = [
            date('Y', strtotime('-1 year')),
            date('Y'),
            date('Y', strtotime('+1 year')),
        ];

        $response = [];

        foreach ($years as $year) {
            $res = Yasumi::create(Luxembourg::class, $year);
            foreach ($res->getHolidayDates() as $name => $holidayDate) {
                if ($name == 'secondChristmasDay') {
                    $name = 'Lendemain de Noël';
                }
                $response[] = [
                    'title' => $res->getHoliday($name)->translations['fr'] ?? ($res->getHoliday($name)->translations['fr_FR'] ?? $name),
                    'allDay' => true,
                    'color' => '#E2EAF0',
                    'textColor' => '#6D757C',
                    'editable' => false,
                    'start' => $holidayDate,
                ];
            }
        }

        return $response;
    }
}
