import { useState, useEffect, useRef, useContext, useCallback, useMemo } from "react"
import { ThemeContext } from "styled-components/macro"
import throttle from "lodash/throttle"

import { Themes, ls } from "./shared"

/* -------------------------------------------------------------------------- */

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, const():void]}
 */
export function useLocalStorage(key, initValue) {
	const [value, setValue] = useState(() => {
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

	const [value, setValue] = useState(getValue)

	useEffect(() => {
		const handler = () => setValue(getValue)
		mediaQueryLists.forEach((mql) => mql.addListener(handler))
		return () => mediaQueryLists.forEach((mql) => mql.removeListener(handler))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return value
}

/* -------------------------------------------------------------------------- */

export function useOnClick(interactFn) {
	const eleRef = useRef()
	const handledRecentlyRef = useRef(false)

	useEffect(() => {
		const ele = eleRef.current

		function listener(event) {
			if (!ele || !ele.contains(event.target) || handledRecentlyRef.current) return
			handledRecentlyRef.current = true
			interactFn(event)
			setTimeout(() => {
				handledRecentlyRef.current = false
			}, 200)
		}

		if (ele && interactFn) {
			ele.addEventListener("mousedown", listener)
			ele.addEventListener("touchstart", listener)
		}

		return () => {
			if (ele && interactFn) {
				ele.removeEventListener("mousedown", listener)
				ele.removeEventListener("touchstart", listener)
			}
		}
	}, [handledRecentlyRef, interactFn])

	return eleRef
}

/* -------------------------------------------------------------------------- */

export function useInterval(callback, delay) {
	const callbackRef = useRef()

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const finishedRef = useRef(false)
	useEffect(() => {
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
	const ref = useRef()

	useEffect(() => {
		ref.current = value
	}, [value])

	return ref.current
}

/* -------------------------------------------------------------------------- */

export function useUpdatedValRef(value) {
	const ref = useRef()

	useEffect(() => {
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
	const eleRef = useRef()
	const callbackRef = useRef(callback)
	const isLoadedRef = useRef(true)

	const [callbackOutput, setCallbackOutput] = useState()
	const callbackOutputRef = useUpdatedValRef(callbackOutput)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const throttledCallback = useCallback(
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

	useEffect(() => {
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

export function useCorrectTheme({ setTheme, color }) {
	const curTheme = useContext(ThemeContext)

	const nextTheme = useMemo(() => Themes?.[setTheme] ?? null, [setTheme])

	// Might be a bad idea to auto determine base color because each UI component might want
	// the base color to be something specific to the theme.
	const nextColor = useMemo(() => {
		const theme = nextTheme ?? curTheme
		return theme?.[color] ?? theme.bgContrast
	}, [nextTheme, curTheme, color])

	const themeProps = useMemo(() => {
		return {
			...(nextTheme && { theme: nextTheme }),
			...(nextColor && { color: nextColor }),
		}
	}, [nextTheme, nextColor])

	return themeProps
}

/* -------------------------------------------------------------------------- */

export function useEventListener(eventName, handler, eleRef) {
	const savedHandler = useRef()

	// Update ref.current value if handler changes. This allows our effect below to always get latest
	// handler without us needing to pass it in effect deps array and potentially cause effect to
	// re-run every render.
	useEffect(() => {
		savedHandler.current = handler
	}, [handler])

	useEffect(
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
