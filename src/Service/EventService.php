<?php


namespace App\Service;


use App\Entity\Event;

class EventService
{

    public function format(Event $event)
    {
        return [
            'id' => $event->getId(),
            'color' => $event->getColor(),
            'textColor' => $event->getTextColor(),
            'title' => $event->getTitle(),
            'hours' => $event->getHours(),
            'info' => $event->getInfo(),
            'projectName' => $event->getProjectName(),
            'allDay' => true,
            'start' => $event->getStart()->format('Y-m-d\TH:i:sP'),
            'end' => $event->getEnd() ? $event->getEnd()->format('Y-m-d\TH:i:sP') : '',
            'project' => '/api/projects/' . $event->getProject()->getId(),
        ];
    }

}