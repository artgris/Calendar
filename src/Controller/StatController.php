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
     * @Route("/api/projects/stat", name="stat")
     */
    public function stat(EntityManagerInterface $em, Request $request)
    {
        $stats = $em->getRepository(Event::class)->getStat($this->getUser(), $request->query->get('date'));

        return new JsonResponse($stats);
    }

    /**
     * @Route("/api/weather", name="weather")
     */
    public function weather(EntityManagerInterface $em, Request $request)
    {

        $apiKey = $this->getParameter('open_weather_key');
        $user = $this->getUser();
        /** @var User $user */
        $lat = $user->getLatitude();
        $lng = $user->getLongitude();
        $client = new Client();

        $response = $client->get("https://api.openweathermap.org/data/2.5/onecall?lat={$lat}&lon={$lng}&appid={$apiKey}&exclude=minutely,hourly&units=metric");

        $data = json_decode($response->getBody()->getContents());
        $w = [];
        $today = new \DateTime();
        $i = 0;

        foreach ($data->daily as $day) {
            if ($i === 0) {
                $current = $data->current;
                $day->weather = $current->weather;
                $day->temp->day = $current->temp;
            }
            $detail = $this->render('weather/detail.html.twig', ['day' => $day]);
            $icon = $day->weather[0]->icon;
            $w[$today->format('Y-m-d')] = [
                'temp' => round($day->temp->day, 1),
                'icon' => '/cute-weather/png/' . self::WEATHER_ICON[$icon] . '.png',
                'detail' => $detail->getContent()
            ];
            $today->modify('+1day');
            $i++;
        }

        return new JsonResponse($w);
    }

}
