import React from 'react';
import * as axios from "axios";
import PropTypes from "prop-types";

class Popup extends React.Component {

    state = {
        showPopup: false,
        colors: [],
        url: 'https://getbootstrap.com/docs/4.4/components/modal/'
    };


    constructor(props, context) {
        super(props, context);
        this.updateUrl = this.updateUrl.bind(this);
    }


    render() {
        return (
            <div className='popup'>
                <div className='popup_inner'>
                    <h6>Recherche de couleurs depuis un site web</h6>
                    <div className="form-group input-group">
                        <input className="form-control" type="url" value={this.state.url} onChange={this.updateUrl}
                               placeholder="http://..."/>
                        <div className="input-group-append">
                            <button type="button" className="btn btn-outline-primary" onClick={this.findColor}>
                                <i className="fas fa-search"/>
                            </button>
                            <button type="button" className="btn btn-outline-danger" onClick={this.props.closePopup}>
                                <i className="fas fa-times"/>
                            </button>
                        </div>
                    </div>
                    <div className={"color-flex"}>
                        {this.state.colors.map(event => (
                            <div key={event} className="color">
                                <div onClick={this.updateColor} style={{background: event}}></div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        );
    }

    findColor = () => {
        axios({
            url: this.props.url + '/search-color',
            method: 'post',
            params: {
                url: this.state.url
            }
        }).then((result) => {
            this.setState({
                colors: result.data
            });
        }).catch(() => {
            // this.displayErrorMessage()
        });

    };

    updateColor = (event) => {
        this.props.action({hex: event.target.style.background});
    }
    
    
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
