import React from 'react'
import styled, { css } from 'styled-components/macro'
import { DateTime } from 'luxon'

import { opac } from '../../shared/helpers'
import { themes } from '../../shared/constants'
import { ReactComponent as RadarSVG } from '../../shared/assets/weather-icons/radar.svg'
import WeatherIcon from './WeatherIcon'
import Tabs from '../ui/Tabs'

/* --------------------------------- STYLES --------------------------------- */

const CustomTabs = styled(Tabs)`
	border: none;
	flex: 2 0;
	font-size: 0.8em;
	${({ theme }) => css`
		border-top: 2px solid ${theme.mixedColor};
	`}
`

const InfoMessage = styled.div`
	display: inline-block;
	position: absolute;
	z-index: 500;
	margin: 1em;
	margin-right: 3em;
	top: 0;
	left: 0;
	padding: 0.25em 0.5em;
	transition: opacity 0.5s;
	${({ theme, isValidZone }) => css`
		background-color: ${opac(0.8, theme.mainColor)};
		color: ${theme.contrastColor};
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

const Table = styled.table`
	position: relative;
	width: 100%;
	border-collapse: collapse;
	text-align: center;
	${({ theme }) => css`
		th {
			background: ${theme.mainColor};
			position: sticky;
			z-index: 1000;
			top: 0;
		}
	`}
`

const THeader = styled.thead`
	white-space: nowrap;
	${({ theme }) => css`
		div {
			position: absolute;
			width: 100%;
			left: 0;
			border-bottom: 2px solid ${theme.mixedColor};
		}
	`}
`

const TBody = styled.tbody`
	overflow: auto;
	${({ theme }) => css`
		tr:nth-child(odd) {
			background: ${opac(0.5, theme.mixedColor)};
		}
	`}
`

const TRow = styled.tr`
	> * {
		padding: 0.15em 0.3em;
	}
`

const SummaryCell = styled.div`
	display: flex;
	flex-direction: column;
	text-align: center;
	justify-content: center;
	align-items: center;
`

const Subtle = styled.span`
	font-size: 0.8em;
	opacity: 0.8;
`

const MapEntry = styled.div`
	position: absolute;
	height: 100%;
	width: 100%;
	left: 0;
	top: 0;
`

/* -------------------------------- COMPONENTS ------------------------------- */

function DaySummary({ data: { dayName, ordDay, timezone, day }, getTemp, ...props }) {
	const { icon, apparentTemperatureLow: low, apparentTemperatureHigh: high } = day

	function checkDayName(name) {
		const curOrdDay = DateTime.local()
			.setZone(timezone)
			.toFormat('o')
		return curOrdDay === ordDay ? 'Today' : dayName
	}

	return (
		<Card {...props}>
			<div>{checkDayName(dayName)}</div>
			<HR />
			<Temps>
				<span>H: {getTemp(high)}&deg;</span>
				<WeatherIcon iconName={icon} />
				<span>L: {getTemp(low)}&deg;</span>
			</Temps>
		</Card>
	)
}

const DayDetailed = ({ data: { timezone, hours }, getTemp }) => (
	<>
		{hours.length === 0 ? (
			<div style={{ textAlign: 'center', padding: '.35em .7em' }}>
				Hourly data isn't supported past 48 hours due to it being fairly inaccurate.
			</div>
		) : (
			<Table>
				<THeader>
					<TRow>
						<th>
							Time
							<div />
						</th>
						<th>
							Summary
							<div />
						</th>
						<th>
							Temp.
							<div />
						</th>
						<th>
							Rain%
							<div />
						</th>
						<th>
							Humid.%
							<div />
						</th>
					</TRow>
				</THeader>
				<TBody>
					{hours.map((hour) => {
						const time = DateTime.fromSeconds(hour.time)
							.setZone(timezone)
							.toFormat('h a')
						const [h, period] = time.split(' ')
						return (
							<TRow key={hour.time}>
								<td>
									<div>
										{h}
										<Subtle>{period}</Subtle>
									</div>
								</td>
								<td>
									<SummaryCell>
										<WeatherIcon iconName={hour.icon} />
										{hour.summary}
									</SummaryCell>
								</td>
								<td>{getTemp(hour.apparentTemperature)}&deg;</td>
								<td>
									<div>
										{Math.round(hour.precipProbability * 100)}
										<Subtle>%</Subtle>
									</div>
								</td>
								<td>
									<div>
										{Math.round(hour.humidity * 100)}
										<Subtle>%</Subtle>
									</div>
								</td>
							</TRow>
						)
					})}
				</TBody>
			</Table>
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
				<MapEntry id='BingMapRadar'>
					<InfoMessage theme={themes.dark} isValidZone={isValidZone}>
						INFO: Radar loop overlay is only for the USA. I don't have international data.
					</InfoMessage>
				</MapEntry>
			),
		}),
		[isValidZone],
	)

	const tabsContent = React.useMemo(() => {
		if (!curLocation) return [bingMapRadar]
		const { daily, hourly, timezone } = curLocation.weatherData

		function getOrdinalDay(time) {
			return DateTime.fromSeconds(time)
				.setZone(timezone)
				.toFormat('o')
		}

		function getDayName(time) {
			return DateTime.fromSeconds(time)
				.setZone(timezone)
				.toFormat('ccc')
		}

		const sortedData = daily.data.reduce((obj, day) => {
			const ordDay = getOrdinalDay(day.time)
			return {
				...obj,
				[ordDay]: {
					dayName: getDayName(day.time),
					ordDay,
					day,
					timezone,
					hours: [],
				},
			}
		}, {})
		hourly.data.forEach((h, i) => {
			if (i % 2 === 0) sortedData[getOrdinalDay(h.time)].hours.push(h)
		})

		const genContent = Object.keys(sortedData).map((ordDay) => ({
			id: ordDay,
			tabHeader: <DaySummary data={sortedData[ordDay]} getTemp={getTemp} />,
			tabContent: <DayDetailed data={sortedData[ordDay]} getTemp={getTemp} />,
		}))

		return [bingMapRadar, ...genContent]
	}, [bingMapRadar, curLocation, getTemp])

	return <CustomTabs content={tabsContent} />
})

export default Forecast
