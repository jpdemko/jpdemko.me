// eslint-disable-next-line no-unused-vars
import { createContext } from "react"
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
			console.error(`ls.set(${key}) error: `, error)
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
	Index: createContext(),
	Window: createContext(),
	Auth: createContext(),
}

/* -------------------------------------------------------------------------- */

const baseThemes = {
	light: {
		name: "light",
		type: "light",
		public: true,
		primary: "#F5F8FA",
		primaryContrast: "#1C2B36",
		background: "#F5F8FA",
		backgroundContrast: "#1C2B36",
		backgroundAlt: "#E4EBF1",
		highlight: "#3BA4FF",
		highlightContrast: "#F5F8FA",
		accent: "#9abfe0",
	},
	dark: {
		name: "dark",
		type: "dark",
		public: true,
		primary: "#222121",
		primaryContrast: "#FAF5F5",
		background: "#222121",
		backgroundContrast: "#FAF5F5",
		backgroundAlt: "#343232",
		highlight: "#CA3131",
		highlightContrast: "#FAF5F5",
		accent: "#993333",
	},
	blue: {
		name: "blue",
		type: "dark",
		public: true,
		primary: "#1DA1F2",
		primaryContrast: "#F5F8FA",
		background: "#061E2C",
		backgroundContrast: "#F5F8FA",
		backgroundAlt: "#082C42",
		highlight: "#1DA1F2",
		highlightContrast: "#F5F8FA",
		accent: "#007CC9",
	},
	purple: {
		name: "purple",
		type: "light",
		public: true,
		backgroundAlt: "#EAE6F0",
		background: "#F7F5FA",
		backgroundContrast: "#312653",
		highlight: "#6637D6",
		highlightContrast: "#F7F5FA",
		primary: "#6637D6",
		primaryContrast: "#F7F5FA",
		accent: "#A238FF",
	},
	red: {
		name: "red",
		type: "light",
		public: true,
		primary: "#DB1A4A",
		primaryContrast: "#F9F4F6",
		backgroundAlt: "#F1E5E9",
		backgroundContrast: "#3C0815",
		background: "#F9F4F6",
		highlight: "#DB1A4A",
		highlightContrast: "#F9F4F6",
		accent: "#AE1C41",
	},
	green: {
		name: "green",
		type: "light",
		public: false,
		backgroundAlt: "#E4EEEB",
		background: "#F4F9F7",
		backgroundContrast: "#204234",
		highlight: "#1BDC8C",
		highlightContrast: "#204234",
		primary: "#1BDC8C",
		primaryContrast: "#204234",
		accent: "#17B573",
	},
	yellow: {
		name: "yellow",
		type: "light",
		public: false,
		backgroundAlt: "#E4EEEB",
		background: "#FAF9F5",
		backgroundContrast: "#332F15",
		highlight: "#f5e46e",
		highlightContrast: "#332F15",
		primary: "#f5e46e",
		primaryContrast: "#332F15",
		accent: "#C6B545",
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
 * @property {string} type
 * @property {boolean} public
 * @property {string} background Should be very light or dark.
 * @property {string} backgroundAlt Slight offset of the regular background.
 * @property {string} backgroundContrast Color readable on both backgrounds.
 * @property {string} highlight Color used to highlight/emphasis something.
 * @property {string} highlightContrast
 * @property {string} primary The primary color of the theme.
 * @property {string} primaryContrast
 * @property {string} accent Slight offset of the primary theme color.
 * @property {string} darkestColor Darkest color automatically selected from previous properties.
 * @property {string} lightestColor Lightest color automatically selected from previous properties.
 * @property {ThemeReadableColor} [readableColor]
 */

/**
 * @param {Theme} theme
 * @returns {Theme}
 */
function createTheme(theme) {
	let sortedLumin = Object.entries(theme)
		.filter(([k, v]) => typeof v === "string" && v.includes("#"))
		.map(([name, hex]) => [name, getLuminance(hex)])
		.sort(([, lumi1], [, lumi2]) => (lumi1 > lumi2 ? 1 : lumi1 < lumi2 ? -1 : 0))
	const darkKV = sortedLumin.shift()
	const lightKV = sortedLumin.pop()
	const darkHex = darkKV?.[0] ? theme[darkKV[0]] : "#222121"
	const lightHex = lightKV?.[0] ? theme[lightKV[0]] : "#F5F8FA"
	return {
		...theme,
		darkestColor: darkHex,
		lightestColor: lightHex,
		readableColor: (bgColor) => readableColor(bgColor, darkHex, lightHex, false),
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
 * @param {import("react").FunctionComponent<import("react").SVGProps<SVGSVGElement>>} options.logo
 * @param {Theme} options.theme
 * @param {boolean} options.authRequired
 * @param {string} options.authReasoning
 * @returns {Object}
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
	 * @returns {Array|null}
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

	set(ele) {
		if (!ele) return
		this.ele = window.getComputedStyle(ele)
	}
}

/* -------------------------------------------------------------------------- */

/**
 * Condensed way to get the DOMRect of something.
 * @param {Element|string} target DOM element OR string element ID, eg: 'target' (no #)
 * @returns {DOMRect|Object}
 */
export function getRect(target) {
	target = typeof target === "string" ? document.getElementById(target) : target
	return target ? target.getBoundingClientRect() : {}
}

/* -------------------------------------------------------------------------- */

/**
 * This 'mixin' was created because of a Chrome bug which causes child elements to blur on 3D translation.
 * @param {string} adjustments Your desired translation values, eg: '0, -15%'
 * @returns {string} The resultant browser translation, eg: 'translate3d(0, -15%, 0)'
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

const DEBUG_ENABLED = process.env.NODE_ENV !== "production"

export function Debug(prefix, localEnabled) {
	this.log = localEnabled && DEBUG_ENABLED ? console.log.bind(window.console, prefix) : function () {}
	return this
}

/* -------------------------------------------------------------------------- */

export class GenSeqID {
	constructor(startNum, prefix) {
		this.curNum = startNum ?? 0
		this.prefix = prefix
	}

	get(skipN = 3) {
		this.curNum -= skipN
		return this.prefix ? `${this.prefix}-${this.curNum}` : this.curNum
	}

	set(newNum, newPrefix) {
		this.curNum = newNum
		this.prefix = newPrefix
		return this.get()
	}
}

export const zOverlayGen = new GenSeqID(300000)

/* -------------------------------------------------------------------------- */

export function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		// eslint-disable-next-line no-mixed-operators
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	)
}
