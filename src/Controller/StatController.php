<?php

namespace App\Controller;

use App\Entity\Event;
use Doctrine\ORM\EntityManagerInterface;
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
}
