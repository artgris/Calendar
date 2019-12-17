import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, {Draggable} from '@fullcalendar/interaction' // needed for dayClick
import frLocale from '@fullcalendar/core/locales/fr';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import * as axios from "axios";
import moment from "moment";
import 'moment/locale/fr';
import {GithubPicker} from 'react-color';

const Alert = withReactContent(Swal);

export function formatDate(date, removeADay) {
    if (date) {
        let momentDate = moment(date);
        if (removeADay) {
            momentDate = momentDate.subtract(1, "days")
        }
        momentDate = momentDate.format('dddd, D MMMM');
        return momentDate.charAt(0).toUpperCase() + momentDate.slice(1)
    }
}

export default class CalendarApp extends React.Component {

    calendarComponentRef = React.createRef();

    state = {
        calendarEvents: [],
        events: [],
        value: '',
        stat: {
            projects: [],
            total: '',
            totalCalcul: ''
        },
        errors: [],
        background: '',
        projectName: 'ff'
    };

    constructor(props, context) {
        super(props, context);
        this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
        this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
        this.updateProjectName = this.updateProjectName.bind(this);
    }

    render() {

        const hasProject = this.state.events.length > 0;
        return (
            <div className='mt-2 row'>
                <div className="col-md-3">
                    {hasProject &&
                    <p className="text-center">
                        <strong> Projets</strong>
                    </p>
                    }

                    <div id="external-events" className="pb-2">
                        {this.state.events.map(event => (
                            <div
                                onClick={this.projectClick}
                                className="fc-event row m-2"
                                style={{backgroundColor: event.color, color: event.textColor}}
                                title={event.title}
                                data-color={event.color}
                                data-id={event.id}
                                key={event.id}
                            >
                                <div className="col">
                                    {event.title}
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasProject &&
                    <hr/>
                    }

                    <div className="row pb-3">
                        <div className="col-12">
                            <p className="text-center">
                                <strong>Ajouter un Projet</strong>
                            </p>
                        </div>
                        <form className="col" onSubmit={this.handleProjectSubmit}>
                            {this.state.errors.map(error => (
                                <div key={error} className="alert alert-danger " role="alert">
                                    Error: {error.message}
                                    <button type="button" className="close" onClick={this.dismissibleFormError}
                                            aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            ))}
                            <div className="form-group">
                                <input className="form-control mb-1" placeholder="Nom du Projet"
                                       value={this.state.value}
                                       required
                                       onChange={this.handleProjectNameChange}
                                       type="text"/>

                                <input className="form-control"
                                       value={this.state.background}
                                       type="hidden"/>

                                <GithubPicker
                                    onChange={this.handlePickerChange}
                                    triangle='hide'
                                    colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]}
                                    width='100%'
                                />
                            </div>
                            <button type="submit" className="btn btn-sm btn-outline-primary">
                                <i className="fas fa-plus-circle"/> Ajouter le Projet
                            </button>
                        </form>
                    </div>
                </div>
                <div className="col pb-3">
                    <FullCalendar
                        defaultView="dayGridMonth"
                        header={{
                            right: 'today prev,next',
                            left: 'title',
                            center: ''
                        }}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        ref={this.calendarComponentRef}
                        weekends={false}
                        events={this.state.calendarEvents}
                        eventLimit={true}
                        editable={true}
                        drop={this.drop}
                        eventTextColor='white'
                        displayEventTime={false}
                        locale={frLocale}
                        eventClick={this.eventClick}
                        eventReceive={this.eventReceive}
                        eventResize={this.eventDrop}
                        eventDrop={this.eventDrop}
                        datesRender={this.datesRender}
                    />
                </div>
                <div className="col-md-3">
                    <div className="col-12">
                        <p className="text-center">
                            <strong>Récapitulatif du mois</strong>
                        </p>
                    </div>

                    <ul>
                        {this.state.stat.projects.map(event => (
                            <li key={event + 'Stat'}>{event}</li>
                        ))}
                    </ul>
                    <p><strong>Total : </strong> {this.state.stat.total}</p>
                    {this.state.stat.totalCalcul !== null &&
                    <p><strong>Total calculé : </strong> {this.state.stat.totalCalcul}</p>
                    }
                </div>
            </div>
        )
    }

    /**
     * componentDidMount() est appelée immédiatement après que le composant est monté (inséré dans l’arbre).
     * C’est ici que vous devriez placer les initialisations qui requièrent l’existence de nœuds du DOM
     */
    componentDidMount() {
        let draggableEl = document.getElementById("external-events");
        new Draggable(draggableEl, {
            itemSelector: ".fc-event",
            eventData: function (eventEl) {
                let title = eventEl.getAttribute("title");
                let id = eventEl.getAttribute("data");
                return {
                    title: title,
                    id: id,
                };
            }
        });

        this.updateProject();
        this.updateEvent();
    }

    // Fullcalendar Events
    updateEvent = () => {
        axios({
            url: this.props.url + '/events/all',
            method: 'get',
        }).then((resultdata) => {
            this.setState({
                calendarEvents: resultdata.data
            });
        });
    };


    // au click sur le projet
    projectClick = (event) => {
        const project = event.currentTarget.dataset;

        Alert.fire({
            title: "Editer un Projet",
            showCancelButton: true,
            html:
                <>
                    <input className="form-control mb-1"
                           type="text"
                           onChange={(e) => this.updateProjectName(e, project.id)}
                           defaultValue={event.currentTarget.title}/>

                    <GithubPicker
                        onChange={(e) => this.updateProjectColor(e, project.id)}
                        triangle='hide'
                        colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]}
                        width='100%'
                    />
                </>
            ,
            confirmButtonColor: "#d33",
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
            allowEscapeKey: false,
            allowEnterKey: false,
        }).then(result => {
            if (result.value) {
                const key = project.id;
                const url = this.props.url;
                axios({
                    url: this.props.url + '/projects/' + key,
                    method: 'delete',
                }).then(() => {
                    this.setState({
                        events: this.state.events.filter(function (event) {
                            return event.id !== parseInt(key)
                        })
                    });
                    this.setState({
                        calendarEvents: this.state.calendarEvents.filter(function (event) {
                            return event.project !== url + '/projects/' + parseInt(key)
                        })
                    });
                    this.datesRender();
                });
            }
        }).catch((error) => {
            alert(error.message)
        })
    };


    // Triggered when the user clicks an event.
    // au click d'un event du calendar
    eventClick = (eventClick) => {
        if (eventClick.event.durationEditable === false) {
            return;
        }

        const startDate = formatDate(eventClick.event.start);
        let endDate = formatDate(eventClick.event.end, true);

        if (startDate === endDate) {
            endDate = null;
        }
        const id = eventClick.event.id;
        Alert.fire({
            title: eventClick.event.extendedProps.projectName,
            allowEscapeKey: false,
            allowEnterKey: false,
            html: <>
                <div className="row mt-4 justify-content-center">
                    <div className="input-group col-4 mb-1">
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            onChange={(e) => this.updateEventHours(e, eventClick.event)}
                            defaultValue={eventClick.event.extendedProps.hours}
                        />
                        <div className="input-group-append">
                            <span className="input-group-text">heures</span>
                        </div>
                    </div>
                </div>
                <p className="mt-4">
                    {endDate ? startDate + ' au ' + endDate : startDate}
                </p>
            </>,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        }).then(result => {
            if (result.value) {
                axios({
                    url: this.props.url + '/events/' + eventClick.event.id,
                    method: 'delete',
                }).then(() => {
                    eventClick.event.remove();
                    this.setState({
                        calendarEvents: this.state.calendarEvents.filter(function (event) {
                            return event.id !== parseInt(id)
                        })
                    });
                    this.datesRender();
                });
            }
        });
    };

    // Triggered when dragging stops and the event has moved to a different day/time.
    // quand on deplace ou resize un event
    eventDrop = (eventDropInfo) => {

        axios({
            url: this.props.url + '/events/' + eventDropInfo.event.id,
            method: 'put',
            data: {
                "start": moment(eventDropInfo.event.start).format("YYYY-MM-DD"),
                "end": eventDropInfo.event.end ? moment(eventDropInfo.event.end).format("YYYY-MM-DD") : null,
            }
        }).then((result) => {
            let key = parseInt(eventDropInfo.event.id);
            this.setState(prevState => ({
                calendarEvents: prevState.calendarEvents.map(
                    el => el.id === key ? {...el, start: result.data.start, end: result.data.end} : el
                )
            }));
            this.datesRender();
        })
    };


    // Called when an external draggable element or an event from another calendar has been dropped onto the calendar.
    // creation d'un event après un drag un drop des projets
    drop = (value) => {
        axios({
            url: this.props.url + '/events',
            method: 'post',
            data: {
                "start": value.dateStr,
                'user': this.props.user,
                "project": this.props.url + '/projects/' + value.draggedEl.getAttribute("data-id")
            }
        }).then((result) => {
            this.setState({
                calendarEvents: [...this.state.calendarEvents, result.data]
            });
            this.datesRender();
        });
    };

    // Called when an external draggable element with associated event data was dropped onto the calendar.
    // suppression de l'event après le drag and drop
    eventReceive = function (event) {
        event.event.remove()
    };

    // Triggered when a new set of dates has been rendered.
    // A chaque modif des event, utile pour le calcul du récapitulatif du mois
    datesRender = () => {
        if (this.calendarComponentRef.current) {
            const currentMoment = this.calendarComponentRef.current.calendar.getDate();
            this.updateStat(moment(currentMoment).format("YYYY-MM-DD"));
        } else {
            this.updateStat();
        }
    };

    // Events Projets

    // Ajouter un Projet
    handleProjectSubmit = (event) => {
        event.preventDefault();
        axios({
            url: this.props.url + '/projects',
            method: 'post',
            data: {
                "title": this.state.value,
                'user': this.props.user,
                "color": this.state.background
            }
        }).then((result) => {
            this.setState({
                events: [...this.state.events, result.data],
                value: '',
                errors: []
            });

        }).catch((error) => {

            if (error.response.data.violations) {
                this.setState({
                    errors: error.response.data.violations
                })
            } else {
                alert(error.message)
            }
        })
    };

    // supprimer un projet
    removeProject = (event) => {
        event.preventDefault();
        const key = event.target[0].value;
        const url = this.props.url;
        axios({
            url: this.props.url + '/projects/' + key,
            method: 'delete',
        }).then(() => {
            this.setState({
                events: this.state.events.filter(function (event) {
                    return event.id !== parseInt(key)
                })
            });
            this.setState({
                calendarEvents: this.state.calendarEvents.filter(function (event) {
                    return event.project !== url + '/projects/' + parseInt(key)
                })
            });
            this.datesRender();
        });
    };

    // changement de nom de projet dans le form Projet
    handleProjectNameChange(event) {
        this.setState({value: event.target.value});
    }

    updateProjectColor(e, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "color": e.hex,
            }
        }).then((result) => {
            this.updateEvent();
            this.setState(prevState => ({
                events: prevState.events.map(
                    el => el.id === parseInt(id) ? {...el, color: result.data.color} : el
                )
            }));
        });
    }

    updateProjectName(event, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "title": event.target.value,
            }
        }).then((result) => {
            this.updateEvent();
            const currentMoment = this.calendarComponentRef.current.calendar.getDate();
            this.updateStat(moment(currentMoment).format("YYYY-MM-DD"));
            this.setState(prevState => ({
                events: prevState.events.map(
                    el => el.id === parseInt(id) ? {...el, title: result.data.title} : el
                )
            }));
        });

    }

    // changement du code couleur dans le form Projet
    handlePickerChange = (color) => {
        this.setState({background: color.hex});
    };

    // masque les erreurs du form
    dismissibleFormError = () => {
        this.setState({
            errors: []
        })
    };

    // mise à jour des stats
    updateStat = (month = '') => {
        axios({
            url: this.props.url + '/projects/stat?date=' + month,
            method: 'get',
        }).then((result) => {
            this.setState({
                stat: result.data
            });
        });
    };

    updateProject() {
        axios({
            url: this.props.url + '/projects',
            method: 'get',
        }).then((resultdata) => {
            this.setState({
                events: resultdata.data['hydra:member']
            });
        });
    }


    updateEventHours(e, event) {

        axios({
            url: this.props.url + '/events/' + event.id,
            method: 'put',
            data: {
                "hours": parseInt(e.target.value),
            }
        }).then(() => {
            this.datesRender();
            this.updateEvent();
        })
    }
}

CalendarApp.propTypes = {
    url: PropTypes.string,
    user: PropTypes.string,
};
