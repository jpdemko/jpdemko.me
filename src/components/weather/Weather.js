/* global Microsoft */

import React from 'react'
import styled, { css } from 'styled-components/macro'
import { DateTime, Interval } from 'luxon'

import { getCurWeatherBG } from './WeatherIcon'
import { ReactComponent as SunnySVG } from '../../shared/assets/weather-icons/wi-day-sunny.svg'
import { themes, simplerFetch, Contexts } from '../../shared/shared'
import { useLocalStorage, useInterval, useResizeObserver } from '../../shared/customHooks'
import WeatherNav from './WeatherNav'
import CurrentWeather from './CurrentWeather'
import Forecast from './Forecast'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	font-size: 1.1em;
	height: 100%;
	display: flex;
	${({ theme, weatherBG }) => css`
		background-color: ${theme.mainColor};
		background-image: ${weatherBG};
		color: ${theme.contrastColor};
	`}
`

const Data = styled.div`
	font-size: 1.2rem;
	height: 100%;
	flex: 2 1 auto;
	display: flex;
	overflow: hidden;
	${({ isLandscape }) => css`
		flex-direction: ${isLandscape ? 'row' : 'column'};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

export const updateInterval = 30

const radar = {
	api: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-{timestamp}/{zoom}/{x}/{y}.png',
	timestamps: [
		'900913-m50m',
		'900913-m45m',
		'900913-m40m',
		'900913-m35m',
		'900913-m30m',
		'900913-m25m',
		'900913-m20m',
		'900913-m15m',
		'900913-m10m',
		'900913-m05m',
		'900913',
	],
}

const Weather = React.memo(({ ...props }) => {
	const [curLocation, setCurLocation] = useLocalStorage('curLocation')
	const [locations, setLocations] = useLocalStorage('locations', [])

	// Setup map and add radar data.
	const [map, setMap] = React.useState()
	const [modulesLoaded, setModulesLoaded] = React.useState(false)
	React.useEffect(() => {
		const genMap = new Microsoft.Maps.Map('#BingMapRadar', {
			navigationBarMode: Microsoft.Maps.NavigationBarMode.minified,
			supportedMapTypes: [
				Microsoft.Maps.MapTypeId.road,
				Microsoft.Maps.MapTypeId.aerial,
				Microsoft.Maps.MapTypeId.canvasLight,
			],
			zoom: 5,
			...(curLocation && {
				center: curLocation.mapData.location,
				zoom: 8,
			}),
		})
		Microsoft.Maps.loadModule(['Microsoft.Maps.AutoSuggest', 'Microsoft.Maps.Search'], {
			callback: () => setModulesLoaded(true),
			errorCallback: console.log,
		})

		if (curLocation) genMap.entities.push(new Microsoft.Maps.Pushpin(genMap.getCenter()))
		updateRadar(genMap)
		setMap(genMap)

		return () => {
			if (map) map.dispose()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const updateRadar = (mapParam) => {
		const localMap = mapParam ?? map
		if (!localMap) return
		localMap.layers.clear()
		const tileSources = radar.timestamps.map(
			(ts) =>
				new Microsoft.Maps.TileSource({
					uriConstructor: radar.api.replace('{timestamp}', ts),
				}),
		)
		const animatedLayer = new Microsoft.Maps.AnimatedTileLayer({ mercator: tileSources, frameRate: 500 })
		localMap.layers.insert(animatedLayer)
	}

	useInterval(() => {
		updateRadar()
	}, 1000 * 60 * updateInterval)

	const mapLoadLocation = (mapData) => {
		map.entities.clear()
		if (mapData) {
			map.setView({ center: mapData.location, zoom: 8 })
			map.entities.push(new Microsoft.Maps.Pushpin(mapData.location))
		}
	}

	const { toggleMobileMenu } = React.useContext(Contexts.AppNav)
	const onLocationFound = (mapData) => {
		if (!map || !mapData) return

		const locationsCopy = [...locations]
		const { latitude: lat, longitude: lng } = mapData.location
		const locIdx = locationsCopy.findIndex((loc) => loc.id === lat + lng)
		if (locIdx > -1) {
			setCurLocation(locationsCopy[locIdx])
			mapLoadLocation(mapData)
		} else {
			fetchData(mapData)
				.then((newLocation) => {
					setLocations([...locationsCopy, newLocation])
					setCurLocation(newLocation)
					mapLoadLocation(mapData)
					toggleMobileMenu()
				})
				.catch(console.log)
		}
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
		const darkskyAPI = 'https://api.darksky.net/forecast/'
		const params = `${process.env.REACT_APP_DARK_SKY_API_KEY}/${lat},${lng}?exclude=minutely`
		return simplerFetch(darkskyAPI + params, true).then((res) => res)
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
		} catch (err) {
			console.log('<Weather /> fetchData() error: ', err)
			return Promise.reject(err)
		}
	}

	const updateLocations = () => {
		const locPromises = locations.map((loc) => {
			const prevFetchDate = DateTime.fromSeconds(loc.weatherData.currently.time).toLocal()
			const recent = Interval.fromDateTimes(prevFetchDate, prevFetchDate.plus({ minutes: updateInterval }))
			return !recent.contains(DateTime.local()) ? fetchData(loc.mapData) ?? loc : loc
		})
		Promise.all(locPromises)
			.then((nextLocations) => {
				const nextCurLocation = nextLocations.find((loc) => loc.id === curLocation.id)
				setCurLocation(nextCurLocation)
				setLocations(nextLocations)
			})
			.catch(console.log)
	}

	// On initial load and subsequent intervals we get new data for user's locations.
	React.useEffect(() => {
		updateLocations()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	useInterval(() => {
		updateLocations()
	}, 1000 * 60 * updateInterval)

	const [isMetric, setIsMetric] = React.useState(false)
	const flipMetric = () => setIsMetric((prev) => !prev)
	const getTemp = React.useCallback(
		(temp) => (isMetric ? Math.round((5 / 9) * (temp - 32)) : Math.round(temp)),
		[isMetric],
	)

	const checkIfLandscape = React.useCallback(
		(resizeEleRect) => resizeEleRect.width > resizeEleRect.height * 1.25,
		[],
	)
	const [dataRef, isLandscape] = useResizeObserver(checkIfLandscape)

	return (
		<Root {...props} weatherBG={curLocation?.weatherBG}>
			<WeatherNav
				map={map}
				modulesLoaded={modulesLoaded}
				locations={locations}
				removeLocation={removeLocation}
				onLocationFound={onLocationFound}
				isMetric={isMetric}
				flipMetric={flipMetric}
				getTemp={getTemp}
			/>
			<Data ref={dataRef} isLandscape={isLandscape}>
				<CurrentWeather curLocation={curLocation} getTemp={getTemp} isLandscape={isLandscape} />
				<Forecast curLocation={curLocation} locations={locations} getTemp={getTemp} />
			</Data>
		</Root>
	)
})

Weather.shared = {
	title: 'Weather',
	logo: SunnySVG,
	theme: themes.blue,
}

export default Weather
