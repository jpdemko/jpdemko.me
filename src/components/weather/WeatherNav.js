import React from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'
import { DateTime } from 'luxon'

import { ReactComponent as CloseCircleSVG } from '../../shared/assets/material-icons/close-circle.svg'
import { ReactComponent as MenuSVG } from '../../shared/assets/material-icons/menu.svg'
import { useInterval } from '../../shared/customHooks'
import { themes } from '../../shared/shared'
import Contexts from '../../shared/contexts'
import Button from '../ui/Button'
import LocationSearch from './LocationSearch'
import WeatherIcon from './WeatherIcon'

/* --------------------------------- STYLES --------------------------------- */

const DesktopNav = styled.div`
	flex: 1;
	${({ shown }) => css`
		display: ${shown ? 'initial' : 'none'};
	`}
`

const MobileContextButtons = styled.div`
	position: absolute;
	margin: 0.5em;
	bottom: 0;
	left: 0;
	z-index: 4000;
`

const Root = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100%;
	${({ theme, isMobileWindow }) => css`
		border-${isMobileWindow ? 'left' : 'right'}: 1px solid ${theme.mainColor};
		background-color: ${theme.mainColor};
		color: ${theme.bgContrastColor};
	`}
`

const LocationsList = styled.div`
	flex: 1 0;
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
	flex: 1;
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
	& svg {
		font-size: 1.4em;
	}
`

const Footer = styled.div`
	padding: 0.25em;
	flex: 0 0;
	justify-self: flex-end;
	display: flex;
	> * {
		flex: 1;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

const WeatherNav = ({
	map,
	modulesLoaded,
	locations,
	onLocationFound,
	getTemp,
	flipMetric,
	isMetric,
	removeLocation,
	...props
}) => {
	const isMobileSite = React.useContext(Contexts.MobileSite)
	const isMobileWindow = React.useContext(Contexts.MobileWindow)
	const { setDrawerOpened, setMobileNavContent } = React.useContext(Contexts.App)

	// Update clock for all locations every minute.
	const [date, setDate] = React.useState(DateTime.local())
	useInterval(() => {
		const nextDate = DateTime.local()
		if (nextDate.minute !== date.minute) setDate(nextDate)
	}, 1000)

	const navContent = (
		<ThemeProvider theme={themes.light}>
			<Root isMobileWindow={isMobileWindow} {...props} theme={themes.dark}>
				<LocationSearch
					map={map}
					modulesLoaded={modulesLoaded}
					onLocationFound={onLocationFound}
					locations={locations}
				/>
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
	React.useEffect(() => setMobileNavContent(navContent))

	return (
		<>
			{isMobileWindow && !isMobileSite && (
				<ThemeProvider theme={themes.blue}>
					<MobileContextButtons>
						<Button variant='fancy' onClick={() => setDrawerOpened(true)} svg={MenuSVG} />
					</MobileContextButtons>
				</ThemeProvider>
			)}
			<DesktopNav shown={!isMobileWindow}>{navContent}</DesktopNav>
		</>
	)
}

export default WeatherNav
