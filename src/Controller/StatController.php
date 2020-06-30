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

        $response = $client->get("https://api.openweathermap.org/data/2.5/onecall?lat={$lat}&lon={$lng}&appid={$apiKey}&exclude=current,minutely,hourly");

        $data = json_decode($response->getBody()->getContents());
        $w = [];
        foreach ($data->daily as $day) {
            $icon = $day->weather[0]->icon;
            $w[] = "http://openweathermap.org/img/wn/{$icon}@2x.png";
        }

        return new JsonResponse($w);
    }

}
