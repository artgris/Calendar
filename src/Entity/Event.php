<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiProperty;
use ApiPlatform\Core\Annotation\ApiResource;
use App\Api\Filter\UserFilter;
use DateInterval;
use DatePeriod;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ApiResource(
 *     attributes={"security": "is_granted('ROLE_USER')", "filters": {UserFilter::class}},
 *     collectionOperations={
 *         "post": {"path": "/events"},
 *         "stat": {
 *             "route_name": "all_event",
 *         }
 *     }),
 *  itemOperations={
 *         "get"={"security"="is_granted('ROLE_USER') or object.user == user"},
 *         "put"={"security"="is_granted('ROLE_USER') or object.user == user"},
 *     }
 * @ORM\Entity(repositoryClass="App\Repository\EventRepository")
 */
class Event
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @var \DateTime
     * @ORM\Column(type="date")
     * @Assert\Date
     * @Assert\NotBlank
     */
    private $start;

    /**
     * @var \DateTime
     * @ORM\Column(type="date", nullable=true)
     * @Assert\Date
     */
    private $end;

    /**
     * @ApiProperty
     */
    private $title;

    /**
     * @ApiProperty
     */
    private $allDay = true;

    /**
     * @var Project
     * @ORM\ManyToOne(targetEntity="Project", inversedBy="events")
     */
    private $project;

    /**
     * @ApiProperty
     */
    private $color;

    /**
     * @ApiProperty
     */
    private $projectName;

    /**
     * @var float
     *
     * @ORM\Column(type="float", options={"unsigned": true}, nullable=true)
     * @Assert\GreaterThan(value="0")
     */
    private $hours;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\User", inversedBy="events")
     * @ORM\JoinColumn(nullable=false)
     */
    public $user;

    /**
     * @ApiProperty
     */
    public $textColor;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStart(): ?\DateTime
    {
        return $this->start;
    }

    public function setStart(?\DateTime $start): void
    {
        $this->start = $start;
    }

    public function getEnd(): ?\DateTime
    {
        return $this->end;
    }

    public function setEnd(?\DateTime $end): void
    {
        $this->end = $end;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(?Project $project): void
    {
        $this->project = $project;
    }

    public function getTitle()
    {
        $hours = '';
        if ($this->getHours()) {
            $hours = ' ('.$this->getHours().'h'.')';
        }

        return $this->project->getTitle().$hours;
    }

    public function isAllDay(): ?bool
    {
        return $this->allDay;
    }

    public function getColor(): ?string
    {
        return $this->project->getColor();
    }

    public function getHours(): ?float
    {
        return $this->hours;
    }

    public function setHours(?float $hours): void
    {
        $this->hours = $hours;
    }

    public function countDay(User $user)
    {
        if ($this->end) {
            $isWeekends = $user->isWeekends();
            $days = 0;
            $period = new DatePeriod($this->start, DateInterval::createFromDateString('1 day'), $this->end);
            foreach ($period as $dt) {
                /** @var \DateTime $dt */
                if ($isWeekends || (!$isWeekends && $dt->format('N') <= 5)) {
                    $days++;
                }
            }
            return $days;
        }

        return 1;
    }

    public function hoursByDay(User $user)
    {
        return $this->hours / $this->countDay($user);
    }

    public function getProjectName()
    {
        return $this->project->getTitle();
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getTextColor()
    {
        return $this->project->getTextColor();
    }
}
