import * as React from "react"
import styled, { css, ThemeProvider } from "styled-components/macro"
import { DateTime } from "luxon"

import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { useInterval } from "../../shared/hooks"
import { themes, Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import LocationSearch from "./LocationSearch"
import WeatherIcon from "./WeatherIcon"

/* --------------------------------- STYLES --------------------------------- */

const DesktopNav = styled.div`
	flex: 0 0 auto;
	${({ theme }) => css`
		border-right: 1px solid ${theme.accent};
	`}
`

const Root = styled.div`
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
	&& svg {
		height: 2em;
	}
`

const Footer = styled.div`
	padding: 0.2em;
	flex: 0 0 auto;
	justify-self: flex-end;
	display: flex;
	flex-wrap: wrap;
	> * {
		flex: 1 1 auto;
		margin: 0.2em;
	}
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
	const { setAppDrawerContent, isMobileWindow } = React.useContext(Contexts.Window)

	// Update clock for all locations every minute.
	const [date, setDate] = React.useState(DateTime.local())
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
					return (
						<Row key={id} curWeatherBG={curWeatherBG}>
							<ThemeProvider theme={themes.dark}>
								<Location tag="div" onClick={() => onLocationFound(mapData)}>
									<LocationAddress>{mapData.address.formattedAddress}</LocationAddress>
									<LocationSummary>
										<span>{getTemp(weatherData.currently.apparentTemperature)}&deg;</span>
										<WeatherIcon iconName={weatherData.currently.icon} />
										<span style={{ marginLeft: ".1em" }}>
											{date.setZone(weatherData.timezone).toFormat("t")}
										</span>
									</LocationSummary>
								</Location>
							</ThemeProvider>
							<Button svg={CloseSVG} color="red" onClick={() => removeLocation(id)} />
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
	React.useEffect(() => setAppDrawerContent(navContent))

	return !isMobileWindow && <DesktopNav>{navContent}</DesktopNav>
}

export default WeatherNav
