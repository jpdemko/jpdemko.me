import * as React from "react"
import { transparentize, readableColor } from "polished"
import { parse, stringify } from "flatted"

import { ReactComponent as WrenchSVG } from "../shared/assets/icons/wrench.svg"

/* -------------------------------------------------------------------------- */

export const flags = {
	isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
	// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
	// This flag is used to disable 3D transforms in Chrome.
	isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
}

/* -------------------------------------------------------------------------- */

export const Contexts = {
	TabHidden: React.createContext(),
	Window: React.createContext(),
	Auth: React.createContext(),
	IsMobileWindow: React.createContext(),
	Themes: React.createContext(),
}

/* -------------------------------------------------------------------------- */

export let themes = localStorage.getItem("allThemes")
themes = themes
	? JSON.parse(themes)
	: {
			light: {
				name: "light",
				background: "#F5F8FA",
				altBackground: "#DFE2E4",
				contrast: "#15202B",
				readableColor: (bgColor) => readableColor(bgColor, "#15202B", "#F5F8FA"),
				highlight: "#DB1A4A",
				color: "#F5F8FA",
				accent: "#2A343E",
			},
			dark: {
				name: "dark",
				background: "#15202B",
				altBackground: "#2A343E",
				contrast: "#F5F8FA",
				readableColor: (bgColor) => readableColor(bgColor, "#15202B", "#F5F8FA"),
				highlight: "#1DA1F2",
				color: "#15202B",
				accent: "#DFE2E4",
			},
			blue: {
				name: "blue",
				background: "#061E2C",
				altBackground: "#082C42",
				contrast: "#F5F8FA",
				readableColor: (bgColor) => readableColor(bgColor, "#061E2C", "#F5F8FA"),
				highlight: "#1DA1F2",
				color: "#1DA1F2",
				accent: "#1884C7",
			},
			red: {
				name: "red",
				altBackground: "#E2DEDF",
				background: "#F9F4F6",
				contrast: "#3C0815",
				readableColor: (bgColor) => readableColor(bgColor, "#F9F4F6", "#3C0815"),
				highlight: "#DB1A4A",
				color: "#DB1A4A",
				accent: "#B4163D",
			},
	  }

/* -------------------------------------------------------------------------- */

export const mediaBreakpoints = { desktop: 813 }

/* -------------------------------------------------------------------------- */

export const ls = {
	get: function (key, skipParse = false) {
		try {
			if (typeof key !== "string") key = stringify(key)
			let item = localStorage.getItem(key)
			if (item && !skipParse) item = parse(item)
			return item
		} catch (error) {
			console.error(error)
			return null
		}
	},
	set: function (key, value) {
		try {
			if (typeof key !== "string") key = stringify(key)
			if (typeof value !== "string") value = stringify(value)
			localStorage.setItem(key, value)
		} catch (error) {
			console.error(error)
			return null
		}
	},
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

/**
 * @param {string} name
 * @param {Object} theme
 * @param {string} theme.background Should be very light/dark.
 * @param {string} theme.altBackground Slight offset of regular background.
 * @param {string} theme.contrast Text color readable on both backgrounds.
 * @param {Array<string>} theme.contrastColors [dark color for light bg, light color for dark bg].
 * @param {string} theme.highlight Color used to highlight/emphasis text (contrast).
 * @param {string} theme.color The primary color of the theme.
 * @param {string} theme.accent Slight offset of primary theme color.
 */
export function createTheme(name, theme) {
	const [lightRet, darkRet] = theme.contrastColors
	themes[name] = {
		name,
		readableColor: (bgColor) => readableColor(bgColor, lightRet, darkRet),
		...theme,
	}
	return themes[name]
}

/* -------------------------------------------------------------------------- */

export class Styles {
	/**
	 * @param {Element} ele Target DOM element you want to retrieve styles for.
	 */
	constructor(ele) {
		this.numParseRegex = /-?(,\d+|\d+)*\.?\d+/g
		this.ele = window.getComputedStyle(ele)
	}

	/**
	 * Condensed way to get the computed style values of an element.
	 * @param {string} attr Style property you want to get.
	 * @param {boolean} [parse=true] Convert string|string[] into floats and return.
	 * @return {Array|null}
	 */
	get(attr, parse = true) {
		try {
			let style = this.ele.getPropertyValue(attr)
			if (parse) {
				style = style.match(this.numParseRegex)
				style = style.map(parseFloat)
			}
			return Array.isArray(style) ? style : [style]
		} catch (err) {
			console.error(err)
			return null
		}
	}
}

/* -------------------------------------------------------------------------- */

/**
 * Condensed way to get the DOMRect of something.
 * @param {Element|string} target DOM element OR string element ID, eg: 'target' (no #)
 * @return {DOMRect|Object}
 */
export function getRect(target) {
	target = typeof target === "string" ? document.getElementById(target) : target
	return target ? target.getBoundingClientRect() : {}
}

/* -------------------------------------------------------------------------- */

/**
 * This 'mixin' was created because of a Chrome bug which causes child elements to blur on 3D translation.
 * @param {string} adjustments Your desired translation values, eg: '0, -15%'
 * @return {string} The resultant browser translation, eg: 'translate3d(0, -15%, 0)'
 */
export function safeTranslate(adjustments) {
	const is3D = adjustments.split(",").length > 2
	const vars = `${adjustments}${flags.isChrome || is3D ? "" : ", 0"}`
	const translateType = `translate${!flags.isChrome || is3D ? "3d" : ""}`
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
