import React from 'react'
import { throttle } from 'throttle-debounce'

/* -------------------------------------------------------------------------- */

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, const():void]}
 */
export function useLocalStorage(key, initValue) {
	const [value, setValue] = React.useState(() => {
		let item = localStorage.getItem(key)
		if (item && item !== 'undefined') {
			item = JSON.parse(item)
		} else if (initValue) {
			item = initValue
			localStorage.setItem(key, JSON.stringify(item))
		}
		return item
	})

	/**
	 * Update item in storage/state.
	 * @param {*} value
	 */
	function set(value) {
		localStorage.setItem(key, JSON.stringify(typeof value !== 'undefined' ? value : null))
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
		return typeof values[index] !== 'undefined' ? values[index] : defaultValue
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
		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return () => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [ref, handler])
}

/* -------------------------------------------------------------------------- */

export function useInterval(callback, delay) {
	const callbackRef = React.useRef()

	React.useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	React.useEffect(() => {
		const tick = (...args) => callbackRef.current(...args)
		if (delay !== null) {
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

export function useEffectWithInitial(callback, deps) {
	if (!deps) throw new Error('useEffectWithInitial() requires dependancy array...')
	deps.push(callback)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => callback(), [])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => callback(), deps)
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
		throttle(throttleMS, (rect) => {
			const prevOutput = callbackOutputRef.current
			const nextOutput = callbackRef.current(rect)
			if (prevOutput !== nextOutput) {
				callbackOutputRef.current = nextOutput
				setCallbackOutput(nextOutput)
			}
		}),
		[callbackRef, callbackOutputRef],
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
