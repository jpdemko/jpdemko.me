import NodeGeocoder from 'node-geocoder'
import React, { useState, useEffect } from 'react'
import { useLocalStorage } from '../util/customHooks'

const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY
})

export default function Weather() {
  const forecast = useLocalStorage('forecast', JSON.parse)
  const [loading, setLoading] = useState(false)

  function recentForecast() {
    if (!forecast) return false

    // gets current time in ms 'new Date().getTime()' -> convert to seconds '/1000'
    // get elapsed time by subtracting previous forecast time -> convert to minutes '/60
    let lastUpdate = Math.round((new Date().getTime() / 1000 - forecast.currently.time) / 60)
    return lastUpdate >= 45 ? false : true
  }

  function fetchCity(lat, long) {
    return geocoder
      .reverse({ lat: lat, lon: long })
      .then(json => json[0].city)
      .catch(err => Promise.reject(`Reverse geocode error: ${err.message}`))
  }

  function fetchForecast(lat, long) {
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

  function getData() {
    if (recentForecast()) return

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      position => {
        let { latitude: lat, longitude: long } = position.coords

        Promise.all([fetchCity(lat, long), fetchForecast(lat, long)])
          .then(data => {
            let finalForecast = { city: data[0], ...data[1] }
            forecast.set(finalForecast, JSON.stringify)
            setLoading(false)
          })
          .catch(err => {
            console.log(err)
            setLoading(false)
          })
      },
      err => {
        let msg = `Geolocation error: ${err.message}`
        console.log(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <section>
      <button onClick={getData}>GET FORECAST</button>
      <button onClick={() => forecast.reset()}>RESET</button>
    </section>
  )
}
