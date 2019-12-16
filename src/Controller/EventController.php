<?php

namespace App\Controller;

use App\Entity\Event;
use App\Service\Yasumi\Holidays;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class EventController extends AbstractController
{
    /**
     * @Route("/api/events/all", name="all_event")
     */
    public function stat(EntityManagerInterface $em, Holidays $holidays)
    {
        $events = $em->getRepository(Event::class)->findBy(['user' => $this->getUser()]);

        $response = $holidays->all();

        foreach ($events as $event) {
            $response[] = [
                'id' => $event->getId(),
                'color' => $event->getColor(),
                'title' => $event->getTitle(),
                'hours' => $event->getHours(),
                'projectName' => $event->getProjectName(),
                'allDay' => true,
                'start' => $event->getStart()->format('Y-m-d\TH:i:sP'),
                'end' => $event->getEnd() ? $event->getEnd()->format('Y-m-d\TH:i:sP') : '',
                'project' => '/api/projects/'.$event->getProject()->getId(),
            ];
        }

        return new JsonResponse($response);
    }
}
