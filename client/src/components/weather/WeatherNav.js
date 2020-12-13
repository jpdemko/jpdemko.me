import { useState, useEffect, useContext } from "react"
import styled, { css } from "styled-components/macro"
import { DateTime } from "luxon"

import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { useInterval } from "../../shared/hooks"
import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import LocationSearch from "./LocationSearch"
import WeatherIcon from "./WeatherIcon"
import TempHue from "./TempHue"

/* --------------------------------- STYLES --------------------------------- */

const DesktopNav = styled.div`
	flex: 0 0 auto;
	${({ theme }) => css`
		border-right: 1px solid ${theme.accent};
	`}
`

const Root = styled.div`
	--wnav-padding: 0.5em;
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100%;
	${({ theme }) => css`
		background-color: ${theme.altBackground};
	`}
	&& svg {
		height: 1.5em;
	}
`

const LocationsList = styled.div`
	flex: 1 1 auto;
	overflow-y: auto;
	${({ theme }) => css`
		> * {
			border-bottom: 1px solid ${theme.background};
		}
	`}
`

const Row = styled.div`
	display: flex;
	${({ curWeatherBG }) => css`
		background-image: ${curWeatherBG};
	`}
`

const Location = styled(Button)`
	padding-top: 0.5em;
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	white-space: nowrap;
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

	const navContent = (
		<Root isMobileWindow={isMobileWindow} {...props}>
			<LocationSearch map={map} modulesLoaded={modulesLoaded} onLocationFound={onLocationFound} />
			<LocationsList>
				{locations.map(({ id, curWeatherBG, mapData, weatherData }) => {
					if (!mapData?.address?.formattedAddress) return null
					const temp = weatherData.currently.apparentTemperature
					return (
						<Row key={id} curWeatherBG={curWeatherBG}>
							<Location tag="div" color="primaryContrast" onClick={() => onLocationFound(mapData)}>
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
								svg={CloseSVG}
								setTheme="red"
								color="primary"
								onClick={() => removeLocation(id)}
							/>
						</Row>
					)
				})}
			</LocationsList>
			<Footer>
				<Button variant="fancy" onClick={() => setIsMetric((prev) => !prev)}>
					{isMetric ? "Switch to Fahrenheit" : "Switch to Celsius"}
				</Button>
			</Footer>
		</Root>
	)
	// Can't update during an existing state transition. So defer it.
	useEffect(() => setAppDrawerContent(navContent))

	return !isMobileWindow && <DesktopNav>{navContent}</DesktopNav>
}

export default WeatherNav
