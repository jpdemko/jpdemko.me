import React from 'react'
import styled, { css } from 'styled-components/macro'

import WeatherIcon from './WeatherIcon'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 0;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-evenly;
	${({ curWeatherBG }) => css`
		background-image: ${curWeatherBG};
	`};
`

const Address = styled.div`
	font-size: 0.8em;
	opacity: 0.9;
`

const Summary = styled.div``

const CurrentTemps = styled.div`
	display: flex;
	align-items: center;
	font-size: 2.5em;
	line-height: 1;
	span {
		font-size: 0.25em;
		margin-left: 0.25em;
	}
	svg {
		width: 2em;
		height: 2em;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

const CurrentWeather = ({ curLocation, getTemp, ...props }) => {
	const { mapData, weatherData } = curLocation || {}
	return (
		<>
			{curLocation ? (
				<Root {...props} curWeatherBG={curLocation.curWeatherBG}>
					<div style={{ position: 'absolute', margin: '.25em', left: 0, top: 0 }}>
						<button onClick={() => console.log(curLocation)}>log location</button>
					</div>
					<Address>{mapData.address.formattedAddress}</Address>
					<Summary>{weatherData.currently.summary}</Summary>
					<CurrentTemps>
						<div style={{ display: 'flex', flexDirection: 'column' }}>
							<span>High: {getTemp(weatherData.daily.data[0].apparentTemperatureHigh)}&deg;</span>
							{getTemp(weatherData.currently.apparentTemperature)}&deg;
							<span>Low: {getTemp(weatherData.daily.data[0].apparentTemperatureLow)}&deg;</span>
						</div>
						<WeatherIcon iconName={weatherData.currently.icon} />
					</CurrentTemps>
				</Root>
			) : (
				<div>no locations</div>
			)}
		</>
	)
}

export default CurrentWeather
