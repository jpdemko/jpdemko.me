import { sharedFlags } from './variables'
import { transparentize } from 'polished'

/**
 * Shorter/cleaner way to get the computed style values of an element.
 * @param {Element} ele Target DOM element you want to retrieve styles for.
 * @param {string} prop Style property you want to get.
 * @param {boolean} [parseValue=false] Sometimes you want an actual number w/o any units.
 * @return {string|number}
 */
export function getStyleProperty(ele, prop, parseValue = false) {
	const styleProp = window.getComputedStyle(ele).getPropertyValue(prop)
	return parseValue ? parseFloat(styleProp.match(/\d+\.?\d*/)[0]) : styleProp
}

/**
 * Basically fetch w/ some built in error handling.
 * @param {string} url
 * @return {Promise<Response>}
 */
export function simplerFetch(url) {
	return fetch(url)
		.then((res) => {
			if (!res.ok) throw Error(`bad response --> code ${res.status}`)
			return res.json()
		})
		.catch((err) => Promise.reject(err.message))
}

/**
 * Shorter/cleaner way to get the DOMRect of something, tired of lines wrapping.
 * @param {Element|string} target DOM element OR string element ID.
 * @return {DOMRect}
 */
export function getRect(target) {
	target = typeof target === 'string' ? document.getElementById(target) : target
	return target.getBoundingClientRect()
}

/**
 * This 'mixin' was created because of a Chrome bug which causes child elements to blur on 3D translation.
 * @param {string} adjustments Your desired translation values, eg: '0, -15%'
 * @return {string} The resultant browser translation, eg: 'translate3d(0, -15%, 0)'
 */
export function safeTranslate(adjustments) {
	const is3D = adjustments.split(',').length > 2
	const vars = `${adjustments}${sharedFlags.isChrome || is3D ? '' : ', 0'}`
	const translateType = `translate${!sharedFlags.isChrome || is3D ? '3d' : ''}`
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
