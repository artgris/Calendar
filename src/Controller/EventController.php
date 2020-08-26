<?php

namespace App\Controller;

use App\Entity\Event;
use App\Service\EventService;
use App\Service\Yasumi\Holidays;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class EventController
 *
 * @Route("/api")
 */
class EventController extends AbstractController
{
    /**
     * @var EventService
     */
    private $eventService;

    /**
     * EventController constructor.
     */
    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }


    /**
     * @Route("/events/all", name="all_event")
     */
    public function stat(EntityManagerInterface $em, Holidays $holidays)
    {
        $events = $em->getRepository(Event::class)->findBy(['user' => $this->getUser()]);

        $response = $holidays->all($this->getUser());

        foreach ($events as $event) {
            /** @var Event $event */
            $response[] = $this->eventService->format($event);
        }

        return new JsonResponse($response);
    }

    /**
     * @Route("/events/copy/{id}", name="event_copy")
     */
    public function copyEvent(EntityManagerInterface $em, Event $event)
    {
        $newEvent = clone $event;
        $em->persist($newEvent);
        $em->flush();

        return new JsonResponse($this->eventService->format($newEvent));
    }


}
