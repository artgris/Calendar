<?php

namespace App\Controller;

use App\Service\Yasumi\Holidays;
use League\ColorExtractor\Color;
use League\ColorExtractor\ColorExtractor;
use League\ColorExtractor\Palette;
use Spatie\Browsershot\Browsershot;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;
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
            'yasumi_providers' => Yasumi::getProviders() + ['LU' => 'Luxembourg'],
            'rand_color' => '#'.substr(md5(mt_rand()), 0, 6)
        ]);
    }

    /**
     * @Route("/api/search-color", name="api_search")
     */
    public function color(KernelInterface $kernel, Request $request)
    {

        $id = uniqid(mt_rand(), true);
        $url = $request->query->get('url');
        if (strpos($url,'http') === false){
            $url = 'http://'.$url;
        }

        $img = "{$kernel->getProjectDir()}/public/{$id}.png";

        Browsershot::url($url)->fullPage()->save($img);

        $palette = Palette::fromFilename($img);
        $extractor = new ColorExtractor($palette);
        $colors = $extractor->extract(12);
        $tops = [];
        foreach ($colors as $toptmp) {
            $tops[] = Color::fromIntToHex($toptmp);
        }
        unlink($img);
        return new JsonResponse($tops);
    }

}
