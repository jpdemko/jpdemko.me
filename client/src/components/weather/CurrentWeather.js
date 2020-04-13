import React from "react"
import styled, { css } from "styled-components/macro"

import WeatherIcon from "./WeatherIcon"
import { themes } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	padding: 0.5em 1em;
	font-weight: 500;
	flex: 1 1;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	${({ theme, curWeatherBG, isLandscape }) => css`
		background-image: ${curWeatherBG ? curWeatherBG : theme.color};
		color: ${themes.dark.contrast};
		border-${isLandscape ? "right" : "bottom"}: 1px solid ${theme.accent};
	`}
	> * {
		flex: 0 0 auto;
		margin-top: 0.75rem;
	}
`

const Address = styled.div`
	font-weight: 400;
	font-size: 0.8em;
	opacity: 0.9;
`

const TextSummary = styled.div``

const LayoutSwitch = styled.div`
	display: flex;
	${({ isLandscape }) => css`
		flex-direction: ${isLandscape ? "column" : "row"};
	`}
`

const Temps = styled.div`
	line-height: 1;
	font-size: 2.5em;
	display: flex;
	flex-direction: column;
	align-items: center;
	> * {
		flex: 0 0 auto;
	}
	${({ isLandscape }) => css`
		margin-top: ${isLandscape ? ".75rem" : null};
	`}
`

const Icon = styled.div`
	height: 4em;
`

const Range = styled.div`
	font-size: 0.25em;
	margin-left: 0.2em;
	text-align: start;
`

const Info = styled.div`
	padding: 0.25em;
	text-align: center;
`

/* -------------------------------- COMPONENT ------------------------------- */

const CurrentWeather = React.memo(({ curLocation, getTemp, isLandscape, ...props }) => {
	const { mapData, weatherData } = curLocation ?? {}
	return (
		<Root {...props} curWeatherBG={curLocation?.curWeatherBG} isLandscape={isLandscape}>
			{curLocation ? (
				<>
					<Address>{mapData?.address?.formattedAddress}</Address>
					<TextSummary isLandscape={isLandscape}>{weatherData.currently.summary}</TextSummary>
					<LayoutSwitch isLandscape={isLandscape}>
						<Icon>
							<WeatherIcon iconName={weatherData.currently.icon} />
						</Icon>
						<Temps isLandscape={isLandscape}>
							<Range>H: {getTemp(weatherData.daily.data[0].apparentTemperatureHigh)}&deg;</Range>
							<div style={{ marginBottom: ".1em" }}>
								{getTemp(weatherData.currently.apparentTemperature)}&deg;
							</div>
							<Range>L: {getTemp(weatherData.daily.data[0].apparentTemperatureLow)}&deg;</Range>
						</Temps>
					</LayoutSwitch>
				</>
			) : (
				<Info>
					You don't have any locations added for weather data. Search for a location in the navigation
					menu.
				</Info>
			)}
		</Root>
	)
})

export default CurrentWeather
