<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route("/api")
 */
class StatController extends AbstractController
{
    const WEATHER_ICON = [
        '01d' => '001-sunny',
        '02d' => '011-sunny',
        '03d' => '002-cloud',
        '04d' => '020-cloudy',
        '09d' => '005-heavy rain',
        '10d' => '004-rain',
        '11d' => '021-thunderstorm',
        '13d' => '007-snow',
        '50d' => '019-fog',
    ];

    /**
     * @Route("/projects/stat", name="stat")
     */
    public function stat(EntityManagerInterface $em, Request $request)
    {
        $stats = $em->getRepository(Event::class)->getStat($this->getUser(), $request->query->get('date'));

        return new JsonResponse($stats);
    }

    /**
     * @Route("/weather", name="weather")
     */
    public function weather(EntityManagerInterface $em, Request $request)
    {
        $apiKey = $this->getParameter('open_weather_key');
        $user = $this->getUser();
        /** @var User $user */
        $lat = $user->getLatitude();
        $lng = $user->getLongitude();

        $w = [];
        if ($lat && $lng) {
            $client = new Client();

            $response = $client->get("https://api.openweathermap.org/data/2.5/onecall?lat={$lat}&lon={$lng}&appid={$apiKey}&exclude=minutely,hourly&units=metric");

            $data = json_decode($response->getBody()->getContents());
            $today = new \DateTime();
            $i = 0;
            foreach ($data->daily as $day) {
                $parms = ['day' => $day];

                if ($i === 0) {
                    $parms['icon'] = $this->getIcon(self::WEATHER_ICON[$day->weather[0]->icon]);
                }
                $detail = $this->render('weather/detail.html.twig', $parms);

                $temp = $i === 0 ? $data->current->temp : $day->temp->day;
                $weather = $i === 0 ? $data->current->weather : $day->weather;

                $w[$today->format('Y-m-d')] = [
                    'temp' => round($temp, 1),
                    'icon' => $this->getIcon(self::WEATHER_ICON[$weather[0]->icon]),
                    'detail' => $detail->getContent(),
                ];
                $today->modify('+1day');
                $i++;
            }
        }

        return new JsonResponse($w);
    }

    private function getIcon(string $icon)
    {
        return '/cute-weather/png/'.$icon.'.png';
    }
}
