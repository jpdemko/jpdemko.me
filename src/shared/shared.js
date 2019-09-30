import { mix, transparentize } from 'polished'

export const flags = {
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
		gradient: 'linear-gradient(45deg, #333 20%, #666 85%)',
	},
	light: {
		mainColor: '#f9f9f9',
		altColor: '#e0e0e0',
		gradient: 'linear-gradient(45deg, #f9f9f9 20%, #e0e0e0 85%)',
	},
	blue: {
		mainColor: '#1976d2',
		altColor: '#21CBF3',
		gradient: 'linear-gradient(45deg, #1976d2 20%, #21CBF3 85%)',
	},
	red: {
		mainColor: '#e10050',
		altColor: '#FF8E53',
		gradient: 'linear-gradient(45deg, #e10050 20%, #FF8E53 85%)',
	},
}

// Adding mixed main/alt color, and background safe text depending on the color.
Object.keys(themes).forEach((key) => {
	themes[key].mixedColor = mix(0.5, themes[key].mainColor, themes[key].altColor)
	themes[key].bgContrastColor = key !== 'light' ? themes.light.mainColor : themes.dark.mainColor
})

export const mediaBreakpoints = { desktop: 768 }

/**
 * Condensed way to get the computed style values of an element.
 * @param {Element} ele - target DOM element you want to retrieve styles for
 * @param {string} prop - style property you want to get
 * @param {boolean} [parseValue=false] - sometimes you want an actual number w/o any units
 * @return {string|number}
 */
export function getStyleProperty(ele, prop, parseValue = false) {
	const styleProp = window.getComputedStyle(ele).getPropertyValue(prop)
	return parseValue ? parseFloat(styleProp.match(/\d+\.?\d*/)[0]) : styleProp
}

/**
 * Fetch w/ some built in error handling.
 * @param {string} url
 * @return {Promise<Response>}
 */
export function simplerFetch(url) {
	return fetch(url)
		.then((res) => {
			if (!res.ok) throw Error(`bad response --> code ${res.status}`)
			return res.json()
		})
		.catch((err) => {
			console.log(err.message)
			Promise.reject(err.message)
		})
}

/**
 * Condensed way to get the DOMRect of something.
 * @param {Element|string} target - DOM element OR string element ID
 * @return {DOMRect}
 */
export function getRect(target) {
	target = typeof target === 'string' ? document.getElementById(target) : target
	return target.getBoundingClientRect()
}

/**
 * This 'mixin' was created because of a Chrome bug which causes child elements to blur on 3D translation.
 * @param {string} adjustments - your desired translation values, eg: '0, -15%'
 * @return {string} - the resultant browser translation, eg: 'translate3d(0, -15%, 0)'
 */
export function safeTranslate(adjustments) {
	const is3D = adjustments.split(',').length > 2
	const vars = `${adjustments}${flags.isChrome || is3D ? '' : ', 0'}`
	const translateType = `translate${!flags.isChrome || is3D ? '3d' : ''}`
	return `${translateType}(${vars})`
}

const maxDoubleClickTime = 500
let lastTouch = {
	target: null,
	time: 0,
}

// TODO - Figure out how to use jsdocs w/ React. (e: SyntheticEvent)
export function isDoubleTouch(e) {
	const curTouch = {
		target: e.currentTarget,
		time: new Date().getTime(),
	}
	const isDoubleTouch =
		lastTouch.target === curTouch.target && curTouch.time - lastTouch.time <= maxDoubleClickTime

	lastTouch = curTouch
	return isDoubleTouch
}

/**
 * I keep using polished.js 'transparentize()' wrong thinking I'm setting the opacity rather than it actually
 * subtracting the amount from the color. Just quicker to reason about when it works like normal CSS opacity.
 * @param {string|number} opacityAmount
 * @param {string} color
 */
export function opac(opacityAmount, color) {
	return transparentize(1 - opacityAmount, color)
}
