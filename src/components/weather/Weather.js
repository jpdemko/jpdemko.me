/* global Microsoft */

import React, { useContext, useState, useEffect } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'

import { ReactComponent as SunnySVG } from '../../shared/assets/weather-icons/wi-day-sunny.svg'
import { themes } from '../../shared/shared'
import { useLocalStorage, useInterval } from '../../shared/customHooks'
import { WindowSizeContext } from '../display/Window'
import WeatherNav from './WeatherNav'
import ForecastDisplay from './ForecastDisplay'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	font-size: 1.1em;
	height: 100%;
	display: flex;
	${({ theme, weatherBG }) => css`
		background-color: ${theme.bgContrastColor};
		background-image: ${weatherBG};
		color: ${theme.mainColor};
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

const Weather = () => {
	const isMobileSizedWindow = useContext(WindowSizeContext)
	const [curLocation, setCurLocation] = useLocalStorage('curLocation')
	const [isMetric, setIsMetric] = useState(false)
	const [map, setMap] = useState()

	// Setup map and add radar data.
	useEffect(() => {
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
		if (curLocation) genMap.entities.push(new Microsoft.Maps.Pushpin(genMap.getCenter()))
		updateRadar(genMap)

		return () => {
			if (map) {
				map.dispose()
				setMap(null)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const updateRadar = (mapParam) => {
		const localMap = mapParam ? mapParam : map
		localMap.layers.clear()
		const tileSources = radar.timestamps.map(
			(ts) =>
				new Microsoft.Maps.TileSource({
					uriConstructor: radar.api.replace('{timestamp}', ts),
				}),
		)
		const animatedLayer = new Microsoft.Maps.AnimatedTileLayer({ mercator: tileSources, frameRate: 500 })
		localMap.layers.insert(animatedLayer)
		setMap(localMap)
	}

	useInterval(() => {
		updateRadar()
	}, 1000 * 60 * updateInterval)

	const flipMetric = () => setIsMetric((prev) => !prev)

	const getTemp = (temp) => (isMetric ? Math.round((5 / 9) * (temp - 32)) : Math.round(temp))

	return (
		<ThemeProvider theme={themes.light}>
			<Root weatherBG={curLocation && curLocation.weatherBG}>
				<WeatherNav
					isMobileSizedWindow={isMobileSizedWindow}
					curLocation={curLocation}
					setCurLocation={setCurLocation}
					map={map}
					isMetric={isMetric}
					flipMetric={flipMetric}
					getTemp={getTemp}
				/>
				<ForecastDisplay curLocation={curLocation} getTemp={getTemp} />
			</Root>
		</ThemeProvider>
	)
}

Weather.shared = {
	title: 'Weather',
	logo: SunnySVG,
	theme: themes.blue,
}

export default Weather
