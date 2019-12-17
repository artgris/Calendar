'use strict'

import React from 'react'
import reactCSS from 'reactcss'
import {SketchPicker} from 'react-color'
import PropTypes from "prop-types";


export default class Sketch extends React.Component {

    state = {
        displayColorPicker: false,
        color: this.props.color,
    };
    colors = [
        '#3e2723', '#263238', '#B80000', '#DB3E00', '#FCCB00', '#008B02', '#006B76', '#1273DE', '#004DCF', '#5300EB', '#666666',
        '#d7ccc8', '#cfd8dc', '#EB9694', '#FAD0C3', '#FEF3BD', '#C1E1C5', '#BEDADC', '#C4DEF6', '#BED3F3', '#D4C4FB', '#B3B3B3',
        '#E2EAF0'
    ];

    handleClick = () => {
        this.setState({displayColorPicker: !this.state.displayColorPicker})
    };

    handleClose = () => {
        this.setState({displayColorPicker: false});

        if (this.props.onClose) {
            this.props.onClose(this.state.color);
        }
    };

    handleChange = (color) => {
        this.setState({color: color.hex});
        if (this.props.onChange) {
            this.props.onChange(color.hex);
        }
    };

    render() {

        const styles = reactCSS({
            'default': {
                color: {
                    width: '36px',
                    height: '25px',
                    borderRadius: '2px',
                    background: `${this.state.color}`,
                },
                swatch: {
                    padding: '5px',
                    background: '#fff',
                    borderRadius: '1px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                    display: 'inline-block',
                    cursor: 'pointer',
                },
                popover: {
                    position: 'absolute',
                    zIndex: '2',
                },
                cover: {
                    position: 'fixed',
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                },
            },
        });

        return (
            <div className='col-2'>
                <div style={styles.swatch} onClick={this.handleClick}>
                    <div style={styles.color}/>
                </div>
                {this.state.displayColorPicker ? <div style={styles.popover}>
                    <div style={styles.cover} onClick={this.handleClose}/>
                    <SketchPicker color={this.state.color} presetColors={this.colors} onChange={this.handleChange.bind(this)}/>
                </div> : null}

            </div>
        )
    }
}
Sketch.propTypes = {
    color: PropTypes.string,
    onClose: PropTypes.func,
    onChange: PropTypes.func,
};
