import React, { useContext } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime, Interval } from 'luxon'

import { ReactComponent as Logo } from '../../shared/assets/weather-icons/sunny.svg'
import { themes } from '../../shared/variables'
import { simplerFetch } from '../../shared/helpers'
import { useLocalStorage } from '../../shared/customHooks'
import { WindowSizeContext } from '../display/Window'
import FindLocation from './FindLocation'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const WeatherRoot = styled.div.attrs(({ forecast }) => {
	// Default background gradient which represents daytime (or if no forecast retrieved).
	// The other two gradients are dusk/dawn & nighttime.
	let bgGradient = css`
		background: #7ab0cf;
		background: linear-gradient(315deg, #7ab0cf 20%, #a8c7db 75%, #bfd0db 100%);
	`
	if (forecast) {
		let { currently: cur, results: sun } = forecast
		// Convert all sun data to luxon DateTimes for easy operations.
		Object.keys(sun).forEach((key) => (sun[key] = DateTime.fromISO(sun[key])))
		const { sunrise, sunset, nautical_twilight_begin, nautical_twilight_end } = sun

		// Create time intervals where we can tell where the forecast retrieval time falls under.
		const dawn = Interval.fromDateTimes(
			nautical_twilight_begin,
			sunrise.plus(sunrise.diff(nautical_twilight_begin)),
		)
		const dusk = Interval.fromDateTimes(
			sunset.minus(nautical_twilight_end.diff(sunset)),
			nautical_twilight_end,
		)
		const now = DateTime.fromSeconds(cur.time)

		if (dawn.contains(now) || dusk.contains(now)) {
			bgGradient = css`
				background: #311f62;
				background: linear-gradient(0deg, #311f62 10%, #8d5273 65%, #e8817f 100%);
			`
		} else if (dusk.isBefore(now)) {
			bgGradient = css`
				background: #2b2f77;
				background: linear-gradient(0deg, #2b2f77 0%, #141852 65%, #070b34 100%);
			`
		}
	}
	return { bgGradient }
})`
	font-size: 1.1em;
	height: 100%;
	display: flex;
	padding: 0.5em;
	${({ theme, bgGradient }) => css`
		${bgGradient}
		color: ${theme.mainColor};
	`}
	> div {
		margin: 0.5em;
	}
`

const SideNav = styled.div`
	flex: 0;
`

/* ---------------------------- WEATHER COMPONENT --------------------------- */

const Weather = () => {
	const isMobileSizedWindow = useContext(WindowSizeContext)
	const [locations, setLocations] = useLocalStorage('locations')

	const fetchLocationData = (lat, lng) => {
		const gAPI = 'https://maps.googleapis.com/maps/api/geocode/json'
		const params = `?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`
		return simplerFetch(`${gAPI}${params}`).then((geo) => ({
			locationName: geo.plus_code.compound_code.replace(/\S+\s/, ''),
			coords: {
				lat,
				lng,
			},
		}))
	}

	const fetchWeatherData = (lat, lng) => {
		const owmAPI = 'http://api.openweathermap.org/data/2.5/'
		const params = `?lat=${lat}&lon=${lng}&APPID=${process.env.REACT_APP_OPEN_WEATHER_API_KEY}`
		return Promise.all([
			simplerFetch(`${owmAPI}weather${params}`),
			simplerFetch(`${owmAPI}forecast${params}`),
		])
			.then(([current, forecast]) => ({
				current: { ...current, dt: DateTime.fromSeconds(current.dt) },
				forecast: sortForecast(forecast),
			}))
			.catch(console.log)
	}

	// Grouping the forecast data into specific days of the month instead of its original 3hr interval list.
	const sortForecast = (forecast) => {
		let list = {}
		for (let hour of forecast.list) {
			hour.dt = DateTime.fromSeconds(hour.dt)
			const day = `day${hour.dt.toLocal().day}`
			if (day in list) list[day].push(hour)
			else list[day] = [hour]
		}
		return {
			...forecast,
			list,
		}
	}

	const canUpdateLocation = (location) => {
		const prevFetchDate = location.current.dt.toLocal()
		const preventFetchInterval = Interval.fromDateTimes(prevFetchDate, prevFetchDate.plus({ minutes: 30 }))
		return !preventFetchInterval.contains(DateTime.local())
	}

	const addLocation = ({ lat, lng }) => {
		const prevLocationIndex = locations
			? locations.findIndex((loca) => {
					const { lat: locaLat, lng: locaLng } = loca.coords
					return lat === locaLat && lng === locaLng
			  })
			: -1
		if (prevLocationIndex > -1 && !canUpdateLocation(locations[prevLocationIndex])) return
		Promise.all([fetchLocationData(lat, lng), fetchWeatherData(lat, lng)])
			.then(([locationData, weatherData]) => {
				const finalData = {
					...locationData,
					...weatherData,
				}
				console.log(finalData)
			})
			.catch(console.log)
	}

	return (
		<ThemeProvider theme={themes.light}>
			<WeatherRoot>
				<SideNav>
					<FindLocation onLocationFound={addLocation} />
				</SideNav>
			</WeatherRoot>
		</ThemeProvider>
	)
}

Weather.shared = {
	title: 'Weather',
	logo: Logo,
}

export default Weather
