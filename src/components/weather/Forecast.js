import React from 'react'
import styled, { css } from 'styled-components/macro'
import { DateTime } from 'luxon'

import { themes, opac } from '../../shared/shared'
import { ReactComponent as RadarSVG } from '../../shared/assets/misc-icons/radar.svg'
import WeatherIcon from './WeatherIcon'
import Tabs from '../ui/Tabs'

/* --------------------------------- STYLES --------------------------------- */

const CustomTabs = styled(Tabs)`
	border: none;
	flex: 2;
	font-size: 0.8em;
	${({ theme }) => css`
		border-top: 2px solid ${theme.mixedColor};
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

const Card = styled.div`
	&& svg {
		height: 2.25em;
	}
`

const HR = styled.div`
	${({ theme }) => css`
		border: 1px solid ${theme.mixedColor};
	`}
`

const Temps = styled.div`
	display: flex;
	flex-direction: column;
	span {
		font-size: 0.8em;
	}
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(5, minmax(min-content, auto));
	align-items: center;
	justify-items: center;
	&& svg {
		height: 2em;
	}
`

const Row = styled.div`
	display: contents;
	${({ theme }) => css`
		&:nth-child(odd) div {
			background: ${opac(0.5, theme.mixedColor)};
		}
		&:first-child div {
			background: ${opac(0.75, theme.mixedColor)};
			border-bottom: 2px solid ${opac(0.5, theme.bgContrastColor)};
			text-transform: uppercase;
			position: sticky;
			top: 0;
		}
	`}
	div {
		padding: 0.2em;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}
`

/* -------------------------------- COMPONENTS ------------------------------- */

const DaySummary = ({ data, getTemp, name, ...props }) => {
	const { icon, apparentTemperatureLow: low, apparentTemperatureHigh: high } = data
	return (
		<Card {...props}>
			<div>{name}</div>
			<HR />
			<Temps>
				<span>High: {getTemp(high)}&deg;</span>
				<WeatherIcon iconName={icon} />
				<span>Low: {getTemp(low)}&deg;</span>
			</Temps>
		</Card>
	)
}

const DayDetailed = ({ data: { timezone, hours }, getTemp }) => (
	<>
		{hours.length === 0 ? (
			<div style={{ textAlign: 'center', padding: '.25em' }}>
				No data! Detailed hourly data isn't accurate past 48 hours!
			</div>
		) : (
			<Grid>
				<Row>
					<div>Time</div>
					<div>Summary</div>
					<div>Temp.</div>
					<div>Rain %</div>
					<div>Humid. %</div>
				</Row>
				{hours.map((hour) => (
					<Row key={hour.time}>
						<div>
							{DateTime.fromSeconds(hour.time)
								.setZone(timezone)
								.toFormat('h a')}
						</div>
						<div>
							<WeatherIcon iconName={hour.icon} />
							{hour.summary}
						</div>
						<div>{getTemp(hour.apparentTemperature)}&deg;</div>
						<div>{Math.round(hour.precipProbability * 100)}%</div>
						<div>{Math.round(hour.humidity * 100)}%</div>
					</Row>
				))}
			</Grid>
		)}
	</>
)

const usaZones = [
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

const Forecast = React.memo(({ curLocation, getTemp }) => {
	const [isValidZone, setIsValidZone] = React.useState(true)

	React.useEffect(() => {
		setIsValidZone(curLocation && usaZones.includes(curLocation.weatherData.timezone))
	}, [curLocation])

	const bingMapRadar = React.useMemo(
		() => ({
			id: 'bingMapRadar',
			tabHeader: (
				<Card>
					<div>
						<RadarSVG />
					</div>
					<div>Radar</div>
				</Card>
			),
			tabContent: (
				<div id='BingMapRadar' title='Radar'>
					<InfoMessage theme={themes.dark} isValidZone={isValidZone}>
						INFO: Radar loop only works in US! (don't have outside data)
					</InfoMessage>
				</div>
			),
		}),
		[isValidZone],
	)

	const tabsContent = React.useMemo(() => {
		if (!curLocation) return [bingMapRadar]

		const getDay = (time) => {
			const curDay = DateTime.local()
				.setZone(curLocation.timezone)
				.toFormat('ccc')
			const targetDay = DateTime.fromSeconds(time)
				.setZone(curLocation.timezone)
				.toFormat('ccc')
			return curDay !== targetDay ? targetDay : 'Today'
		}

		const { daily, hourly, timezone } = curLocation.weatherData
		const sortedData = daily.data.reduce(
			(obj, day) => ({
				...obj,
				[getDay(day.time)]: {
					headerData: day,
					contentData: {
						timezone,
						hours: [],
					},
				},
			}),
			{},
		)
		hourly.data.forEach((h, i) => {
			if (i % 2 === 0) sortedData[getDay(h.time)].contentData.hours.push(h)
		})

		const genContent = Object.keys(sortedData).map((key) => ({
			id: key,
			tabHeader: <DaySummary data={sortedData[key].headerData} getTemp={getTemp} name={key} />,
			tabContent: <DayDetailed data={sortedData[key].contentData} getTemp={getTemp} />,
		}))
		genContent.push(bingMapRadar)
		return genContent
	}, [bingMapRadar, curLocation, getTemp])

	return <CustomTabs content={tabsContent} />
})

export default Forecast
