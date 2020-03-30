import { mix, transparentize } from 'polished'

import { ReactComponent as WrenchSVG } from '../shared/assets/icons/wrench.svg'
import { themes, flags } from './constants'

/* -------------------------------------------------------------------------- */

export function addTheme(themeName, vars) {
	vars.mixedColor = mix(0.5, vars.mainColor, vars.altColor)
	vars.contrastColor = themeName !== 'light' ? themes.light.mainColor : themes.dark.mainColor
	vars.contrastTheme = themeName !== 'light' ? themes.light : themes.dark
	themes[themeName] = vars
	return themes[themeName]
}

/* -------------------------------------------------------------------------- */

/**
 * Mainly for getting intellisense on what options there when setting up each app's shared field.
 * Also used for testing when I need some default app options.
 * @param {Object} options
 * @param {string} options.title
 * @param {React.FunctionComponent<React.SVGProps<SVGSVGElement>>} options.logo
 * @param {Object} options.theme
 * @param {boolean} options.authRequired
 * @return {Object}
 */
export function setupAppSharedOptions(options = {}) {
	return {
		title: `Gen. Title#${Math.round(new Date().getTime() / 1000000 + Math.random() * 100)}`,
		logo: WrenchSVG,
		theme: themes.blue,
		authRequired: false,
		...options,
	}
}

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

/* -------------------------------------------------------------------------- */

export const ls = {
	get: function(key, parse = true) {
		try {
			if (typeof key !== 'string') key = JSON.stringify(key)
			let item = localStorage.getItem(key)
			if (item && parse) item = JSON.parse(item)
			return item
		} catch (error) {
			// console.log('localstorage error: ', error)
			return null
		}
	},
	set: function(key, value) {
		try {
			if (typeof key !== 'string') key = JSON.stringify(key)
			if (typeof value !== 'string') value = JSON.stringify(value)
			// console.log('ls store item as: ', value)
			localStorage.setItem(key, value)
		} catch (error) {
			// console.log('localstorage error: ', error)
			return null
		}
	},
}
