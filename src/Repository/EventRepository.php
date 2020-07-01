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
        $isWeekends = $user->isWeekends();

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
                    if ($dt >= $startMonth && $dt < $endMonth) {
                        if ($isWeekends || (!$isWeekends && $this->isAWeekDay($dt))) {
                            $dateSaved[$dt->format('d/m/Y')][] = $event;
                        }
                    }
                }
            } else {
                if ($isWeekends || (!$isWeekends && $this->isAWeekDay($start))) {
                    $dateSaved[$start->format('d/m/Y')][] = $event;
                }
            }
        }
        $stat = [];
        foreach ($dateSaved as $eventsTmp) {
            $div = 0;
            $hours = 0;

            // premier parcours des events du jour pour determiner le nombre d'heure des events
            foreach ($eventsTmp as $eventTmpp) {
                /** @var Event $eventTmpp */
                if ($eventTmpp->getHours() === null) {
                    $div++;
                    // si il n'y a pas de durée d'heure sur l'evenement, on augment le div pour divisé les events sans heure
                } else {
                    // nombre d'heure de l'evenement par jour
                    $hours += $eventTmpp->hoursByDay($user);
                }
            }

            foreach ($eventsTmp as $eventTmp) {
                if (!isset($stat[$eventTmp->getProject()->getTitle()])) {
                    $stat[$eventTmp->getProject()->getTitle()] = ['hours' => 0, 'list' => []];
                }
                if ($hours > $user->getWorkingHour()) {
                    $hours = $user->getWorkingHour();
                }
                // en heures
                //pour chaque event avec heure, on ajoute le nombre d'heure par jour de l'event sinon, on calcul le nombre d'heure restantes et on divise par le nombre d'event sans heure
                $currentDuration = $eventTmp->getHours() ? $eventTmp->hoursByDay($user) : ($user->getWorkingHour() - $hours) / $div;
                $stat[$eventTmp->getProject()->getTitle()]['hours'] += $currentDuration;

                if ($eventTmp->getInfo()) {

                    if (!isset($stat[$eventTmp->getProject()->getTitle()]['list'][$eventTmp->getId()]['duration'])) {
                        $stat[$eventTmp->getProject()->getTitle()]['list'][$eventTmp->getId()]['duration'] = $currentDuration;
                        $duration = $currentDuration;
                    } else {
                        $duration = $stat[$eventTmp->getProject()->getTitle()]['list'][$eventTmp->getId()]['duration'] + $currentDuration;
                    }
                    $stat[$eventTmp->getProject()->getTitle()]['list'][$eventTmp->getId()] = ['duration' => $duration, 'info' => $eventTmp->getInfo()];
                }
            }
        }
        foreach ($stat as &$st) {
            $listTmp = [];
            foreach ($st['list'] as $key => $list) {
                $duration = $this->formatDays($list['duration'], $user);
                $listTmp[] = $list['info']." ({$duration})";
            }
            $st['list'] = $listTmp;
        }

        return $stat;
    }

    public function getStat(User $user, $date = null)
    {
        $stat = $this->getStatArray($user, $date);
        $statArray = [];
        $total = 0;

        uasort($stat, function ($a, $b) {
            return ($a['hours'] < $b['hours']);
        });

        foreach ($stat as $key => $value) {
            $total += $value['hours'];
            $valueFormat = $this->formatDays($value['hours'], $user);
            $statArray[$key] = ['hours' => $key.' : '.$valueFormat, 'list' => $value['list']];
        }
        return [
            'total' => $this->formatDays($total, $user),
            'totalCalcul' => $this->totalDaysByDate($user, $date),
            'projects' => $statArray,
        ];
    }

    private function formatDays($value, User $user)
    {

        if ($value == 0) {
            return '0J';
        }

        if ($value < $user->getWorkingHour()) {
            $valueFormat = $this->convertHoursToMinutes($value);
        } else {
            $hours = round(fmod($value, $user->getWorkingHour()), 2);
            $hoursFormat = '';
            if ($hours) {
                $hoursFormat = $this->convertHoursToMinutes($hours, true);
            }
            $valueFormat = (int)($value / $user->getWorkingHour()).'J'.$hoursFormat;
        }

        return $valueFormat;
    }

    private function totalDaysByDate(User $user, $date = null)
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
        $isWeekends = $user->isWeekends();
        foreach ($period as $dt) {
            /** @var \DateTime $dt */
            if ($dt >= $startMonth && $dt < $endMonth) {
                if ($isWeekends || (!$isWeekends && $this->isAWeekDay($dt))) {
                    $countDays++;
                }
            }
        }

        $res = Yasumi::create(Luxembourg::class, $startMonth->format('Y'));
        $currentMonth = $startMonth->format('m');
        foreach ($res as $day) {
            /** @var Holiday $day */
            if ($currentMonth === $day->format('m')) {
                if ($isWeekends || (!$isWeekends && $this->isAWeekDay($day))) {
                    $countDays--;
                }
            }
        }

        return $countDays.'J';
    }

    private function isAWeekDay(\DateTime $dateTime): bool
    {
        return $dateTime->format('N') <= 5;
    }

    private function convertHoursToMinutes($hours, $and = false)
    {
        $pre = '';
        $andString = ' et ';
        $fraction = $hours - floor($hours);
        $floor = floor($hours);

        if ($fraction) {
            $min = round($fraction * 60);
            $hoursFormat = '';
            if ($and) {
                $pre = $andString;
            }
            if ($floor) {
                if ($and) {
                    $pre = ', ';
                }
                $hoursFormat = $floor.'h'.$andString;
            }

            return $pre.$hoursFormat.$min.'min';
        }

        if ($and) {
            $pre = $andString;
        }

        return $pre.$hours.'h';
    }
}
