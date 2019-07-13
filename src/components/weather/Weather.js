import React, { useState } from 'react'

import { simplerFetch } from '../../shared/helpers'
import { useLocalStorage } from '../../shared/customHooks'
import { ReactComponent as Logo } from '../../shared/icons/weather-icons/wi-day-sunny.svg'

function Weather() {
  const [forecast, setForecast] = useLocalStorage('forecast')
  const [loading, setLoading] = useState(false)

  function recentForecast() {
    if (!forecast) return false

    // Gets current time in ms 'new Date().getTime()' -> convert to seconds '/1000'.
    // Get elapsed time by subtracting previous forecast time -> convert to minutes '/60'.
    let lastUpdate = Math.round((new Date().getTime() / 1000 - forecast.currently.time) / 60)
    return lastUpdate >= 45 ? false : true
  }

  function fetchLocation(latLong) {
    let gAPI = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='

    return simplerFetch(
      `${gAPI}${latLong}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
      'reverse geocode',
    ).then((geo) => geo.plus_code.compound_code.replace(/\S+\s/, ''))
  }

  function fetchForecast(latLong) {
    let corsProxy = 'https://cors-anywhere.herokuapp.com'
    let skyAPI = 'https://api.darksky.net/forecast'
    let params = 'exclude=minutely,flags'
    let skyKey = process.env.REACT_APP_DARKSKY_API_KEY

    return simplerFetch(`${corsProxy}/${skyAPI}/${skyKey}/${latLong}?${params}`, 'forecast retrieval')
  }

  function getData() {
    if (recentForecast()) return

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        let latLong = `${coords.latitude},${coords.longitude}`
        Promise.all([fetchLocation(latLong), fetchForecast(latLong)])
          .then((data) => {
            let finalForecast = { location: data[0], ...data[1] }
            setForecast(finalForecast)
            setLoading(false)
          })
          .catch((err) => {
            console.log(err)
            setLoading(false)
          })
      },
      (err) => {
        let msg = `Geolocation error: ${err.message}`
        console.log(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true },
    )
  }

  return (
    <section>
      <button onClick={getData}>GET FORECAST</button>
      <button onClick={() => setForecast(undefined)}>RESET</button>
      <button onClick={() => console.log(forecast)}>LOG FORECAST</button>
    </section>
  )
}

Weather.shared = {
  title: 'Weather',
  logo: Logo,
}

export default Weather
