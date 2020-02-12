import React from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime } from 'luxon'

import { ReactComponent as CloseCircleSVG } from '../../shared/assets/material-icons/close-circle.svg'
import { useInterval } from '../../shared/customHooks'
import { themes, Contexts } from '../../shared/shared'
import Button from '../ui/Button'
import LocationSearch from './LocationSearch'
import WeatherIcon from './WeatherIcon'

/* --------------------------------- STYLES --------------------------------- */

const DesktopNav = styled.div`
	flex: 1 1 auto;
`

const Root = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100%;
	${({ theme, isMobileWindow }) => css`
		border-${isMobileWindow ? 'left' : 'right'}: 2px solid ${theme.mixedColor};
		background-color: ${theme.mainColor};
		color: ${theme.contrastColor};
	`}
	&& svg {
		height: 1.5em;
	}
`

const LocationsList = styled.div`
	flex: 1 1 auto;
	overflow-y: auto;
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
	flipMetric,
	isMetric,
	removeLocation,
	...props
}) {
	const isMobileWindow = React.useContext(Contexts.IsMobileWindow)
	const { setNavContentCallback } = React.useContext(Contexts.AppNav)

	// Update clock for all locations every minute.
	const [date, setDate] = React.useState(DateTime.local())
	useInterval(() => {
		const nextDate = DateTime.local()
		if (nextDate.minute !== date.minute) setDate(nextDate)
	}, 1000)

	const navContent = (
		<ThemeProvider theme={themes.light}>
			<Root isMobileWindow={isMobileWindow} {...props} theme={themes.dark}>
				<LocationSearch map={map} modulesLoaded={modulesLoaded} onLocationFound={onLocationFound} />
				<LocationsList>
					{locations.map(({ id, curWeatherBG, mapData, weatherData }) => (
						<Row key={id} curWeatherBG={curWeatherBG}>
							<Location tag='div' onClick={() => onLocationFound(mapData)}>
								<LocationAddress>{mapData.address.formattedAddress}</LocationAddress>
								<LocationSummary>
									<span>{getTemp(weatherData.currently.apparentTemperature)}&deg;</span>
									<WeatherIcon iconName={weatherData.currently.icon} />
									<span style={{ marginLeft: '.1em' }}>
										{date.setZone(weatherData.timezone).toFormat('t')}
									</span>
								</LocationSummary>
							</Location>
							<Button svg={CloseCircleSVG} onClick={() => removeLocation(id)}></Button>
						</Row>
					))}
				</LocationsList>
				<Footer>
					<Button variant='fancy' theme={themes.blue} onClick={flipMetric}>
						{isMetric ? 'Switch to Fahrenheit' : 'Switch to Celsius'}
					</Button>
				</Footer>
			</Root>
		</ThemeProvider>
	)
	React.useEffect(() => setNavContentCallback(navContent))

	return !isMobileWindow && <DesktopNav>{navContent}</DesktopNav>
}

export default WeatherNav
