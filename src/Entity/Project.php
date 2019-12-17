<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiProperty;
use ApiPlatform\Core\Annotation\ApiResource;
use App\Api\Filter\UserFilter;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ApiResource(
 *     attributes={"security": "is_granted('ROLE_USER')", "filters": {UserFilter::class}},
 *     collectionOperations={
 *         "get",
 *         "post": {"path": "/projects"},
 *         "stat": {"route_name": "stat"}
 *     },
 *     itemOperations={
 *         "get": {"security": "is_granted('ROLE_USER') or object.user == user"},
 *         "put": {"security": "is_granted('ROLE_USER') or object.user == user"},
 *         "delete": {"security": "is_granted('ROLE_USER') or object.user == user"},
 *     }
 * )
 * @ORM\Entity(repositoryClass="App\Repository\ProjectRepository")
 */
class Project
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @var string
     * @ORM\Column(type="string", length=255)
     * @Assert\Length(max=255)
     * @Assert\NotBlank
     */
    private $title;

    /**
     * @var ArrayCollection|Event[]
     *
     * @ORM\OneToMany(targetEntity="Event", mappedBy="project", cascade={"persist"}, orphanRemoval=true)
     */
    private $events;

    /**
     * @var string
     * @ORM\Column(type="string", nullable=true)
     */
    private $color;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\User", inversedBy="projects")
     * @ORM\JoinColumn(nullable=false)
     */
    public $user;

    /**
     * @ApiProperty()
     */
    public $textColor;

    /**
     * Project constructor.
     */
    public function __construct()
    {
        $this->events = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): void
    {
        $this->title = $title;
    }

    public function getEvents()
    {
        return $this->events;
    }

    public function setEvents($events): void
    {
        $this->events = $events;
    }

    public function addEvent(Event $event)
    {
        $this->events->add($event);
        $event->setProject($this);
    }

    public function removeEvent(Event $event)
    {
        $this->events->removeElement($event);
        $event->setProject(null);
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): void
    {
        $this->color = $color;
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
        $hexcolor = $this->color;
        $r = hexdec(substr($hexcolor, 1, 2));
        $g = hexdec(substr($hexcolor, 3, 2));
        $b = hexdec(substr($hexcolor, 5, 2));
        $yiq = (($r * 299) + ($g * 587) + ($b * 114)) / 1000;
        return ($yiq >= 128) ? '#000' : '#fff';
    }



}
