import React from 'react'
import styled, { css } from 'styled-components/macro'

import { opac } from '../../shared/shared'
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
	width: 100%;
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	font-size: 2.5em;
	line-height: 1;
	> * {
		flex: 1 0 auto;
	}
`

const Temps = styled.div`
	display: flex;
	flex-direction: column;
	text-align: left;
	> * {
		flex: 0 0 auto;
	}
`

const Icon = styled.div`
	height: 100%;
	text-align: end;
`

const Range = styled.div`
	font-size: 0.25em;
	margin-left: 0.2em;
	text-align: start;
`

const Sepa = styled.div`
	height: 100%;
	margin: 0 0.15em 0 0.15em;
	&& {
		flex: 0 0 auto;
	}
	${({ theme }) => css`
		border-right: 2px solid ${opac(0.9, theme.bgContrastColor)};
	`}
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
						<Icon>
							<WeatherIcon iconName={weatherData.currently.icon} />
						</Icon>
						<Sepa />
						<Temps>
							<Range>High: {getTemp(weatherData.daily.data[0].apparentTemperatureHigh)}&deg;</Range>
							<div>{getTemp(weatherData.currently.apparentTemperature)}&deg;</div>
							<Range>Low: {getTemp(weatherData.daily.data[0].apparentTemperatureLow)}&deg;</Range>
						</Temps>
					</MainData>
				</>
			) : (
				<Info>No locations added, add a location from the menu/nav!</Info>
			)}
		</Root>
	)
})

export default CurrentWeather
