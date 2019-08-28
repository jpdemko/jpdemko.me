import React, { useContext, useState } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime, Interval } from 'luxon'

import { ReactComponent as SunnySVG } from '../../shared/assets/weather-icons/sunny.svg'
import { ReactComponent as CloseCircleSVG } from '../../shared/assets/material-icons/close-circle.svg'
import { themes } from '../../shared/variables'
import { simplerFetch } from '../../shared/helpers'
import { useLocalStorage } from '../../shared/customHooks'
import { WindowSizeContext } from '../display/Window'
import Button from '../ui/Button'
import FindLocation from './FindLocation'
import Drawer from '../ui/Drawer'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const WeatherRoot = styled.div`
	font-size: 1.1em;
	height: 100%;
	display: flex;
	${({ theme, weatherBG }) => css`
		background-image: ${weatherBG};
		color: ${theme.mainColor};
	`}
`

const DesktopNav = styled.div`
	flex: 1;
`

const NavContent = styled.div`
	height: 100%;
	${({ theme, isMobileSizedWindow }) => css`
		${`border-${isMobileSizedWindow ? 'left' : 'right'}: 1px solid ${theme.mainColor};`}
		background-color: ${theme.bgContrastColor};
		> * {
			border-bottom: 1px solid ${theme.mainColor};
		}
	`}
`

const NavLocation = styled.div`
	display: flex;
	${({ weatherBG }) => css`
		background: ${weatherBG};
	`}
`

const NavLocationData = styled(Button)`
	flex: 1;
	font-size: 0.8em;
`

const DataDisplay = styled.div`
	flex: 2;
	${({ weatherBG }) => css`
		background-image: ${weatherBG};
	`}
`

/* ---------------------------- WEATHER COMPONENT --------------------------- */

const Weather = () => {
	const isMobileSizedWindow = useContext(WindowSizeContext)
	const [locations, setLocations] = useLocalStorage('locations', [])
	const [loadedLocationID, setLoadedLocationID] = useLocalStorage('loadedLocationID')
	const [mobileDrawerOpened, setMobileDrawerOpened] = useState(false)

	const fetchLocationData = (lat, lng) => {
		const gAPI = 'https://maps.googleapis.com/maps/api/geocode/json'
		const params = `?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`
		return simplerFetch(gAPI + params).then((geo) => ({
			locationName: geo.plus_code.compound_code.replace(/\S+\s/, ''),
			coords: {
				lat,
				lng,
			},
			id: lat + lng,
		}))
	}

	const fetchSunData = (lat, lng) => {
		const sunAPI = 'https://api.sunrise-sunset.org/json'
		const params = `?lat=${lat}&lng=${lng}&date=today&formatted=0`
		return simplerFetch(sunAPI + params).then((res) => res.results)
	}

	const fetchWeatherData = (lat, lng) => {
		const owmAPI = 'http://api.openweathermap.org/data/2.5/'
		const params = `?lat=${lat}&lon=${lng}&APPID=${process.env.REACT_APP_OPEN_WEATHER_API_KEY}`
		return Promise.all([
			simplerFetch(`${owmAPI}weather${params}`),
			simplerFetch(`${owmAPI}forecast${params}`),
			fetchSunData(lat, lng),
		])
			.then(([current, forecast, sun]) => {
				let data = {
					current: { ...current, sun, dt: DateTime.fromSeconds(current.dt).toString() },
					forecast: sortForecast(forecast),
				}
				data.current.weatherBG = getCurrentWeatherBG(data.current)
				return data
			})
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
		const prevFetchDate = DateTime.fromISO(location.current.dt)
		const preventFetchInterval = Interval.fromDateTimes(prevFetchDate, prevFetchDate.plus({ minutes: 30 }))
		return !preventFetchInterval.contains(DateTime.local())
	}

	const fetchData = (lat, lng) => {
		return Promise.all([fetchLocationData(lat, lng), fetchWeatherData(lat, lng)])
			.then(([locationData, weatherData]) => ({
				...locationData,
				...weatherData,
			}))
			.catch(console.log)
	}

	const loadLocation = async (lat, lng) => {
		let newLocations = [...locations]
		const locIdx = newLocations.findIndex((loc) => loc.id === lat + lng)
		if (locIdx > -1) {
			if (canUpdateLocation(newLocations[locIdx])) newLocations[locIdx] = await fetchData(lat, lng)
			setLoadedLocationID(newLocations[locIdx].id)
		} else {
			const newLocation = await fetchData(lat, lng)
			newLocations.push(newLocation)
			setLoadedLocationID(newLocation.id)
		}
		setLocations(newLocations)
	}

	const removeLocation = (id) => {
		const newLocations = locations.filter((loc) => loc.id !== id)
		setLocations(newLocations)
		setLoadedLocationID(newLocations.find((loc) => loc.id !== id))
	}

	const getCurrentWeatherBG = (curWeatherData) => {
		let weatherBG = 'linear-gradient(315deg, #7ab0cf 20%, #a8c7db 75%, #bfd0db 100%)'
		if (!curWeatherData) return weatherBG

		const { dt: now } = curWeatherData
		const { sunrise, sunset, nautical_twilight_begin, nautical_twilight_end } = curWeatherData.sun
		// Create time intervals where we can tell where the weather data retrieval time falls under.
		const dawn = Interval.fromDateTimes(
			nautical_twilight_begin,
			sunrise.plus(sunrise.diff(nautical_twilight_begin)),
		)
		const dusk = Interval.fromDateTimes(
			sunset.minus(nautical_twilight_end.diff(sunset)),
			nautical_twilight_end,
		)

		if (dawn.contains(now) || dusk.contains(now)) {
			weatherBG = 'linear-gradient(0deg, #311f62 10%, #8d5273 65%, #e8817f 100%)'
		} else if (dusk.isBefore(now)) {
			weatherBG = 'linear-gradient(0deg, #2b2f77 0%, #141852 65%, #070b34 100%)'
		}
		return weatherBG
	}

	const navContent = (
		<NavContent isMobileSizedWindow={isMobileSizedWindow}>
			<FindLocation onLocationFound={loadLocation} />
			{locations.map((loc) => (
				<NavLocation key={loc.id} weatherBG={loc.current.weatherBG}>
					<NavLocationData tag='div' onClick={() => loadLocation(loc.coords.lat, loc.coords.lng)}>
						{loc.locationName}
					</NavLocationData>
					<Button svg={CloseCircleSVG} onClick={() => removeLocation(loc.id)} />
				</NavLocation>
			))}
		</NavContent>
	)

	const loadedLocation = locations.find((loc) => loc.id === loadedLocationID)

	return (
		<ThemeProvider theme={themes.light}>
			<WeatherRoot>
				{isMobileSizedWindow ? (
					<Drawer side='right' isShown={mobileDrawerOpened} onClose={() => setMobileDrawerOpened(false)}>
						{navContent}
					</Drawer>
				) : (
					<DesktopNav>{navContent}</DesktopNav>
				)}
				<DataDisplay weatherBG={loadedLocation ? loadedLocation.current.weatherBG : getCurrentWeatherBG()}>
					{loadedLocation && <div>currently selected: {loadedLocation.locationName}</div>}
					<Button onClick={() => setMobileDrawerOpened(true)}>open drawer</Button>
					<Button onClick={() => console.log(locations, loadedLocation)}>log state</Button>
				</DataDisplay>
			</WeatherRoot>
		</ThemeProvider>
	)
}

Weather.shared = {
	title: 'Weather',
	logo: SunnySVG,
}

export default Weather
