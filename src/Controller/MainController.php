<?php

namespace App\Controller;

use App\Service\Yasumi\Holidays;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Yasumi\Yasumi;

class MainController extends AbstractController
{
    /**
     * @Route("/", name="homepage")
     */
    public function index(Holidays $holidays)
    {
        return $this->render('main/index.html.twig', [
            'yasumi_providers' => Yasumi::getProviders() + ['LU' => 'Luxembourg']
        ]);
    }
}
