import * as React from "react"
import { ThemeContext } from "styled-components/macro"
import throttle from "lodash/throttle"

import { themes, ls } from "./shared"

/* -------------------------------------------------------------------------- */

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, const():void]}
 */
export function useLocalStorage(key, initValue) {
	const [value, setValue] = React.useState(() => {
		let item = ls.get(key)
		if (initValue) {
			item = initValue
			ls.set(key, item)
		}
		return item
	})

	/**
	 * Update item in storage/state.
	 * @param {*} value
	 */
	function set(value) {
		ls.set(key, value)
		setValue(value)
	}

	return [value, set]
}

/* -------------------------------------------------------------------------- */

/**
 * Use if you need to do something in JS based on media-queries. (make sure they don't overlap)
 * @param {string[]} queries - eg: ['(min-width: 480px)', '(min-width: 1024px)']
 * @param {Array} values - what to return on query match, ex: [true, { name: John Doe }]
 * @param {*} [defaultValue=null] - what to return if no queries match
 * @return {*} - returns value in values array based on the same index of matching query
 */
export function useMedia(queries = [], values, defaultValue = null) {
	const mediaQueryLists = queries.map((q) => window.matchMedia(q))

	function getValue() {
		const index = mediaQueryLists.findIndex((mql) => mql.matches)
		return typeof values[index] !== "undefined" ? values[index] : defaultValue
	}

	const [value, setValue] = React.useState(getValue)

	React.useEffect(() => {
		const handler = () => setValue(getValue)
		mediaQueryLists.forEach((mql) => mql.addListener(handler))
		return () => mediaQueryLists.forEach((mql) => mql.removeListener(handler))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return value
}

/* -------------------------------------------------------------------------- */

export function useOnClickOutside(ref, handler) {
	const handledRecentlyRef = React.useRef(false)

	React.useEffect(() => {
		function listener(event) {
			if (!ref.current || ref.current.contains(event.target) || handledRecentlyRef.current) return
			handledRecentlyRef.current = true
			handler(event)
			setTimeout(() => {
				handledRecentlyRef.current = false
			}, 200)
		}
		document.addEventListener("mousedown", listener)
		document.addEventListener("touchstart", listener)

		return () => {
			document.removeEventListener("mousedown", listener)
			document.removeEventListener("touchstart", listener)
		}
	}, [ref, handler])
}

/* -------------------------------------------------------------------------- */

export function useInterval(callback, delay) {
	const callbackRef = React.useRef()

	React.useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const finishedRef = React.useRef(false)
	React.useEffect(() => {
		const tick = (...args) => {
			if (callbackRef.current(...args)) finishedRef.current = true
		}
		if (delay !== null || !finishedRef.current) {
			let id = setInterval(tick, delay)
			return () => clearInterval(id)
		}
	}, [delay])
}

/* -------------------------------------------------------------------------- */

export function usePrevious(value) {
	const ref = React.useRef()

	React.useEffect(() => {
		ref.current = value
	}, [value])

	return ref.current
}

/* -------------------------------------------------------------------------- */

export function useUpdatedValRef(value) {
	const ref = React.useRef()

	React.useEffect(() => {
		ref.current = value
	}, [value])

	return ref
}

/* -------------------------------------------------------------------------- */

/**
 * @callback useResizeObserverCallback
 * @param {DOMRectReadOnly} resizeEleRect
 * @return {boolean}
 */

/**
 * @param {useResizeObserverCallback} callback
 * @param {number} throttleMS=number
 */
export function useResizeObserver(callback, throttleMS = 200) {
	const eleRef = React.useRef()
	const callbackRef = React.useRef(callback)
	const isLoadedRef = React.useRef(true)

	const [callbackOutput, setCallbackOutput] = React.useState()
	const callbackOutputRef = useUpdatedValRef(callbackOutput)

	const throttledCallback = React.useCallback(
		throttle((rect) => {
			const prevOutput = callbackOutputRef.current
			const nextOutput = callbackRef.current(rect)
			if (prevOutput !== nextOutput) {
				callbackOutputRef.current = nextOutput
				setCallbackOutput(nextOutput)
			}
		}, throttleMS),
		[callbackRef, callbackOutputRef]
	)

	React.useEffect(() => {
		const element = eleRef.current
		const resizeObserver = new ResizeObserver((entries) => {
			if (!Array.isArray(entries) || !entries.length || !isLoadedRef.current) return

			const entry = entries[0]
			throttledCallback(entry.contentRect)
		})
		resizeObserver.observe(element)

		return () => {
			isLoadedRef.current = false
			resizeObserver.unobserve(element)
		}
	}, [throttledCallback])

	return [eleRef, callbackOutput]
}

/* -------------------------------------------------------------------------- */

export function useCorrectTheme(color) {
	const curTheme = React.useContext(ThemeContext)
	const output = {}
	if (color && Object.keys(themes).find((name) => name === color)) {
		if (curTheme.name === color) color = "dark"
		output.color = color
		output.theme = themes[color]
	}
	return output
}

/* -------------------------------------------------------------------------- */

export function useEventListener(eventName, handler, eleRef) {
	const savedHandler = React.useRef()

	// Update ref.current value if handler changes. This allows our effect below to always get latest
	// handler without us needing to pass it in effect deps array and potentially cause effect to
	// re-run every render.
	React.useEffect(() => {
		savedHandler.current = handler
	}, [handler])

	React.useEffect(
		() => {
			// Create event listener that calls handler function stored in ref.
			const eventListener = (event) => savedHandler.current(event)
			// Add event listener
			if (eleRef.current?.addEventListener) eleRef.current.addEventListener(eventName, eventListener)

			// Remove event listener and possible throttle/debounce w/ cancel() on cleanup.
			const ele = eleRef.current
			return () => {
				// Check if handler is a throttle/debounce related, if so then we need to cancel it.
				if (savedHandler.current?.cancel) {
					// console.log(`useEventListener-${eventName} throttle/debounce cancel() called`)
					savedHandler.current.cancel()
				}
				if (ele?.removeEventListener) {
					// console.log(`useEventListener-${eventName} removeEventListener() called`)
					ele.removeEventListener(eventName, eventListener)
				}
			}
		},
		[eventName, eleRef] // Re-run if eventName or element changes
	)
}
