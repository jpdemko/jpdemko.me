import React from 'react'

import { addTheme } from './helpers'

/* -------------------------------------------------------------------------- */

export const flags = {
	isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
	// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
	// This flag is used to disable 3D transforms in Chrome.
	// isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
	isChrome: false,
}

/* -------------------------------------------------------------------------- */

export const Contexts = {
	AppNav: React.createContext(),
	Auth: React.createContext(),
	IsMobileWindow: React.createContext(),
	Settings: React.createContext(),
}

/* -------------------------------------------------------------------------- */

export const themes = {
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
Object.keys(themes).forEach((key) => addTheme(key, themes[key]))

/* -------------------------------------------------------------------------- */

export const mediaBreakpoints = { desktop: 813 }
