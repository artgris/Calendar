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
import Sketch from "./Sketch";
import {DebounceInput} from 'react-debounce-input';

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
    sketchComponentRef = React.createRef();
    state = {
        weekends: this.props.weekends,
        workinghour: this.props.workinghour,
        displayArchived: false,
        calendarEvents: [],
        events: [],
        value: '',
        stat: {
            projects: {},
            total: '',
            totalCalcul: ''
        },
        errors: [],
        background: '#' + Math.floor(Math.random() * 16777215).toString(16),
        projectName: 'ff'
    };

    constructor(props, context) {
        super(props, context);
        this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
        this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
        this.updateProjectName = this.updateProjectName.bind(this);
        this.updateProjectCheckbox = this.updateProjectCheckbox.bind(this);
        this.updateWeekendsCheckbox = this.updateWeekendsCheckbox.bind(this);
        this.updateWorkingHour = this.updateWorkingHour.bind(this);
    }

    render() {
        const hasProject = this.state.events.length > 0;
        const hasStat = this.state.stat.projects;
        return (
            <div className='mt-2 row'>
                <div className="col-md-3">
                    {hasProject &&

                    <div className="row p-2">
                        <div className="col">
                            <strong> Projets</strong>
                        </div>
                        <div className="col text-right">
                            <div className="custom-control custom-checkbox">
                                <input type="checkbox"
                                       defaultChecked={this.state.displayArchived}
                                       onChange={(e) => this.displayArchive(e)}
                                       className="custom-control-input"
                                       id="archiveAllCheckbox"/>
                                <label className="custom-control-label"
                                       htmlFor="archiveAllCheckbox">
                                    Archivé
                                </label>
                            </div>
                        </div>
                    </div>
                    }

                    <div id="external-events" className="pb-2 col">
                        <div className="row">
                            {this.state.events.map(event => (
                                <div
                                    onClick={this.projectClick}
                                    className={this.state.displayArchived === false && event.archived ? 'd-none' : 'fc-event col-md-6 mb-2'}
                                    title={event.title}
                                    data-color={event.backgroundColor}
                                    data-id={event.id}
                                    data-archived={event.archived}
                                    key={event.id}
                                >
                                    <div className="col"
                                         style={{backgroundColor: event.backgroundColor, color: event.textColor}}>
                                        {event.title} {event.archived ? '(archivé)' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {hasProject &&
                    <hr/>
                    }

                    <div className="row p-2">
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
                                <div className="row">
                                    <Sketch
                                        onChange={this.handlePickerChange.bind(this)}
                                        color={this.state.background}
                                        ref={this.sketchComponentRef}
                                    />
                                    <div className="col">
                                        <div className="form-group input-group">
                                            <input className="form-control" placeholder="Nom du Projet"
                                                   value={this.state.value}
                                                   required
                                                   onChange={this.handleProjectNameChange}
                                                   type="text"/>
                                            <div className="input-group-append">
                                                <button type="submit" className="btn btn-outline-primary">
                                                    <i className="fas fa-plus"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input className="form-control"
                                       value={this.state.background}
                                       type="hidden"/>

                            </div>
                        </form>
                    </div>
                    <hr/>
                    <div className="row p-2">
                        <div className="col-12">
                            <p className="text-center">
                                <strong>Paramétrage du calendrier</strong>
                            </p>
                        </div>
                        <div className="row p-2">
                            <div className="col-12 mb-2">
                                <div className="custom-control custom-checkbox">
                                    <input type="checkbox"
                                           defaultChecked={this.state.weekends === '1'}
                                           onChange={(e) => this.updateWeekendsCheckbox(e)}
                                           className="custom-control-input"
                                           id="weekendsCheckbox"/>
                                    <label className="custom-control-label"
                                           htmlFor="weekendsCheckbox">
                                        Semaine complète
                                    </label>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="row form-group">
                                    <label htmlFor="update-working" className="col-6 col-form-label">
                                        Journée de travail
                                    </label>
                                    <div className="col-5 input-group ">
                                        <input id="update-working"
                                               className="form-control"
                                               value={this.state.workinghour}
                                               required
                                               onChange={this.updateWorkingHour}
                                               type="number"/>
                                        <div className="input-group-append">
                                            <span className="input-group-text">heures</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        weekends={this.state.weekends === '1'}
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
                    {hasStat &&
                    <ul>
                        {Object.keys(this.state.stat.projects).map(key => (
                            <li key={key}>{this.state.stat.projects[key].hours}
                                <ul>
                                    {this.state.stat.projects[key].list.map(info => (
                                        <li key={key + info}>{info}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    }
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
                    <div className="row mt-4">
                        <Sketch
                            onClose={(e) => this.updateProjectColor(e, project.id)}
                            color={project.color}
                        />
                        <div className="col">
                            <input className="form-control mb-1"
                                   type="text"
                                   onChange={(e) => this.updateProjectName(e, project.id)}
                                   defaultValue={event.currentTarget.title}/>
                        </div>
                    </div>
                    <div className="row mt-4  text-right">
                        <div className="col">
                            <div className="custom-control custom-checkbox">
                                <input type="checkbox"
                                       defaultChecked={project.archived === "true"}
                                       onChange={(e) => this.updateProjectCheckbox(e, project.id)}
                                       className="custom-control-input"
                                       id="archiveCheckbox"/>
                                <label className="custom-control-label"
                                       htmlFor="archiveCheckbox">
                                    Archivé
                                </label>
                            </div>
                        </div>
                    </div>
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
                    <div className="input-group col-5 mb-1">
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
                <div className="row mt-4 justify-content-center">
                    <div className="input-group col-8 mb-1">
                        <DebounceInput
                            element="textarea"
                            minLength={2}
                            debounceTimeout={300}
                            onChange={(e) => this.updateEventInfo(e, eventClick.event)}
                            className="form-control"
                            value={eventClick.event.extendedProps.info}
                        />
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

    updateProjectColor(color, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "color": color,
            }
        }).then(() => {
            this.updateProject();
            this.updateEvent();
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
            this.datesRender();
            this.setState(prevState => ({
                events: prevState.events.map(
                    el => el.id === parseInt(id) ? {...el, title: result.data.title} : el
                )
            }));
        });

    }

    updateProjectCheckbox(event, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "archived": event.target.checked,
            }
        }).then(() => {
            this.updateProject();
        });

    }

    // changement du code couleur dans le form Projet
    handlePickerChange = (value) => {
        this.setState({background: value});
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
                "hours": parseFloat(e.target.value),
            }
        }).then(() => {
            this.datesRender();
            this.updateEvent();
        })
    }

    updateEventInfo(e, event) {
        axios({
            url: this.props.url + '/events/' + event.id,
            method: 'put',
            data: {
                "info": e.target.value,
            }
        }).then(() => {
            this.datesRender();
            this.updateEvent();
        })
    }

    displayArchive(e) {
        this.setState({
            displayArchived: e.target.checked
        });
    }

    updateWeekendsCheckbox(e) {
        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: {
                "weekends": e.target.checked,
            }
        }).then((result) => {
            this.updateStat();
            this.calendarComponentRef.current.calendar.setOption('weekends', result.data.weekends)
        });
    }

    updateWorkingHour(event) {
        console.log(event.target.value)
        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: {
                "workingHour": parseInt(event.target.value),
            }
        }).then((result) => {
            console.log(result.data.workingHour)
            this.setState({
                workinghour: result.data.workingHour
            });
            this.updateStat();
        });
    }
}

CalendarApp.propTypes = {
    url: PropTypes.string,
    user: PropTypes.string,
    weekends: PropTypes.string,
    userid: PropTypes.string,
    workinghour: PropTypes.string,
};
