import React from 'react'
import { render } from 'react-dom'
import CalendarApp from './CalendarApp'

var root = document.getElementById('root');
render(<CalendarApp {...(root.dataset)} />, root)