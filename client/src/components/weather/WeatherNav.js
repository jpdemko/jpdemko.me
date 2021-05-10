import { useState, useEffect, useContext, useMemo } from "react"
import styled, { css } from "styled-components/macro"
import { DateTime } from "luxon"

import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
import { useInterval } from "../../shared/hooks"
import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import LocationSearch from "./LocationSearch"
import WeatherIcon from "./WeatherIcon"
import TempHue from "./TempHue"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--wnav-padding: 0.5em;
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100%;
	${({ theme }) => css`
		background-color: ${theme.backgroundAlt};
	`}
`

const LocationsList = styled.div`
	flex: 1 1 auto;
	overflow-y: auto;
	${({ theme }) => css`
		> * {
			border-bottom: 1px solid ${theme.accent};
		}
	`}
`

const Row = styled.div`
	display: flex;
	${({ curWeatherBG }) => css`
		background-image: ${curWeatherBG?.gradient};
	`}
`

const Location = styled(Button)`
	padding-top: 0.5em;
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	white-space: nowrap;
	${({ theme, curWeatherBG }) => css`
		color: ${curWeatherBG?.base && theme.readableColor(curWeatherBG.base)};
	`}
`

const LocationAddress = styled.div`
	font-size: 0.8em;
`

const LocationSummary = styled.div`
	display: flex;
	align-items: center;
	> * {
		margin-right: 0.3em;
	}
	&& svg {
		height: 2em;
	}
`

const Footer = styled.div`
	padding: calc(var(--wnav-padding) * 0.75);
	flex: 0 0 auto;
	justify-self: flex-end;
	display: flex;
	flex-wrap: wrap;
	> * {
		flex: 1 1 auto;
		margin: 0.2em;
	}
`

const StyledTempHue = styled(TempHue)`
	padding: 0 0.2em;
`

/* -------------------------------- COMPONENT ------------------------------- */

function WeatherNav({
	map,
	modulesLoaded,
	locations,
	onLocationFound,
	getTemp,
	setIsMetric,
	isMetric,
	removeLocation,
	...props
}) {
	const { setAppDrawerContent, isMobileWindow } = useContext(Contexts.Window)

	// Update clock for all locations every minute.
	const [date, setDate] = useState(DateTime.local())
	useInterval(() => {
		const nextDate = DateTime.local()
		if (nextDate.minute !== date.minute) setDate(nextDate)
	}, 1000)

	const sortedLocations = useMemo(() => {
		let nextLocations = [...(locations ?? [])]
		nextLocations.sort((l1, l2) => {
			return l2.timeUserClicked - l1.timeUserClicked
		})
		return nextLocations
	}, [locations])

	const navContent = (
		<Root isMobileWindow={isMobileWindow} {...props}>
			<LocationSearch map={map} modulesLoaded={modulesLoaded} onLocationFound={onLocationFound} />
			<LocationsList>
				{sortedLocations.map(({ id, curWeatherBG, mapData, weatherData }) => {
					if (!mapData?.address?.formattedAddress) return null
					const temp = weatherData.currently.apparentTemperature
					return (
						<Row key={id} curWeatherBG={curWeatherBG}>
							<Location
								tag="div"
								setColor="highlight"
								onClick={() => onLocationFound(mapData)}
								curWeatherBG={curWeatherBG}
							>
								<LocationAddress className="chLimit">
									{mapData.address.formattedAddress}
								</LocationAddress>
								<LocationSummary>
									<StyledTempHue temp={temp}>{getTemp(temp)}&deg;</StyledTempHue>
									<WeatherIcon iconName={weatherData.currently.icon} />
									<div>{date.setZone(weatherData.timezone).toFormat("t")}</div>
								</LocationSummary>
							</Location>
							<Button
								svg={SvgClose}
								setTheme="red"
								setColor="primary"
								onClick={() => removeLocation(id)}
							/>
						</Row>
					)
				})}
			</LocationsList>
			<Footer>
				<Button variant="solid" onClick={() => setIsMetric((prev) => !prev)}>
					{isMetric ? "Switch to Fahrenheit" : "Switch to Celsius"}
				</Button>
			</Footer>
		</Root>
	)
	// Can't update during an existing state transition. So defer it.
	useEffect(() => setAppDrawerContent(navContent))
	return null
}

export default WeatherNav
