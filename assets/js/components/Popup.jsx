import React from 'react';
import * as axios from "axios";
import PropTypes from "prop-types";

class Popup extends React.Component {

    state = {
        showPopup: false,
        searching: false,
        error: false,
        colors: [],
        url: ''
    };


    constructor(props, context) {
        super(props, context);
        this.updateUrl = this.updateUrl.bind(this);
    }


    render() {

        let button;
        let error;

        if (this.state.searching) {
            button = <span><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"/><span
                className="sr-only">Loading...</span></span>
        } else {
            button = <i className="fas fa-search"/>
        }

        if (this.state.error) {
            error = <div className="alert alert-danger" role="alert">
                {"Ce site n'a pas été trouvé"}
            </div>
        } else {
            error = null;
        }

        return (
            <div className='popup'>
                <div className='popup_inner'>
                    <h6>Recherche de couleurs depuis un site web</h6>
                    <div className="form-group input-group">
                        <input className="form-control" type="url" value={this.state.url} onChange={this.updateUrl}
                               placeholder="http://..."/>
                        <div className="input-group-append">
                            <button type="button" className="btn btn-outline-primary" onClick={this.findColor}>
                                {button}
                            </button>
                            <button type="button" className="btn btn-outline-danger" onClick={this.props.closePopup}>
                                <i className="fas fa-times"/>
                            </button>
                        </div>
                    </div>
                    {error}
                    <div className={"color-flex"}>
                        {this.state.colors.map(event => (
                            <div key={event} className="color">
                                <div onClick={this.updateColor} style={{background: event}}/>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        );
    }

    findColor = () => {
        this.setState({
            searching: true,
            error: false
        });
        axios({
            url: this.props.url + '/search-color',
            method: 'post',
            params: {
                url: this.state.url
            }
        }).then((result) => {
            this.setState({
                colors: result.data,
                searching: false
            });
        }).catch(() => {
            this.setState({
                searching: false,
                error: true
            });
        });

    };

    updateColor = (event) => {
        this.props.action({hex: event.target.style.background});
    };


    updateUrl(event) {
        this.setState({url: event.target.value})
    }
}

Popup.propTypes = {
    url: PropTypes.string,
    color: PropTypes.string,
    action: PropTypes.func
};

export default Popup;
