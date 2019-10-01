import React, { useState, useEffect } from 'react'
import styled, { css } from 'styled-components/macro'

import { opac, themes } from '../../shared/shared'
import WeatherIcon from './WeatherIcon'
import Tabs from '../ui/Tabs'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 2;
	display: flex;
	flex-direction: column;
	> * {
		flex: 1;
	}
`

const Forecast = styled.div`
	display: flex;
	flex-direction: column;
	${({ curWeatherBG }) => css`
		background-image: ${curWeatherBG};
	`}
`

const InfoMessage = styled.div`
	display: inline-block;
	position: absolute;
	z-index: 500;
	top: 0.5em;
	left: 0.5em;
	padding: 0.25em 0.5em;
	transition: opacity 0.5s;
	${({ theme, isValidZone }) => css`
		background-color: ${opac(0.8, theme.mainColor)};
		color: ${theme.bgContrastColor};
		opacity: ${isValidZone ? 0 : 1};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const validZones = [
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
	'America/Toronto',
	'America/Yakutat',
	'Pacific/Honolulu',
]

const ForecastDisplay = ({ curLocation, getTemp, ...props }) => {
	const [isValidZone, setIsValidZone] = useState(
		curLocation && validZones.includes(curLocation.weatherData.timezone),
	)

	useEffect(() => {
		setIsValidZone(curLocation && validZones.includes(curLocation.weatherData.timezone))
	}, [curLocation])

	const { mapData, weatherData } = curLocation || {}
	return (
		<Root {...props}>
			{curLocation && (
				<Forecast curWeatherBG={curLocation.curWeatherBG}>
					<div>{mapData.address.formattedAddress}</div>
					<div>{weatherData.currently.summary}</div>
				</Forecast>
			)}
			<div id='BingMapRadar'>
				<InfoMessage theme={themes.dark} isValidZone={isValidZone}>
					INFO: Radar loop only works in US! (don't have outside data)
				</InfoMessage>
			</div>
		</Root>
	)
}

export default ForecastDisplay
