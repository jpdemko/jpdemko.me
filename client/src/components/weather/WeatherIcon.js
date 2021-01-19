import React from "react"
import { DateTime, Interval } from "luxon"
import { desaturate, shade } from "polished"

import { ReactComponent as SvgTornado } from "../../shared/assets/weather-icons/wi-tornado.svg"
import { ReactComponent as SvgThunderstorm } from "../../shared/assets/weather-icons/wi-thunderstorm.svg"
import { ReactComponent as SvgStrongWind } from "../../shared/assets/weather-icons/wi-strong-wind.svg"
import { ReactComponent as SvgSnow } from "../../shared/assets/weather-icons/wi-snow.svg"
import { ReactComponent as SvgSleet } from "../../shared/assets/weather-icons/wi-sleet.svg"
import { ReactComponent as SvgRain } from "../../shared/assets/weather-icons/wi-rain.svg"
import { ReactComponent as SvgNightCloudy } from "../../shared/assets/weather-icons/wi-night-cloudy.svg"
import { ReactComponent as SvgNightClear } from "../../shared/assets/weather-icons/wi-night-clear.svg"
import { ReactComponent as SvgHail } from "../../shared/assets/weather-icons/wi-hail.svg"
import { ReactComponent as SvgFog } from "../../shared/assets/weather-icons/wi-fog.svg"
import { ReactComponent as SvgDaySunny } from "../../shared/assets/weather-icons/wi-day-sunny.svg"
import { ReactComponent as SvgDayCloudy } from "../../shared/assets/weather-icons/wi-day-cloudy.svg"
import { ReactComponent as SvgCloudy } from "../../shared/assets/weather-icons/wi-cloudy.svg"

/* -------------------------------- COMPONENT ------------------------------- */

const iconData = {
	"clear-day": {
		svg: SvgDaySunny,
	},
	"clear-night": {
		svg: SvgNightClear,
	},
	rain: {
		svg: SvgRain,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	snow: {
		svg: SvgSnow,
		paletteMorph: (color) => desaturate(0.3, color),
	},
	sleet: {
		svg: SvgSleet,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	wind: {
		svg: SvgStrongWind,
	},
	fog: {
		svg: SvgFog,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	cloudy: {
		svg: SvgCloudy,
		paletteMorph: (color) => desaturate(0.3, color),
	},
	"partly-cloudy-day": {
		svg: SvgDayCloudy,
		paletteMorph: (color) => desaturate(0.15, color),
	},
	"partly-cloudy-night": {
		svg: SvgNightCloudy,
		paletteMorph: (color) => desaturate(0.15, color),
	},
	hail: {
		svg: SvgHail,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	thunderstorm: {
		svg: SvgThunderstorm,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
	tornado: {
		svg: SvgTornado,
		paletteMorph: (color) => shade(0.15, desaturate(0.3, color)),
	},
}

const defaultTimePalettes = {
	dawnDusk: ["#c37898", "#5d99c8"],
	day: ["#71b4e9", "#9fd6ee"],
	night: ["#36317e", "#070b34"],
}

function getAdjustedPalette(timeOfDayColors, iconKey) {
	const icon = iconData[iconKey]
	return timeOfDayColors.map((color) => (icon.paletteMorph ? icon.paletteMorph(color) : color))
}

export function getCurWeatherBG(weatherData, sunData) {
	if (!weatherData || !sunData) return

	const now = DateTime.fromSeconds(weatherData.currently.time).toLocal()
	let sun = { ...sunData }
	Object.keys(sun).forEach((key) => (sun[key] = DateTime.fromISO(sun[key]).toLocal()))

	// Create time intervals where we can tell where the weather data retrieval time falls under.
	const goldenDawn = Interval.fromDateTimes(
		sun.sunrise,
		sun.sunrise.plus(sun.sunrise.diff(sun.civil_twilight_begin))
	)
	const goldenDusk = Interval.fromDateTimes(
		sun.sunset.minus(sun.civil_twilight_end.diff(sun.sunset)),
		sun.sunset
	)

	const iconKey = weatherData.currently.icon
	if (goldenDawn.contains(now) || goldenDusk.contains(now)) {
		const colors = getAdjustedPalette(defaultTimePalettes["dawnDusk"], iconKey)
		return {
			gradient: `linear-gradient(170deg, ${colors[0]} 0%, ${colors[1]} 80%)`,
			base: colors[0],
		}
	} else if (goldenDusk.isBefore(now) || goldenDawn.isAfter(now)) {
		const colors = getAdjustedPalette(defaultTimePalettes["night"], iconKey)
		return {
			gradient: `linear-gradient(15deg, ${colors[0]} 25%, ${colors[1]} 100%)`,
			base: colors[0],
		}
	} else {
		const colors = getAdjustedPalette(defaultTimePalettes["day"], iconKey)
		return {
			gradient: `linear-gradient(180deg, ${colors[0]} 15%, ${colors[1]} 100%)`,
			base: colors[0],
		}
	}
}

function WeatherIcon({ iconName = "clear-day", ...props }) {
	const Icon = iconData[iconName].svg
	return <Icon {...props} />
}

export default WeatherIcon
