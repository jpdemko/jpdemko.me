/* global Microsoft */

import React, { useState, useEffect } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime, Interval } from 'luxon'

import { updateInterval } from './Weather'
import { ReactComponent as CloseCircleSVG } from '../../shared/assets/material-icons/close-circle.svg'
import { useInterval, useLocalStorage } from '../../shared/customHooks'
import { simplerFetch, themes } from '../../shared/shared'
import Button from '../ui/Button'
import Drawer from '../ui/Drawer'
import LocationSearch from './LocationSearch'
import WeatherIcon, { getCurWeatherBG } from './WeatherIcon'

/* --------------------------------- STYLES --------------------------------- */

const DesktopNav = styled.div`
	flex: 1;
`

const MobileContextButtons = styled.div`
	position: absolute;
	background-color: black;
	margin: 0.5em;
	bottom: 0;
	left: 0;
	z-index: 4000;
`

const Root = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100%;
	${({ theme, isMobileSizedWindow }) => css`
		border-${isMobileSizedWindow ? 'left' : 'right'}: 1px solid ${theme.mainColor};
		background-color: ${theme.mainColor};
		color: ${theme.bgContrastColor};
	`}
`

const LocationsList = styled.div`
	flex: 1 0;
	overflow-y: auto;
`

const Row = styled.div`
	display: flex;
	${({ curWeatherBG }) => css`
		background-image: ${curWeatherBG};
	`}
`

const Location = styled(Button)`
	padding-top: 0.5em;
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	white-space: nowrap;
`

const LocationAddress = styled.div`
	font-size: 0.8em;
`

const LocationSummary = styled.div`
	display: flex;
	align-items: center;
	& svg {
		font-size: 1.4em;
		/* transform: translate3d(0, 7.5%, 0); */
	}
`

const Footer = styled.div`
	padding: 0.25em;
	flex: 0 0;
	justify-self: flex-end;
	display: flex;
	> * {
		flex: 1;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

const WeatherNav = ({
	isMobileSizedWindow,
	map,
	curLocation,
	setCurLocation,
	flipMetric,
	getTemp,
	isMetric,
	...props
}) => {
	const [date, setDate] = useState(DateTime.local())
	const [locations, setLocations] = useLocalStorage('locations', [])
	const [mobileDrawerOpened, setMobileDrawerOpened] = useState(false)

	// Update clock at all locations every minute.
	useInterval(() => {
		const nextDate = DateTime.local()
		if (nextDate.minute !== date.minute) setDate(nextDate)
	}, 1000)

	const mapLoadLocation = (mapData) => {
		map.entities.clear()
		if (mapData) {
			map.setView({ center: mapData.location, zoom: 8 })
			map.entities.push(new Microsoft.Maps.Pushpin(mapData.location))
		}
	}

	const onLocationFound = (mapData) => {
		if (!map || !mapData) return

		const locationsCopy = [...locations]
		const { latitude: lat, longitude: lng } = mapData.location
		const locIdx = locationsCopy.findIndex((loc) => loc.id === lat + lng)
		if (locIdx > -1) setCurLocation(locationsCopy[locIdx])
		else {
			fetchData(mapData).then((newLocation) => {
				setLocations([...locationsCopy, newLocation])
				setCurLocation(newLocation)
			})
		}
		mapLoadLocation(mapData)
	}

	const removeLocation = (id) => {
		const newLocations = locations.filter((loc) => loc.id !== id)
		setLocations(newLocations)
		if (curLocation.id === id) {
			const nextLocation = newLocations.find((loc) => loc.id !== id)
			mapLoadLocation(nextLocation ? nextLocation.mapData : nextLocation)
			setCurLocation(nextLocation)
		}
	}

	const fetchSunData = (lat, lng, weatherData) => {
		const { currently, timezone } = weatherData
		const locDate = DateTime.fromSeconds(currently.time)
			.setZone(timezone)
			.toFormat('yyyy-MM-dd')
		const sunAPI = 'https://api.sunrise-sunset.org/json'
		const params = `?lat=${lat}&lng=${lng}&formatted=0&date=${locDate}`
		return simplerFetch(sunAPI + params).then((res) => res.results)
	}

	const fetchWeatherData = (lat, lng) => {
		const corsProxy = 'https://cors-anywhere.herokuapp.com/'
		const darkskyAPI = 'https://api.darksky.net/forecast/'
		const params = `${process.env.REACT_APP_DARK_SKY_API_KEY}/${lat},${lng}?exclude=minutely`
		return simplerFetch(corsProxy + darkskyAPI + params).then((res) => res)
	}

	const fetchData = async (mapData) => {
		try {
			const { latitude: lat, longitude: lng } = mapData.location
			const weatherData = await fetchWeatherData(lat, lng)
			const sunData = await fetchSunData(lat, lng, weatherData)
			return {
				id: lat + lng,
				curWeatherBG: getCurWeatherBG(weatherData, sunData),
				mapData,
				sunData,
				weatherData,
			}
		} catch (error) {
			console.log(error)
			return Promise.reject(error)
		}
	}

	const updateLocations = () => {
		const locPromises = locations.map((loc) => {
			const prevFetchDate = DateTime.fromSeconds(loc.weatherData.currently.time).toLocal()
			const recent = Interval.fromDateTimes(prevFetchDate, prevFetchDate.plus({ minutes: updateInterval }))
			return !recent.contains(DateTime.local()) ? fetchData(loc.mapData) : loc
		})
		Promise.all(locPromises).then(setLocations)
	}

	// On initial load and subsequent intervals we get new data for user's locations.
	useEffect(() => {
		updateLocations()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	useInterval(() => {
		updateLocations()
	}, 1000 * 60 * updateInterval)

	const navContent = (
		// <ThemeProvider theme={themes.light}>
		<Root isMobileSizedWindow={isMobileSizedWindow} {...props} theme={themes.dark}>
			<LocationSearch map={map} onLocationFound={onLocationFound} locations={locations} />
			<LocationsList>
				{locations.map(({ id, curWeatherBG, mapData, weatherData }) => (
					<Row key={id} curWeatherBG={curWeatherBG}>
						<Location tag='div' onClick={() => onLocationFound(mapData)}>
							<LocationAddress>{mapData.address.formattedAddress}</LocationAddress>
							<LocationSummary>
								<span>{getTemp(weatherData.currently.apparentTemperature)}&deg;</span>
								<WeatherIcon iconName={weatherData.currently.icon} />
								{/* <span style={{ opacity: 0.8, marginRight: '.5em' }}>/</span> */}
								<span>{date.setZone(weatherData.timezone).toFormat('t')}</span>
							</LocationSummary>
						</Location>
						<Button svg={CloseCircleSVG} onClick={() => removeLocation(id)}></Button>
					</Row>
				))}
			</LocationsList>
			<Footer>
				<Button variant='fancy' theme={themes.blue} onClick={flipMetric}>
					{isMetric ? 'Switch to Fahrenheit' : 'Switch to Celsius'}
				</Button>
			</Footer>
		</Root>
		// {/* </ThemeProvider> */}
	)
	return (
		<>
			{isMobileSizedWindow ? (
				<>
					<Drawer side='right' isShown={mobileDrawerOpened} onClose={() => setMobileDrawerOpened(false)}>
						{navContent}
					</Drawer>
					<MobileContextButtons>
						<Button variant='outline' onClick={() => setMobileDrawerOpened(true)}>
							open drawer
						</Button>
					</MobileContextButtons>
				</>
			) : (
				<DesktopNav>{navContent}</DesktopNav>
			)}
		</>
	)
}

export default WeatherNav
