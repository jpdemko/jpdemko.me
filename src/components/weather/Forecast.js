import React from 'react'
import styled, { css } from 'styled-components/macro'
import { DateTime } from 'luxon'

import { themes, opac } from '../../shared/shared'
import Tabs from '../ui/Tabs'

/* --------------------------------- STYLES --------------------------------- */

const CustomTabs = styled(Tabs)`
	font-size: 0.8em;
	border: none;
	flex: 1 1;
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

const Table = styled.div`
	height: 100%;
	display: grid;
`

/* -------------------------------- COMPONENTS ------------------------------- */

const DaySummary = ({ id, weatherData: { daily }, ...props }) => (
	<div>
		<div>{DateTime.fromSeconds(daily.time).setZone()}</div>
	</div>
)

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

const Forecast = ({ curLocation, locations = [] }) => {
	const [isValidZone, setIsValidZone] = React.useState(true)

	React.useEffect(() => {
		setIsValidZone(curLocation && validZones.includes(curLocation.weatherData.timezone))
	}, [curLocation])

	const bingMapRadar = {
		id: 'bingMapRadar',
		tabHeader: <div>Radar</div>,
		tabContent: (
			<div id='BingMapRadar' title='Radar'>
				<InfoMessage theme={themes.dark} isValidZone={isValidZone}>
					INFO: Radar loop only works in US! (don't have outside data)
				</InfoMessage>
			</div>
		),
	}

	const content = locations.map((loc) => ({
		id: loc.id,
		tabHeader: <div>header:{loc.id}</div>,
		tabContent: <div>content:{loc.id}</div>,
	}))
	content.push(bingMapRadar)

	return <CustomTabs content={content} />
}

export default Forecast
