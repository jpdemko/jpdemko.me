import { memo } from "react"
import styled, { css } from "styled-components/macro"

import WeatherIcon from "./WeatherIcon"
import TempHue from "./TempHue"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	font-size: 1.2em;
	padding: 0.5em;
	font-weight: bold;
	flex: 1 0 12ch;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	${({ theme, curWeatherBG, isLandscape }) => css`
		background-image: ${curWeatherBG ? curWeatherBG.gradient : theme.background};
		color: ${curWeatherBG ? theme.readableColor(curWeatherBG.base) : theme.bgContrast};
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
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`

const TextSummary = styled.div`
	font-weight: bold;
`

const LayoutSwitch = styled.div`
	display: flex;
	align-items: center;
`

const Temps = styled.div`
	line-height: 1;
	font-size: 2.5em;
	display: flex;
	flex-direction: column;
	padding-left: 0.15em;
	margin-left: 0.15em;
	> * {
		flex: 0 0 auto;
	}
	${({ theme, curWeatherBG }) => css`
		border-left: 1px solid ${curWeatherBG ? theme.readableColor(curWeatherBG.base) : theme.primaryContrast};
	`}
`

const StyledTempHue = styled(TempHue)`
	font-size: 0.25em;
`

const Icon = styled.div`
	height: 4em;
	svg {
		height: 100%;
	}
`

const Info = styled.div`
	padding: 0.25em;
	text-align: center;
`

/* -------------------------------- COMPONENT ------------------------------- */

const CurrentWeather = memo(({ curLocation, getTemp, isLandscape, ...props }) => {
	const { mapData, weatherData } = curLocation ?? {}

	const high = weatherData && weatherData.daily.data[0].apparentTemperatureHigh
	const low = weatherData && weatherData.daily.data[0].apparentTemperatureLow

	return (
		<Root {...props} curWeatherBG={curLocation?.curWeatherBG} isLandscape={isLandscape}>
			{curLocation ? (
				<>
					<Address>{mapData?.address?.formattedAddress}</Address>
					<TextSummary>{weatherData.currently.summary}</TextSummary>
					<LayoutSwitch>
						<Icon>
							<WeatherIcon iconName={weatherData.currently.icon} />
						</Icon>
						<Temps curWeatherBG={curLocation?.curWeatherBG}>
							<StyledTempHue temp={high}>H: {getTemp(high)}&deg;</StyledTempHue>
							<div>{getTemp(weatherData.currently.apparentTemperature)}&deg;</div>
							<StyledTempHue temp={low}>L: {getTemp(low)}&deg;</StyledTempHue>
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
