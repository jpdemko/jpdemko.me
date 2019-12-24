import React from 'react'
import { mix, transparentize } from 'polished'

/* -------------------------------------------------------------------------- */

export const flags = {
	isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
	// Might be fixed in newer versions of Chrome?
	// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
	// This is a flag to disable 3D transforms in Chrome.
	// isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
	isChrome: false,
}

/* -------------------------------------------------------------------------- */

export const Contexts = {
	AppNav: React.createContext(),
	IsMobileWindow: React.createContext(),
	IsMobileSite: React.createContext(),
}

/* -------------------------------------------------------------------------- */

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
	themes[key].contrastColor = key !== 'light' ? themes.light.mainColor : themes.dark.mainColor
	themes[key].contrastTheme = key !== 'light' ? themes.light : themes.dark
})

export const mediaBreakpoints = { desktop: 813 }

/* -------------------------------------------------------------------------- */

const regexGetNums = /-?(,\d+|\d+)*\.?\d+/g

/**
 * Condensed way to get the computed style values of an element.
 * @param {Element} ele - target DOM element you want to retrieve styles for
 * @param {string} prop - style property you want to get
 * @param {Object} [options]
 * @param {RegExp} [options.regex] - pass in custom regex on style prop
 * @param {boolean} [options.parse] - convert string|string[] into floats and return
 * @return {Array|undefined}
 */
export function getStyleProperty(ele, prop, options) {
	try {
		let style = window.getComputedStyle(ele).getPropertyValue(prop)
		if (options?.regex) style = style.match(options.regex)
		if (options?.parse) {
			if (!Array.isArray(style)) style = style.match(regexGetNums)
			style = style.map?.(parseFloat)
		}
		return Array.isArray(style) ? style : [style]
	} catch (err) {
		console.log(err)
		return undefined
	}
}

/* -------------------------------------------------------------------------- */

const corsProxies = ['https://cors-anywhere.herokuapp.com/', 'https://crossorigin.me/']
let curProxyIdx = 0

/**
 * Fetch w/ some built in error handling & optional CORS proxy usage.
 * @param {string} url
 * @param {boolean} [useProxy=false]
 * @return {Promise<Response>}
 */
export function simplerFetch(url, useProxy = false) {
	const genURL = useProxy && curProxyIdx < corsProxies.length ? corsProxies[curProxyIdx] + url : url
	return fetch(genURL)
		.then((res) => {
			if (!res.ok) throw Error(`bad response --> code ${res.status}`)
			return res.json()
		})
		.catch((err) => {
			console.log(err)
			if (curProxyIdx++ < corsProxies.length) return simplerFetch(url, useProxy)
			Promise.reject(err)
		})
}

/* -------------------------------------------------------------------------- */

/**
 * Condensed way to get the DOMRect of something.
 * @param {Element|string} target - DOM element OR string element ID, eg: 'target' (no #)
 * @return {DOMRect|Object}
 */
export function getRect(target) {
	target = typeof target === 'string' ? document.getElementById(target) : target
	return target ? target.getBoundingClientRect() : {}
}

/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */

const maxDoubleClickTime = 500
let lastTouch = {
	target: null,
	time: 0,
}

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

/* -------------------------------------------------------------------------- */

/**
 * I keep using polished.js 'transparentize()' wrong thinking I'm setting the opacity rather than it actually
 * subtracting the amount from the color. Just quicker to reason about when it works like normal CSS opacity.
 * @param {string|number} opacityAmount
 * @param {string} color
 */
export function opac(opacityAmount, color) {
	return transparentize(1 - opacityAmount, color)
}
