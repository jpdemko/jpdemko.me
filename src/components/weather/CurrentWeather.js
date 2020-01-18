import React from 'react'
import styled, { css } from 'styled-components/macro'

import WeatherIcon from './WeatherIcon'

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
	${({ theme, curWeatherBG }) => css`
		background-image: ${curWeatherBG ? curWeatherBG : theme.gradient};
	`}
	> * {
		flex: 0 0 auto;
	}
`

const Address = styled.div`
	font-weight: 400;
	font-size: 0.8em;
	opacity: 0.9;
`

const TextSummary = styled.div`
	${({ isLandscape }) => css`
		margin: 0.25em 0 ${isLandscape ? '.25em' : '.5em'};
	`}
`

const LayoutSwitch = styled.div`
	display: flex;
	${({ isLandscape }) => css`
		flex-direction: ${isLandscape ? 'column' : 'row'};
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
	// if (weatherData)
	// 	console.log(
	// 		weatherData.daily.data[0].apparentTemperatureLow,
	// 		Math.round(weatherData.daily.data[0].apparentTemperatureLow),
	// 		getTemp(weatherData.daily.data[0].apparentTemperatureLow),
	// 	)
	return (
		<Root {...props} curWeatherBG={curLocation?.curWeatherBG}>
			{curLocation ? (
				<>
					<Address>{mapData.address.formattedAddress}</Address>
					<TextSummary isLandscape={isLandscape}>{weatherData.currently.summary}</TextSummary>
					<LayoutSwitch isLandscape={isLandscape}>
						<Icon>
							<WeatherIcon iconName={weatherData.currently.icon} />
						</Icon>
						<Temps>
							<Range>H: {getTemp(weatherData.daily.data[0].apparentTemperatureHigh)}&deg;</Range>
							<div style={{ marginBottom: '.1em' }}>
								{getTemp(weatherData.currently.apparentTemperature)}&deg;
							</div>
							<Range>L: {getTemp(weatherData.daily.data[0].apparentTemperatureLow)}&deg;</Range>
						</Temps>
					</LayoutSwitch>
				</>
			) : (
				<Info>
					You don't have any locations added for weather data. Search for a location in the navigation menu.
				</Info>
			)}
		</Root>
	)
})

export default CurrentWeather
