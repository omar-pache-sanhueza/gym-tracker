import { render, h } from 'preact'
import App from './app.js'
import './styles.css'

render(h(App, null), document.getElementById('app'))
