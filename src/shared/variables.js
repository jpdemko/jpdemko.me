import { linearGradient, mix } from 'polished'

export const sharedFlags = {
	isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
	// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
	// This is a flag to disable 3D transforms in Chrome.
	// isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
	isChrome: false,
}

export let themes = {
	dark: {
		mainColor: '#333',
		altColor: '#666',
	},
	light: {
		mainColor: '#f9f9f9',
		altColor: '#e0e0e0',
	},
	blue: {
		mainColor: '#1976d2',
		altColor: '#21CBF3',
	},
	red: {
		mainColor: '#e10050',
		altColor: '#FF8E53',
	},
}

// Adding gradients, mixed main/alt color, and background safe text depending on the color.
Object.keys(themes).forEach((key) => {
	themes[key].gradient = linearGradient({
		colorStops: [`${themes[key].mainColor} 20%`, `${themes[key].altColor} 85%`],
		toDirection: 'to top right',
		fallback: `${themes[key].mainColor}`,
	})
	themes[key].mixedColor = mix(0.5, themes[key].mainColor, themes[key].altColor)
	themes[key].bgContrastColor = key !== 'light' ? themes.light.mainColor : themes.dark.mainColor
})

export const mediaBreakpoints = { desktop: 768 }
