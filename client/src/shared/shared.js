// eslint-disable-next-line no-unused-vars
import { createContext, FunctionComponent, SVGProps } from "react"
import { transparentize, readableColor, getLuminance } from "polished"
import { parse, stringify } from "flatted"

import { ReactComponent as SvgWrench } from "../shared/assets/material-icons/wrench.svg"

/* -------------------------------------------------------------------------- */

export const ls = {
	get: function (key, skipParse = false) {
		try {
			if (typeof key !== "string") key = stringify(key)
			let item = localStorage.getItem(key)
			if (item && !skipParse) item = parse(item)
			return item
		} catch (error) {
			console.error(`ls.get(${key}) error: `, error)
			return null
		}
	},
	set: function (key, value) {
		try {
			if (typeof key !== "string") key = stringify(key)
			if (typeof value !== "string") value = stringify(value)
			localStorage.setItem(key, value)
		} catch (error) {
			console.error("ls.set() error: ", error)
			return null
		}
	},
}

/* -------------------------------------------------------------------------- */

export const flags = {
	// isIE: /*@cc_on!@*/ false || !!document.documentMode,
	isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
	// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
	// This flag is used to disable 3D transforms in Chrome.
	isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
	isMobile: /Mobi/i.test(navigator.userAgent) || /Android/i.test(navigator.userAgent),
}

/* -------------------------------------------------------------------------- */

export const Contexts = {
	PortfolioOS: createContext(),
	Window: createContext(),
	Auth: createContext(),
	Themes: createContext(),
}

/* -------------------------------------------------------------------------- */

const baseThemes = {
	light: {
		name: "light",
		primary: "#F5F8FA",
		primaryContrast: "#1C2B36",
		background: "#F5F8FA",
		bgContrast: "#1C2B36",
		altBackground: "#E4EBF1",
		highlight: "#3BA4FF",
		accent: "#9abfe0",
	},
	dark: {
		name: "dark",
		primary: "#222121",
		primaryContrast: "#FAF5F5",
		background: "#222121",
		bgContrast: "#FAF5F5",
		altBackground: "#343232",
		highlight: "#CA3131",
		accent: "#654141",
	},
	blue: {
		name: "blue",
		primary: "#1DA1F2",
		primaryContrast: "#F5F8FA",
		background: "#061E2C",
		bgContrast: "#F5F8FA",
		altBackground: "#082C42",
		highlight: "#1DA1F2",
		accent: "#007CC9",
	},
	red: {
		name: "red",
		primary: "#DB1A4A",
		primaryContrast: "#F9F4F6",
		altBackground: "#F1E5E9",
		bgContrast: "#3C0815",
		background: "#F9F4F6",
		highlight: "#DB1A4A",
		accent: "#AE1C41",
	},
}

/**
 * Returns either the darkest/lightest color from the theme this is called from with respect to
 * the passed background color. A passed dark color will return the theme's lightest color.
 * @callback ThemeReadableColor
 * @param {string} bgColor Color of the background you're trying to get a readable color from.
 * @returns {string}
 */

/**
 * @typedef {Object} Theme
 * @property {string} name
 * @property {string} background Should be very light or dark.
 * @property {string} altBackground Slight offset of the regular background.
 * @property {string} bgContrast Text color readable on both backgrounds.
 * @property {string} highlight Color used to highlight/emphasis text.
 * @property {string} primary The primary color of the theme.
 * @property {string} primaryContrast Text color readable on the main theme's color.
 * @property {string} accent Slight offset of primary theme color.
 * @property {ThemeReadableColor} [readableColor]
 */

/**
 * @param {Theme} theme
 * @returns {Theme}
 */
function createTheme(theme) {
	let sortedLumin = Object.entries(theme)
		.map(([name, hex]) => (typeof hex === "string" && hex.includes("#") ? [name, getLuminance(hex)] : null))
		.filter((arr) => arr !== null)
		.sort(([, lumi1], [, lumi2]) => (lumi1 > lumi2 ? 1 : lumi1 < lumi2 ? -1 : 0))
	const darkKV = sortedLumin.shift()
	const lightKV = sortedLumin.pop()
	return {
		...theme,
		readableColor: (bgColor) => readableColor(bgColor, theme?.[darkKV?.[0]], theme?.[lightKV?.[0]], false),
	}
}

/**
 * @typedef {Object.<string, Theme} Themes
 */
export var themes = Object.keys(baseThemes).reduce((acc, tName) => {
	acc[tName] = createTheme(baseThemes[tName])
	return acc
}, {})

/**
 * @param {Theme} t
 */
function addTheme(t = {}) {
	if (t?.name) {
		if (themes[t.name]) return themes[t.name]
		else if (Object.keys(t)?.length > 0) {
			themes[t.name] = createTheme(t)
			return themes[t.name]
		}
	}
	return themes.blue
}

/**
 * Mainly for getting intellisense on what options there when setting up each app's shared field.
 * Also used for testing when I need some default app options.
 * @param {Object} options
 * @param {string} options.title
 * @param {FunctionComponent<SVGProps<SVGSVGElement>>} options.logo
 * @param {Theme} options.theme
 * @param {boolean} options.authRequired
 * @param {string} options.authReasoning
 * @return {Object}
 */
export function setupAppSharedOptions(options = {}) {
	if (options?.theme) options.theme = addTheme(options.theme)
	options = {
		title: `Gen. Title#${Math.round(new Date().getTime() / 1000000 + Math.random() * 100)}`,
		logo: SvgWrench,
		theme: themes.blue,
		authRequired: false,
		authReasoning: "",
		...options,
	}
	return options
}

/* -------------------------------------------------------------------------- */

export const mediaBreakpoints = { desktop: 813 }

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
		} catch (error) {
			console.error("Styles.get() error: ", error)
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
	try {
		return transparentize(1 - opacityAmount, color)
	} catch (error) {
		console.error(`opac(${opacityAmount}, ${color}) error: `, error)
		return "#0000"
	}
}

/* -------------------------------------------------------------------------- */

// const DEBUG_ENABLED = process.env.NODE_ENV !== "production"

export function Debug(prefix, localEnabled) {
	this.log = localEnabled ? console.log.bind(window.console, prefix) : function () {}
	return this
}
