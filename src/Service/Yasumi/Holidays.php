<?php

namespace App\Service\Yasumi;

use App\Entity\User;
use Yasumi\Yasumi;

class Holidays
{
    public function all(User $user): array
    {
        $years = [
            date('Y', strtotime('-1 year')),
            date('Y'),
            date('Y', strtotime('+1 year')),
        ];
        $response = [];

        $provider = $this->getProviderFromString($user->getHoliday());

        if ($provider === null) {
            return [];
        }

        foreach ($years as $year) {
            $res = Yasumi::create($provider, $year);
            foreach ($res->getHolidayDates() as $name => $holidayDate) {
                if ($name == 'secondChristmasDay') {
                    $name = 'Lendemain de Noël';
                }
                $response[] = [
                    'title' => $res->getHoliday($name)->translations['fr'] ?? ($res->getHoliday($name)->translations['fr_FR'] ?? $res->getHoliday($name)->translations['en'] ?? $name),
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

    private function getProviderFromString(?string $provider = 'LU')
    {
        if ($provider === 'LU') {
            return "App\Service\Yasumi\Luxembourg";
        }

        return Yasumi::getProviders()[$provider] ?? null;
    }
}
