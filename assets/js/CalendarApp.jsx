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
import Notifications, {notify} from 'react-notify-toast';
import striptags from 'striptags';

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
        holiday: this.props.holiday,
        workinghour: this.props.workinghour,
        displayArchived: false,
        calendarEvents: [],
        events: [],
        searchResult: [],
        value: '',
        query: '',
        stat: {
            projects: {},
            total: '',
            totalCalcul: ''
        },
        errors: [],
        background: this.props.background,
        latitude: this.props.latitude,
        longitude: this.props.longitude,
        projectName: ''
    };

    constructor(props, context) {
        super(props, context);
        this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
        this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
        this.updateProjectName = this.updateProjectName.bind(this);
        this.updateProjectCheckbox = this.updateProjectCheckbox.bind(this);
        this.updateWeekendsCheckbox = this.updateWeekendsCheckbox.bind(this);
        this.updateWorkingHour = this.updateWorkingHour.bind(this);
        this.updateHoliday = this.updateHoliday.bind(this);
        this.getLocation = this.getLocation.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
        this.updateWeather = this.updateWeather.bind(this);
        this.removeLocation = this.removeLocation.bind(this);
        this.search = this.search.bind(this);
        this.resetQuery = this.resetQuery.bind(this);

    }

    render() {

        const hasProject = this.state.events.length > 0;
        const holidayOptions = Object.keys(window.YASUMI_PROVIDERS).map(key =>
            <option key={key} value={key}>{window.YASUMI_PROVIDERS[key]}</option>
        );

        if (this.state.query) {
            var events = this.state.searchResult;
        } else {
            var events = this.state.events
        }

        return (
            <div className='mt-2 row'>
                <div className="col-md-3">
                    {hasProject &&

                    <div className="row p-2">
                        <div className="col pb-2">
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
                        <div className="w-100"/>
                        <div className="col-12 col-md-6 form-group">
                            <input placeholder="Recherche..." value={this.state.query} onChange={this.search.bind(this)} className="form-control form-control-sm" type="text"/>
                            <span id="searchclear" onClick={this.resetQuery} className={this.state.query ? "fas fa-times-circle" :"d-none"}/>
                        </div>
                    </div>
                    }
                    <div id="external-events" className="pb-2 col">
                        <div className="row">
                            {events.map(event => (
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
                            <p>
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
                            <div className="form-group mb-0">
                                <div className="row">
                                    <Sketch
                                        onChange={this.handlePickerChange.bind(this)}
                                        color={this.state.background}
                                        ref={this.sketchComponentRef}
                                        url={this.props.url}
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
                            <p>
                                <strong>Paramétrage du calendrier</strong>
                            </p>
                        </div>
                        <div className="row p-2">
                            <div className="col-12 mb-3">
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
                                    <label htmlFor="update-working" className="col-5 col-form-label">
                                        Journée de travail
                                    </label>
                                    <div className="col-7 input-group ">
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
                            <div className="col-12">
                                <div className="row form-group">
                                    <label htmlFor="select-holiday" className="col-5 col-form-label">
                                        Jours fériés
                                    </label>
                                    <div className="col-7">
                                        <select id="select-holiday"
                                                value={this.state.holiday}
                                                onChange={this.updateHoliday}
                                                className="form-control"
                                        >
                                            <option/>
                                            {holidayOptions}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="row form-group">
                                    <label htmlFor="select-weather" className="col-5 col-form-label">
                                        Météo
                                    </label>
                                    <div className="col-7 ">
                                        <div className="input-group mt-2">
                                            <button className={"btn btn-sm btn-outline-primary"} onClick={this.getLocation}>
                                                Utilisez ma localisation <i className={"fa fa-map-marker-alt"}/>
                                            </button>

                                            <button className={"ml-2 btn btn-sm btn-outline-danger"} onClick={this.removeLocation} >
                                                <i className={"fa fa-trash-alt"}/>
                                            </button>

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
                        eventRender={this.eventRender}
                    />
                </div>
                <div className="col-md-3">
                    <div className="col-12">
                        <p className="text-center">
                            <strong>Récapitulatif du mois <button onClick={this.copyToClipboard} id="copy-to-clipboard" data-toggle="tooltip" data-placement="left" title="Copier dans le presse papier" className='btn'> <i className="far fa-copy"/> </button> </strong>
                        </p>
                    </div>
                    <div id="stat-text">
                        {Object.keys(this.state.stat.projects).map(key => (
                            <span key={key}>
                                - {this.state.stat.projects[key].hours}  <br/>
                                {this.state.stat.projects[key].list.map(info => (
                                    <span key={key + info}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⤷ {info} <br/></span>
                                ))}
                            </span>
                        ))}
                    </div>
                    <br/>
                    <p><strong>Total : </strong> {this.state.stat.total}</p>
                    {this.state.stat.totalCalcul !== null &&
                    <p><strong>Total calculé : </strong> {this.state.stat.totalCalcul}</p>
                    }
                </div>
                <Notifications options={{zIndex: 2000}}/>
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
        }).catch(() => {
            this.displayErrorMessage()
        })
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
                            onChange={(e) => this.updateProjectColor(e, project.id)}
                            color={project.color}
                            url={this.props.url}
                        />
                        <div className="col">
                            <DebounceInput className="form-control mb-1"
                                           debounceTimeout={300}
                                           onChange={(e) => this.updateProjectName(e, project.id)}
                                           value={event.currentTarget.title}/>
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
            cancelButtonText: "Fermer",
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
                    this.showNotif("Projet supprimé");
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
        }).catch(() => {
            this.displayErrorMessage()
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
                            min="0"
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
                            debounceTimeout={300}
                            onChange={(e) => this.updateEventInfo(e, eventClick.event)}
                            className="form-control"
                            placeholder={"Description"}
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
            cancelButtonText: "Fermer",
        }).then(result => {
            if (result.value) {
                axios({
                    url: this.props.url + '/events/' + eventClick.event.id,
                    method: 'delete',
                }).then(() => {
                    this.showNotif("Événement supprimé");
                    eventClick.event.remove();
                    this.setState({
                        calendarEvents: this.state.calendarEvents.filter(function (event) {
                            return event.id !== parseInt(id)
                        })
                    });
                    this.datesRender();
                });
            }
        }).catch(() => {
            this.displayErrorMessage()
        })
    };

    // Triggered when dragging stops and the event has moved to a different day/time.
    // quand on deplace ou resize un event
    eventDrop = (eventDropInfo) => {
        $(".popover.fade.top").remove();
        axios({
            url: this.props.url + '/events/' + eventDropInfo.event.id,
            method: 'put',
            data: {
                "start": moment(eventDropInfo.event.start).format("YYYY-MM-DD"),
                "end": eventDropInfo.event.end ? moment(eventDropInfo.event.end).format("YYYY-MM-DD") : null,
            }
        }).then((result) => {
            this.showNotif("Événement modifié");
            let key = parseInt(eventDropInfo.event.id);
            this.setState(prevState => ({
                calendarEvents: prevState.calendarEvents.map(
                    el => el.id === key ? {...el, start: result.data.start, end: result.data.end} : el
                )
            }));
            this.datesRender();

        }).catch(() => {
            this.displayErrorMessage()
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
            this.showNotif("Événement ajouté");
            this.setState({
                calendarEvents: [...this.state.calendarEvents, result.data]
            });
            this.datesRender();

        }).catch(() => {
            this.displayErrorMessage()
        })
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

        if (this.state.latitude && this.state.longitude) {
            this.updateWeatherApi({'latitude':this.state.latitude, 'longitude': this.state.longitude});
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
            this.showNotif("Projet ajouté");
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
                this.displayErrorMessage()
            }
        })
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
            this.showNotif("Projet modifié");
            this.updateProject();
            this.updateEvent();
        }).catch(() => {
            this.displayErrorMessage()
        })
    }

    updateProjectName(event, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "title": event.target.value,
            }
        }).then((result) => {
            this.showNotif("Projet renommé");
            this.updateEvent();
            this.datesRender();
            this.setState(prevState => ({
                events: prevState.events.map(
                    el => el.id === parseInt(id) ? {...el, title: result.data.title} : el
                )
            }));
        }).catch(() => {
            this.displayErrorMessage()
        })

    }

    updateProjectCheckbox(event, id) {
        axios({
            url: this.props.url + '/projects/' + id,
            method: 'put',
            data: {
                "archived": event.target.checked,
            }
        }).then(() => {
            this.showNotif("Projet modifié");
            this.updateProject();
        }).catch(() => {
            this.displayErrorMessage()
        })

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
        }).catch(() => {
            this.displayErrorMessage()
        })
    };

    updateProject() {
        axios({
            url: this.props.url + '/projects',
            method: 'get',
        }).then((resultdata) => {
            this.setState({
                events: resultdata.data['hydra:member']
            });
        }).catch(() => {
            this.displayErrorMessage()
        })
    }

    updateEventHours(e, event) {
        axios({
            url: this.props.url + '/events/' + event.id,
            method: 'put',
            data: {
                "hours": parseFloat(e.target.value),
            }
        }).then(() => {
            this.showNotif("Événement modifié");
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
            this.showNotif("Événement modifié");
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
            this.showNotif("Calendrier modifié");
            this.updateStat();
            this.calendarComponentRef.current.calendar.setOption('weekends', result.data.weekends)
        });
    }

    updateWorkingHour(event) {
        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: {
                "workingHour": parseInt(event.target.value),
            }
        }).then((result) => {
            this.showNotif("Calendrier modifié");
            this.setState({
                workinghour: result.data.workingHour
            });
            this.updateStat();
        });
    }

    updateHoliday(event) {
        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: {
                "holiday": event.target.value,
            }
        }).then((result) => {
            this.showNotif("Calendrier modifié");
            this.setState({
                holiday: result.data.holiday
            });
            this.updateEvent();
            this.updateStat();
        });
    }

    updateWeather(event) {
        var value = event.target.value;
        var data = event.target.id === 'update-latitude' ? {'latitude':value} : {'longitude':value};
        this.updateWeatherApi(data, true);
    }

    updateWeatherApi (data, alert=false) {

        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: data
        }).then((result) => {
            this.setState({
                latitude : result.data.latitude,
                longitude : result.data.longitude,
            });
        });

        axios({
            url: this.props.url + '/weather/',
            method: 'get',
        }).then((result) => {
            $('.weather').remove();
            if (alert) {
                this.showNotif("Météo modifiée");
            }
            for (const [key, value] of Object.entries(result.data)) {
                var micon = "<span class='weather'><img  height=18 src='" + value.icon + "' alt=''><span class='temp'>" + value.temp + '°C' + '</span></span>';
                $(".fc-day-top[data-date=" + key + "] ").append(micon).find('.weather').popover({
                    container: 'body',
                    trigger: 'hover click',
                    delay: {show: 100, hide: 50},
                    html: true,
                    placement: 'bottom',
                    content: value.detail
                });

            }
        });


    }

    displayErrorMessage() {
        notify.show("Une erreur est survenue", "error", 1500);
    }

    showNotif(message = "Mise à jour enregistrée") {
        notify.show(message, "success", 1500);
    }

    // ico
    eventRender = ({event, el}) => {
        let icon = '';
        if (event.extendedProps.info) {
            $(".popover").remove();
            icon = '<i style="color:'+event.textColor+'" class="p-1 float-right far fa-sticky-note"/>';
            var content = striptags(event.extendedProps.info, ['\n']).replace(new RegExp('\r?\n', 'g'), "<br />");
            $(el).popover({
                container: 'body',
                trigger: 'hover',
                delay: {show: 100, hide: 50},
                html: true,
                placement: 'bottom',
                content: content
            });
        }
        $(el).find('.fc-title').append(icon);
    };


    stripHtml(html) {
        var tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    copyToClipboard() {
        var element = $("#stat-text");
        var $temp = $("<textarea>");
        $("body").append($temp);
        $temp.val(this.stripHtml($(element).html().replace( /<br\s*[\/]?>/gi, "\r\n"))).select();
        document.execCommand("copy");
        $temp.remove();
        this.showNotif("Récapitulatif copié dans le presse-papier")
    }

    getLocation(event) {
        if (navigator.geolocation) {
            let latitude = 0;
            let longitude = 0;
            let success = position => {
                latitude = position.coords.latitude.toString();
                longitude = position.coords.longitude.toString();
                this.setState(
                    {
                        latitude: latitude,
                        longitude: longitude
                    }
                );
                this.updateWeatherApi({'latitude':latitude, 'longitude': longitude}, true);
            };

            let error = () => {
               alert("Vous avez bloqué le suivi de votre position géographique sur cette page. Veuillez l'activer pour pouvoir utiliser la météo.");
            }

            navigator.geolocation.getCurrentPosition(success, error);
        } else {
            alert("Geolocation n'est pas supporté par votre navigateur.");
        }
    }

    removeLocation(event) {
        axios({
            url: this.props.url + '/users/' + this.props.userid,
            method: 'put',
            data: {'latitude':null, 'longitude': null}
        }).then((result) => {
            this.setState({
                latitude : '',
                longitude : '',
            });
        });
        $('.weather').remove();
        this.showNotif("Météo supprimée");
    }

    search(event) {
        const query = event.target.value;

        var result = this.state.events.filter(event => {
            return event.title.toLowerCase().includes(query.toLowerCase())
        })

        this.setState({
            query : query,
            searchResult : result
        });

    }

    resetQuery() {
        this.setState({
            query : '',
        });
    }
}

CalendarApp.propTypes = {
    url: PropTypes.string,
    user: PropTypes.string,
    weekends: PropTypes.string,
    background: PropTypes.string,
    holiday: PropTypes.string,
    userid: PropTypes.string,
    workinghour: PropTypes.string,
};
