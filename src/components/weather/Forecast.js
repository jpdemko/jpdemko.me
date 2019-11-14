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
	flex: 2 1;
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
	top: 0;
	left: 0;
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

const TRoot = styled.div`
	overflow: auto;
	height: 100%;
`

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	text-align: center;
`

const THeader = styled.thead`
	white-space: nowrap;
	${({ theme }) => css`
		th {
			background: ${theme.mainColor};
			position: sticky;
			z-index: 1;
			top: 0;
		}
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

/* -------------------------------- COMPONENTS ------------------------------- */

const DaySummary = ({ data, getTemp, name, ...props }) => {
	const { icon, apparentTemperatureLow: low, apparentTemperatureHigh: high } = data
	return (
		<Card {...props}>
			<div>{name}</div>
			<HR />
			<Temps>
				<span>H - {getTemp(high)}&deg;</span>
				<WeatherIcon iconName={icon} />
				<span>L - {getTemp(low)}&deg;</span>
			</Temps>
		</Card>
	)
}

const DayDetailed = ({ data: { timezone, hours }, getTemp }) => (
	<TRoot>
		{hours.length === 0 ? (
			<div style={{ textAlign: 'center', padding: '.25em' }}>
				No data! Detailed hourly data isn't accurate past 48 hours!
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
	</TRoot>
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
