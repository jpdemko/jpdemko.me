import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, function():void]}
 */
export function useLocalStorage(key, initValue) {
	const [value, setValue] = useState(() => {
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

/**
 * Use if you need to do something in JS based on media-queries. (make sure they don't overlap)
 * @param {string[]} queries - eg: ['(min-width: 480px)', '(min-width: 1024px)']
 * @param {Array} values - what to return on query match, ex: [true, { name: John Doe }]
 * @param {*} [defaultValue=null] - what to return if no queries match
 * @return {*} - returns value in values array based on the same index of matching query
 */
export function useMedia(queries = [], values, defaultValue = null) {
	const mediaQueryLists = queries.map((q) => window.matchMedia(q))

	const getValue = () => {
		const index = mediaQueryLists.findIndex((mql) => mql.matches)
		return typeof values[index] !== 'undefined' ? values[index] : defaultValue
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

export function useOnClickOutside(ref, handler) {
	useEffect(() => {
		const listener = (event) => {
			if (!ref.current || ref.current.contains(event.target)) return
			handler(event)
		}
		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return () => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [ref, handler])
}

export function useInterval(callback, delay) {
	const callbackRef = useRef()
	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	useEffect(() => {
		const tick = () => callbackRef.current()
		if (delay !== null) {
			let id = setInterval(tick, delay)
			return () => clearInterval(id)
		}
	}, [delay])
}
