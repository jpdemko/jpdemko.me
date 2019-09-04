/* eslint-disable no-undef */

import React, { useRef, useEffect } from 'react'
import styled from 'styled-components/macro'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const WeatherMapRoot = styled.div``

const InfoMessage = styled.div`
	display: inline-block;
	position: absolute;
	top: 0.5em;
	left: 0.5em;
`

/* -------------------------- WEATHER-MAP COMPONENT ------------------------- */

const allowedZones = [
	'America/Adak',
	'America/Anchorage',
	'America/Boise',
	'America/Chicago',
	'America/Denver',
	'America/Detroit',
	'America/Indiana/Indianapolis',
	'America/Indiana/Knox',
	'America/Indiana/Marengo',
	'America/Indiana/Petersburg',
	'America/Indiana/Tell_City',
	'America/Indiana/Vevay',
	'America/Indiana/Vincennes',
	'America/Indiana/Winamac',
	'America/Juneau',
	'America/Kentucky/Louisville',
	'America/Kentucky/Monticello',
	'America/Los_Angeles',
	'America/Menominee',
	'America/Metlakatla',
	'America/New_York',
	'America/Nome',
	'America/North_Dakota/Beulah',
	'America/North_Dakota/Center',
	'America/North_Dakota/New_Salem',
	'America/Phoenix',
	'America/Sitka',
	'America/Yakutat',
	'Pacific/Honolulu',
]

// prettier-ignore
const urlTemplate = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-{timestamp}/{zoom}/{x}/{y}.png'
const timestamps = [
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
]

const WeatherMap = ({ loadedLocation }) => {
	const map = useRef()

	useEffect(() => {
		map.current = new Microsoft.Maps.Map('#weatherMap', {
			navigationBarMode: Microsoft.Maps.NavigationBarMode.minified,
			supportedMapTypes: [
				Microsoft.Maps.MapTypeId.road,
				Microsoft.Maps.MapTypeId.aerial,
				Microsoft.Maps.MapTypeId.canvasLight,
			],
		})
		const tileSources = timestamps.map(
			(ts) =>
				new Microsoft.Maps.TileSource({
					uriConstructor: urlTemplate.replace('{timestamp}', ts),
				}),
		)
		let animatedLayer = new Microsoft.Maps.AnimatedTileLayer({ mercator: tileSources, frameRate: 500 })
		map.current.layers.insert(animatedLayer)
	}, [])

	useEffect(() => {
		if (!loadedLocation) return
		map.current.entities.clear()
		const { lat, lng } = loadedLocation.coords
		const curLocation = new Microsoft.Maps.Location(lat, lng)
		map.current.entities.push(new Microsoft.Maps.Pushpin(curLocation))
		map.current.setView({
			center: curLocation,
			zoom: 10,
		})
	}, [loadedLocation])

	return <WeatherMapRoot id='weatherMap'></WeatherMapRoot>
}

export default WeatherMap
