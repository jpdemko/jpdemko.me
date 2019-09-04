import React from 'react'

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

const weatherIconsMap = {
	'clear-day': DaySunnySVG,
	'clear-night': NightClearSVG,
	rain: RainSVG,
	snow: SnowSVG,
	sleet: SleetSVG,
	wind: StrongWindSVG,
	fog: FogSVG,
	cloudy: CloudySVG,
	'partly-cloudy-day': DayCloudySVG,
	'partly-cloudy-night': NightCloudySVG,
	hail: HailSVG,
	thunderstorm: ThunderstormSVG,
	tornado: TornadoSVG,
}

const WeatherIcon = ({ iconName = 'clear-day', ...props }) => {
	const Icon = weatherIconsMap[iconName]
	return <Icon {...props} />
}

export default WeatherIcon
