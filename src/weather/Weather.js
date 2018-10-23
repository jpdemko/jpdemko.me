import NodeGeocoder from 'node-geocoder'
import React from 'react'

const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY
})

class Weather extends React.Component {
  constructor(props) {
    super(props)
    let forecastString = localStorage.getItem('forecast')
    console.log(forecastString ? JSON.parse(forecastString) : forecastString)
    this.state = {
      forecast: forecastString ? JSON.parse(forecastString) : undefined,
      loading: false
    }
  }

  reset = () => {
    localStorage.clear()
    this.setState({ forecast: undefined })
  }

  forecastIsRecent = () => {
    let { forecast } = this.state
    if (!forecast) return false

    // gets current time in ms (new Date().getTime()) -> convert to seconds (/1000)
    // get elapsed time by subtracting previous forecast time -> convert to minutes (/60)
    let lastUpdate = Math.round((new Date().getTime() / 1000 - forecast.currently.time) / 60)
    return lastUpdate >= 30 ? false : true
  }

  fetchCity = (lat, long) => {
    return geocoder
      .reverse({ lat: lat, lon: long })
      .then(json => json[0].city)
      .catch(err => Promise.reject(`Reverse geocode error: ${err.message}`))
  }

  fetchForecast = (lat, long) => {
    let corsProxy = 'https://cors-anywhere.herokuapp.com'
    let skyAPI = 'https://api.darksky.net/forecast'
    let params = 'exclude=minutely,flags'
    let skyKey = process.env.REACT_APP_DARKSKY_API_KEY

    return fetch(`${corsProxy}/${skyAPI}/${skyKey}/${lat},${long}?${params}`)
      .then(res => {
        if (!res.ok) throw Error('Recieved bad response.')
        return res.json()
      })
      .catch(err => Promise.reject(`Forecast retrieval error: ${err.message}`))
  }

  getData = () => {
    // if (this.forecastIsRecent()) return

    this.setState({ loading: true })
    navigator.geolocation.getCurrentPosition(
      position => {
        let { latitude: lat, longitude: long } = position.coords

        Promise.all([this.fetchCity(lat, long), this.fetchForecast(lat, long)])
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
            this.setState({ loading: false })
          })
      },
      err => {
        let msg = `Geolocation error: ${err.message}`
        console.log(msg)
        this.setState({ loading: false })
      },
      { enableHighAccuracy: true }
    )
  }

  render() {
    let { forecast } = this.state
    return <section>{/* todo */}</section>
  }
}

export default Weather
