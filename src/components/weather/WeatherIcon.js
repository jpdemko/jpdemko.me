import React from 'react'
import { DateTime, Interval } from 'luxon'
import { desaturate, shade } from 'polished'

import { ReactComponent as TornadoSVG } from '../../shared/assets/weather-icons/wi-tornado.svg'
import { ReactComponent as ThunderstormSVG } from '../../shared/assets/weather-icons/wi-thunderstorm.svg'
import { ReactComponent as StrongWindSVG } from '../../shared/assets/weather-icons/wi-strong-wind.svg'
import { ReactComponent as SnowSVG } from '../../shared/assets/weather-icons/wi-snow.svg'
import { ReactComponent as SleetSVG } from '../../shared/assets/weather-icons/wi-sleet.svg'
import { ReactComponent as RainSVG } from '../../shared/assets/weather-icons/wi-rain.svg'
import { ReactComponent as NightCloudySVG } from '../../shared/assets/weather-icons/wi-night-cloudy.svg'
import { ReactComponent as NightClearSVG } from '../../shared/assets/weather-icons/wi-night-clear.svg'
import { ReactComponent as HailSVG } from '../../shared/assets/weather-icons/wi-hail.svg'
import { ReactComponent as FogSVG } from '../../shared/assets/weather-icons/wi-fog.svg'
import { ReactComponent as DaySunnySVG } from '../../shared/assets/weather-icons/wi-day-sunny.svg'
import { ReactComponent as DayCloudySVG } from '../../shared/assets/weather-icons/wi-day-cloudy.svg'
import { ReactComponent as CloudySVG } from '../../shared/assets/weather-icons/wi-cloudy.svg'

/* -------------------------------- COMPONENT ------------------------------- */

const iconData = {
	'clear-day': {
		svg: DaySunnySVG,
	},
	'clear-night': {
		svg: NightClearSVG,
	},
	rain: {
		svg: RainSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	snow: {
		svg: SnowSVG,
		paletteMorph: (color) => desaturate(0.3, color),
	},
	sleet: {
		svg: SleetSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	wind: {
		svg: StrongWindSVG,
	},
	fog: {
		svg: FogSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	cloudy: {
		svg: CloudySVG,
		paletteMorph: (color) => desaturate(0.3, color),
	},
	'partly-cloudy-day': {
		svg: DayCloudySVG,
		paletteMorph: (color) => desaturate(0.15, color),
	},
	'partly-cloudy-night': {
		svg: NightCloudySVG,
		paletteMorph: (color) => desaturate(0.15, color),
	},
	hail: {
		svg: HailSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	thunderstorm: {
		svg: ThunderstormSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	tornado: {
		svg: TornadoSVG,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
}

const defaultTimePalettes = {
	dawnDusk: ['#c37898', '#5d99c8'],
	day: ['#71b4e9', '#9fd6ee'],
	night: ['#36317e', '#070b34'],
}

const getAdjustedPalette = (timeOfDayColors, iconKey) => {
	const icon = iconData[iconKey]
	return timeOfDayColors.map((color) => (icon.paletteMorph ? icon.paletteMorph(color) : color))
}

export const getCurWeatherBG = (weatherData, sunData) => {
	if (!weatherData || !sunData) return

	const now = DateTime.fromSeconds(weatherData.currently.time).toLocal()
	let sun = { ...sunData }
	Object.keys(sun).forEach((key) => (sun[key] = DateTime.fromISO(sun[key]).toLocal()))

	// Create time intervals where we can tell where the weather data retrieval time falls under.
	const goldenDawn = Interval.fromDateTimes(
		sun.sunrise,
		sun.sunrise.plus(sun.sunrise.diff(sun.civil_twilight_begin)),
	)
	const goldenDusk = Interval.fromDateTimes(
		sun.sunset.minus(sun.civil_twilight_end.diff(sun.sunset)),
		sun.sunset,
	)

	const iconKey = weatherData.currently.icon
	if (goldenDawn.contains(now) || goldenDusk.contains(now)) {
		const colors = getAdjustedPalette(defaultTimePalettes['dawnDusk'], iconKey)
		return `linear-gradient(170deg, ${colors[0]} 0%, ${colors[1]} 80%)`
	} else if (goldenDusk.isBefore(now) || goldenDawn.isAfter(now)) {
		const colors = getAdjustedPalette(defaultTimePalettes['night'], iconKey)
		return `linear-gradient(15deg, ${colors[0]} 25%, ${colors[1]} 100%)`
	} else {
		const colors = getAdjustedPalette(defaultTimePalettes['day'], iconKey)
		return `linear-gradient(180deg, ${colors[0]} 15%, ${colors[1]} 100%)`
	}
}

const WeatherIcon = ({ iconName = 'clear-day', ...props }) => {
	const Icon = iconData[iconName].svg
	return <Icon {...props} />
}

export default WeatherIcon
