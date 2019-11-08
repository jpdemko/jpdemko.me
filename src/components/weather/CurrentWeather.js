import React from 'react'
import styled, { css } from 'styled-components/macro'

import WeatherIcon from './WeatherIcon'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	font-weight: 500;
	flex: 1;
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
		margin-bottom: 0.5rem;
	}
`

const Address = styled.div`
	font-weight: 400;
	font-size: 0.8em;
	opacity: 0.9;
`

const MainData = styled.div`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	font-size: 2.5em;
	line-height: 1;
`

const Temps = styled.div`
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	> * {
		flex: 0 0 auto;
	}
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

const CurrentWeather = React.memo(({ curLocation, getTemp, ...props }) => {
	const { mapData, weatherData } = curLocation || {}
	return (
		<Root {...props} curWeatherBG={curLocation && curLocation.curWeatherBG}>
			{curLocation ? (
				<>
					<Address>{mapData.address.formattedAddress}</Address>
					<div>{weatherData.currently.summary}</div>
					<MainData>
						<Temps>
							<Range>High: {getTemp(weatherData.daily.data[0].apparentTemperatureHigh)}&deg;</Range>
							<div>{getTemp(weatherData.currently.apparentTemperature)}&deg;</div>
							<Range>Low: {getTemp(weatherData.daily.data[0].apparentTemperatureLow)}&deg;</Range>
						</Temps>
						<div style={{ flex: '1 0 auto', height: '100%' }}>
							<WeatherIcon iconName={weatherData.currently.icon} />
						</div>
					</MainData>
				</>
			) : (
				<Info>No locations added, add a location from the menu/nav!</Info>
			)}
		</Root>
	)
})

export default CurrentWeather
