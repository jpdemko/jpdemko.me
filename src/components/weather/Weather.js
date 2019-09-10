import React, { useContext, useState } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime, Interval } from 'luxon'

import { ReactComponent as SunnySVG } from '../../shared/assets/weather-icons/wi-day-sunny.svg'
import { ReactComponent as CloseCircleSVG } from '../../shared/assets/material-icons/close-circle.svg'
import { themes, simplerFetch } from '../../shared/shared'
import { useLocalStorage } from '../../shared/customHooks'
import { WindowSizeContext } from '../display/Window'
import WeatherIcon from './WeatherIcon'
import Button from '../ui/Button'
import LocationSearch from './LocationSearch'
import Drawer from '../ui/Drawer'
import Radar from './Radar'

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
		background-image: ${weatherBG};
	`}
`

const NavLocationData = styled(Button)`
	flex: 1;
	font-size: 0.8em;
`

const DataDisplay = styled.div`
	flex: 2;
	display: flex;
	flex-direction: column;
	> * {
		flex: 1;
	}
	${({ weatherBG }) => css`
		background-image: ${weatherBG};
	`}
`

/* ---------------------------- WEATHER COMPONENT --------------------------- */

const Weather = () => {
	const isMobileSizedWindow = useContext(WindowSizeContext)
	const [locations, setLocations] = useLocalStorage('locations', [])
	const [loadedLocation, setLoadedLocation] = useLocalStorage('loadedLocation')
	const [mobileDrawerOpened, setMobileDrawerOpened] = useState(false)

	const fetchLocationData = (lat, lng) => {
		const gAPI = 'https://maps.googleapis.com/maps/api/geocode/json'
		const params = `?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`
		return simplerFetch(gAPI + params).then((geo) => ({
			locationName: geo.plus_code.compound_code.replace(/\S+\s/, ''),
			id: lat + lng,
			coords: {
				lat,
				lng,
			},
		}))
	}

	const fetchSunData = (lat, lng) => {
		const sunAPI = 'https://api.sunrise-sunset.org/json'
		const params = `?lat=${lat}&lng=${lng}&date=today&formatted=0`
		return simplerFetch(sunAPI + params).then((res) => res.results)
	}

	const fetchWeatherData = (lat, lng) => {
		const corsProxy = 'https://cors-anywhere.herokuapp.com/'
		const darkskyAPI = 'https://api.darksky.net/forecast/'
		const params = `${process.env.REACT_APP_DARK_SKY_API_KEY}/${lat},${lng}?exclude=minutely`
		return simplerFetch(corsProxy + darkskyAPI + params).then((res) => res)
	}

	const fetchData = (lat, lng) => {
		return Promise.all([fetchLocationData(lat, lng), fetchWeatherData(lat, lng), fetchSunData(lat, lng)])
			.then(([locationData, weatherData, sunData]) => ({
				...locationData,
				weatherBG: getCurrentWeatherBG(weatherData, sunData),
				weatherData,
				sunData,
			}))
			.catch(console.log)
	}

	const canUpdateLocation = (location) => {
		const prevFetchDate = DateTime.fromSeconds(location.weatherData.currently.time).toLocal()
		const preventFetchInterval = Interval.fromDateTimes(prevFetchDate, prevFetchDate.plus({ minutes: 30 }))
		return !preventFetchInterval.contains(DateTime.local())
	}

	const loadLocation = async (lat, lng) => {
		let nextLocations = [...locations]
		const locIdx = nextLocations.findIndex((loc) => loc.id === lat + lng)
		if (locIdx > -1) {
			if (canUpdateLocation(nextLocations[locIdx])) nextLocations[locIdx] = await fetchData(lat, lng)
			setLoadedLocation(nextLocations[locIdx])
		} else {
			const newLocation = await fetchData(lat, lng)
			nextLocations.push(newLocation)
			setLoadedLocation(newLocation)
		}
		setLocations(nextLocations)
	}

	const removeLocation = (id) => {
		const newLocations = locations.filter((loc) => loc.id !== id)
		setLocations(newLocations)
		setLoadedLocation(newLocations.find((loc) => loc.id !== id))
	}

	const getCurrentWeatherBG = (weatherData, sunData) => {
		let weatherBG = 'linear-gradient(315deg, #7ab0cf 20%, #a8c7db 75%, #bfd0db 100%)'
		if (!weatherData || !sunData) return weatherBG

		const now = DateTime.fromSeconds(weatherData.currently.time)
		console.log(now.toString())
		let sun = { ...sunData }
		Object.keys(sun).forEach((key) => {
			sun[key] = DateTime.fromISO(sun[key])
			console.log(sun[key].toString())
		})

		// Create time intervals where we can tell where the weather data retrieval time falls under.
		// const dawn = Interval.fromDateTimes(
		// 	sun.nautical_twilight_begin,
		// 	sun.sunrise.plus(sun.sunrise.diff(sun.nautical_twilight_begin)),
		// )
		// const dusk = Interval.fromDateTimes(
		// 	sun.sunset.minus(sun.nautical_twilight_end.diff(sun.sunset)),
		// 	sun.nautical_twilight_end,
		// )

		// if (dawn.contains(now) || dusk.contains(now)) {
		// 	weatherBG = 'linear-gradient(0deg, #311f62 10%, #8d5273 65%, #e8817f 100%)'
		// } else if (dusk.isBefore(now)) {
		// 	weatherBG = 'linear-gradient(0deg, #2b2f77 0%, #141852 65%, #070b34 100%)'
		// }
		return weatherBG
	}

	const navContent = (
		<NavContent isMobileSizedWindow={isMobileSizedWindow}>
			<LocationSearch onLocationFound={loadLocation} />
			{locations.map((loc) => (
				<NavLocation key={loc.id} weatherBG={loc.weatherBG}>
					<NavLocationData tag='div' onClick={() => loadLocation(loc.coords.lat, loc.coords.lng)}>
						{loc.locationName}
					</NavLocationData>
					<Button svg={CloseCircleSVG} onClick={() => removeLocation(loc.id)} />
				</NavLocation>
			))}
		</NavContent>
	)

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
				<DataDisplay weatherBG={loadedLocation ? loadedLocation.weatherBG : getCurrentWeatherBG()}>
					{loadedLocation && (
						<>
							<div>currently selected: {loadedLocation.locationName}</div>
						</>
					)}
					<div style={{ flex: 0 }}>
						<Button variant='outline' onClick={() => setMobileDrawerOpened(true)}>
							open drawer
						</Button>
						<Button variant='outline' onClick={() => console.log(locations, loadedLocation)}>
							log state
						</Button>
					</div>
					<Radar loadedLocation={loadedLocation} />
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
