import { memo, useMemo, useState, useEffect } from "react"
import styled, { css } from "styled-components/macro"
import { DateTime } from "luxon"

import { opac } from "../../shared/shared"
import { ReactComponent as SvgRadar } from "../../shared/assets/weather-icons/radar.svg"
import WeatherIcon from "./WeatherIcon"
import Tabs from "../ui/Tabs"
import TempHue from "./TempHue"

/* --------------------------------- STYLES --------------------------------- */

const CustomTabs = styled(Tabs)`
	flex: 3 0;
	border: none;
	font-size: 0.8em;
`

const InfoMessage = styled.div`
	display: inline-block;
	position: absolute;
	z-index: 500;
	margin: 0.5em;
	bottom: 0;
	left: 0;
	max-width: 100%;
	padding: 0.2em 0.6em;
	font-size: 0.8em;
	transition: opacity 0.5s;
	${({ theme, isValidZone }) => css`
		background-color: ${opac(0.8, theme.background)};
		color: ${theme.backgroundContrast};
		opacity: ${isValidZone ? 0 : 1};
		> span {
			font-weight: bold;
			color: ${theme.primary};
		}
	`}
`

const Card = styled.div`
	> div:first-child {
		font-weight: bold;
	}
	&& svg {
		height: 2.25em;
	}
`

const HR = styled.div`
	${({ theme }) => css`
		border-top: 1px solid ${theme.acent};
		margin: 1px 0;
	`}
`

const Temps = styled.div`
	--temps-pad: 0.15em;
	display: flex;
	flex-direction: column;
	padding: var(--temps-pad);
	> * {
		margin: var(--temps-pad) 0;
	}
	span {
		font-size: 0.8em;
	}
`

const SummaryTempHue = styled(TempHue)`
	padding: 0em 0.3em;
`

const TableTempHue = styled(TempHue)`
	display: inline-block;
	padding: 0em 0.3em;
`

const Table = styled.table`
	position: relative;
	width: 100%;
	border-collapse: collapse;
	text-align: center;
	${({ theme }) => css`
		th {
			background: ${theme.backgroundAlt};
			position: sticky;
			z-index: 1000;
			top: 0;
		}
	`}
`

const THeader = styled.thead`
	white-space: nowrap;
	background: coral;
	${({ theme }) => css`
		tr {
			padding: 0;
		}
		div {
			border-bottom: 1px solid ${theme.accent};
		}
	`}
`

const TBody = styled.tbody`
	overflow: auto;
	font-weight: bold;
	${({ theme }) => css`
		tr:nth-child(odd) {
			background: ${opac(0.5, theme.background)};
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

function DaySummary({ data: { dayName, day }, getTemp, ...props }) {
	const { icon, apparentTemperatureLow: low, apparentTemperatureHigh: high } = day

	return (
		<Card {...props}>
			<div>{dayName}</div>
			<HR />
			<Temps>
				<SummaryTempHue temp={high}>H: {getTemp(high)}&deg;</SummaryTempHue>
				<WeatherIcon iconName={icon} />
				<SummaryTempHue temp={low}>L: {getTemp(low)}&deg;</SummaryTempHue>
			</Temps>
		</Card>
	)
}

const DayDetailed = ({ data: { timezone, hours }, getTemp }) => (
	<>
		{hours.length === 0 ? (
			<div style={{ textAlign: "center", padding: ".35em .7em" }}>
				Hourly data isn't supported past 48 hours due to it being fairly inaccurate.
			</div>
		) : (
			<Table>
				<THeader>
					<TRow>
						<th>
							<div>Time</div>
						</th>
						<th>
							<div>Summary</div>
						</th>
						<th>
							<div>Temp.</div>
						</th>
						<th>
							<div>Rain%</div>
						</th>
						<th>
							<div>Humid.%</div>
						</th>
					</TRow>
				</THeader>
				<TBody>
					{hours.map((hour) => {
						const time = DateTime.fromSeconds(hour.time).setZone(timezone).toFormat("h a")
						const [h, period] = time.split(" ")
						const temp = hour.apparentTemperature
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
								<td>
									<TableTempHue temp={temp}>{getTemp(temp)}&deg;</TableTempHue>
								</td>
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
	"America/Adak",
	"America/Anchorage",
	"America/Boise",
	"America/Chicago",
	"America/Denver",
	"America/Detroit",
	"America/Indiana/Indianapolis",
	"America/Indiana/Knox",
	"America/Indiana/Marengo",
	"America/Indiana/Petersburg",
	"America/Indiana/Tell_City",
	"America/Indiana/Vevay",
	"America/Indiana/Vincennes",
	"America/Indiana/Winamac",
	"America/Juneau",
	"America/Kentucky/Louisville",
	"America/Kentucky/Monticello",
	"America/Los_Angeles",
	"America/Menominee",
	"America/Metlakatla",
	"America/New_York",
	"America/Nome",
	"America/North_Dakota/Beulah",
	"America/North_Dakota/Center",
	"America/North_Dakota/New_Salem",
	"America/Phoenix",
	"America/Sitka",
	"America/Toronto",
	"America/Yakutat",
	"Pacific/Honolulu",
]

const Forecast = memo(({ curLocation, getTemp }) => {
	const [isValidZone, setIsValidZone] = useState(true)

	useEffect(() => {
		setIsValidZone(curLocation && usaZones.includes(curLocation.weatherData.timezone))
	}, [curLocation])

	const bingMapRadar = useMemo(
		() => ({
			id: "bingMapRadar",
			header: (
				<Card>
					<div>
						<SvgRadar />
					</div>
					<div>Radar</div>
				</Card>
			),
			content: (
				<MapEntry id="BingMapRadar">
					<InfoMessage isValidZone={isValidZone}>
						- <span>INFO</span> - Radar loop overlay is only for the USA. I don't have international
						data.
					</InfoMessage>
				</MapEntry>
			),
		}),
		[isValidZone]
	)

	const tabsData = useMemo(() => {
		if (!curLocation) return [bingMapRadar]
		const { daily, hourly, timezone } = curLocation.weatherData

		/**
		 * Gets year + ordinal day as a concat string (2020 + 001 = 2020001) and then parses it to an int.
		 * @param {number} time
		 * @returns {number}
		 */
		function getSortedOrdinal(time) {
			return parseInt(DateTime.fromSeconds(time).setZone(timezone).toFormat("yooo"))
		}

		function getDayName(time) {
			const now = DateTime.local().setZone(timezone)
			const passedTime = DateTime.fromSeconds(time).setZone(timezone)
			return now.hasSame(passedTime, "day") ? "Today" : passedTime.toFormat("ccc")
		}

		const sortedData = (daily?.data ?? []).reduce((obj, day) => {
			const ordDay = getSortedOrdinal(day.time)
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
		// Don't need to display data for every hour, every other works fine.
		hourly.data.forEach((h, i) => {
			if (i % 2 === 0) sortedData[getSortedOrdinal(h.time)].hours.push(h)
		})

		const genContent = Object.keys(sortedData).map((ordDay) => ({
			id: ordDay,
			header: <DaySummary data={sortedData[ordDay]} getTemp={getTemp} />,
			content: <DayDetailed data={sortedData[ordDay]} getTemp={getTemp} />,
		}))

		return [bingMapRadar, ...genContent]
	}, [bingMapRadar, curLocation, getTemp])

	return <CustomTabs data={tabsData} />
})

export default Forecast
