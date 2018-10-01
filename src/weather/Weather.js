import './weather.css'

import Hourly from './components/Hourly'
import NodeGeocoder from 'node-geocoder'
import React from 'react'
import Today from './components/Today'
import { message } from 'antd'

const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY
})

class Weather extends React.Component {
  constructor(props) {
    super(props)
    let forecastString = localStorage.getItem('forecast')
    console.log(JSON.parse(forecastString))
    this.state = {
      forecast: forecastString ? JSON.parse(forecastString) : undefined,
      loading: false
    }
  }

  forecastIsRecent = () => {
    let { forecast } = this.state
    if (!forecast) return false

    // gets current time in ms (new Date().getTime()) -> convert to seconds (/1000)
    // get elapsed time by subtracting old time -> convert to minutes (/60)
    let lastUpdate = Math.round((new Date().getTime() / 1000 - forecast.currently.time) / 60)
    return lastUpdate >= 30 ? false : true
  }

  getCity = (lat, long) => {
    return geocoder
      .reverse({ lat: lat, lon: long })
      .then(json => json[0].city)
      .catch(err => Promise.reject(`Reverse geocode error: ${err.message}`))
  }

  getSkyForecast = (lat, long) => {
    let corsProxy = 'https://cors-anywhere.herokuapp.com'
    let skyAPI = 'https://api.darksky.net/forecast'
    let params = 'exclude=minutely,flags'
    let skyKey = process.env.REACT_APP_DARKSKY_API_KEY

    return fetch(`${corsProxy}/${skyAPI}/${skyKey}/${lat},${long}?${params}`)
      .then(res => (res.ok ? res.json() : Promise.reject('Forecast retrieval error')))
      .catch(err => Promise.reject(`Forecast retrieval error: ${err.message}`))
  }

  getForecast = () => {
    if (this.forecastIsRecent()) return

    this.setState({ loading: true })
    navigator.geolocation.getCurrentPosition(
      position => {
        let { latitude: lat, longitude: long } = position.coords

        Promise.all([this.getCity(lat, long), this.getSkyForecast(lat, long)])
          .then(data => {
            let finalForecast = { city: data[0], ...data[1] }
            localStorage.setItem('forecast', JSON.stringify(finalForecast))
            this.setState({
              forecast: finalForecast,
              loading: false
            })
          })
          .catch(err => {
            console.log(err)
            message.error(err)
            this.setState({ loading: false })
          })
      },
      err => {
        let msg = `Geolocation error: ${err.message}`
        console.log(msg)
        message.error(msg)
        this.setState({ loading: false })
      },
      { enableHighAccuracy: true }
    )
  }

  render() {
    let { forecast } = this.state
    return (
      <section>
        <Today city={forecast.city} now={forecast.currently} />
        <Hourly hours={forecast.hourly} />
      </section>
    )
  }
}

export default Weather
