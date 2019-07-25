import React from 'react'

export default function Hourly() {
	function getHour(time) {
		let date = new Date(time * 1000)
		let localeTime = date.toLocaleTimeString().replace(/:\d+/g, '')
		if (localeTime.includes('AM') || localeTime.includes('PM')) {
			let [hour, tag] = localeTime.split(' ')
			return (
				<div>
					{hour}
					<span>{tag}</span>
				</div>
			)
		}
		return <div>{localeTime}</div>
	}

	return 'need to figure this out'
}
