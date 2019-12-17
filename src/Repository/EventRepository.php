<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\User;
use App\Service\Yasumi\Luxembourg;
use DateInterval;
use DatePeriod;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;
use Yasumi\Holiday;
use Yasumi\Yasumi;

/**
 * @method Event|null find($id, $lockMode = null, $lockVersion = null)
 * @method Event|null findOneBy(array $criteria, array $orderBy = null)
 * @method Event[]    findAll()
 * @method Event[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    public function getStatArray(User $user, $date = null)
    {
        if ($date) {
            $startMonth = (new \DateTime($date))->modify('first day of this month');
            $endMonth = (clone $startMonth)->modify('+ 1 month');
        } else {
            $startMonth = new \DateTime('first day of this month midnight');
            $endMonth = new \DateTime('first day of next month midnight');
        }

        $events = $this->createQueryBuilder('e')
            ->join('e.user', 'user')
            ->andWhere('user = :user and e.start >= :start and e.start < :end')
            ->orWhere('user = :user and e.end >= :start and e.end < :end')
            ->orWhere('user = :user and e.start <= :start and e.end > :end')
            ->setParameter('start', $startMonth)
            ->setParameter('end', $endMonth)
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        /** @var Event $event */
        $dateSaved = [];
        foreach ($events as $event) {
            $start = $event->getStart();
            $end = $event->getEnd();

            if ($end) {
                $period = new DatePeriod($start, DateInterval::createFromDateString('1 day'), $end);
                foreach ($period as $dt) {
                    /** @var \DateTime $dt */
                    $weekday = $dt->format('N') < 6;
                    if ($dt >= $startMonth && $dt < $endMonth && $weekday) {
                        $dateSaved[$dt->format('d/m/Y')][] = $event;
                    }
                }
            } else {
                $dateSaved[$start->format('d/m/Y')][] = $event;
            }
        }
        $stat = [];
        foreach ($dateSaved as $eventsTmp) {
            $div = 0;
            $hours = 0;
            foreach ($eventsTmp as $eventTmpp) {
                /** @var Event $eventTmpp */
                if ($eventTmpp->getHours() === null) {
                    $div++;
                } else {
                    $hours += $eventTmpp->hoursByDay();
                }
            }

            foreach ($eventsTmp as $eventTmp) {
                if (!isset($stat[$eventTmp->getProject()->getTitle()])) {
                    $stat[$eventTmp->getProject()->getTitle()] = 0;
                }
                // en heures
                $stat[$eventTmp->getProject()->getTitle()] += $eventTmp->getHours() ? $eventTmp->hoursByDay() : (8 - $hours) / $div;
            }
        }

        return $stat;
    }

    public function getStat(User $user, $date = null)
    {
        $stat = $this->getStatArray($user, $date);
        $statArray = [];
        $total = 0;
        foreach ($stat as $key => $value) {
            $total += $value;
            $valueFormat = $this->formatDays($value);
            $statArray[] = $key.': '.$valueFormat;
        }

        return [
            'total' => $this->formatDays($total),
            'totalCalcul' => $this->totalDaysByDate($date),
            'projects' => $statArray,
        ];
    }

    private function formatDays($value)
    {
        if ($value == 0) {
            return '0J';
        }
        if ($value < 8) {
            $valueFormat = $this->convertHoursToMinutes($value);
        } else {
            $hours = round(fmod($value, 8), 2);
            $hoursFormat = '';
            if ($hours) {
                $hoursFormat = ' et '.$this->convertHoursToMinutes($hours);
            }
            $valueFormat = (int)($value / 8).'J '.$hoursFormat;
        }

        return $valueFormat;
    }

    private function totalDaysByDate($date = null)
    {
        if ($date) {
            $startMonth = (new \DateTime($date))->modify('first day of this month');
            $endMonth = (clone $startMonth)->modify('+ 1 month');
        } else {
            $startMonth = new \DateTime('first day of this month midnight');
            $endMonth = new \DateTime('first day of next month midnight');
        }

        $period = new DatePeriod($startMonth, DateInterval::createFromDateString('1 day'), $endMonth);
        $countDays = 0;
        foreach ($period as $dt) {
            /** @var \DateTime $dt */
            $weekday = $dt->format('N') < 6;
            if ($dt >= $startMonth && $dt < $endMonth && $weekday) {
                $countDays++;
            }
        }

        $res = Yasumi::create(Luxembourg::class, $startMonth->format('Y'));
        $currentMonth = $startMonth->format('m');
        foreach ($res as $day) {
            /** @var Holiday $day */
            if ($currentMonth === $day->format('m') && $day->format('N') < 6) {
                $countDays--;
            }
        }

        return $countDays.'J';
    }

    private function convertHoursToMinutes($hours)
    {
        $fraction = $hours - floor($hours);

        if ($fraction) {

            $min = (int)($fraction * 60);
            $hoursFormat = '';
            if ($hours) {
                $hoursFormat = floor($hours).'h et ';
            }

            return $hoursFormat.$min.' min';
        }

        return $hours.'h';

    }
}
