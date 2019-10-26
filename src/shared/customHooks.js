import React from 'react'

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, const():void]}
 */
export const useLocalStorage = (key, initValue) => {
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
	const set = (value) => {
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
export const useMedia = (queries = [], values, defaultValue = null) => {
	const mediaQueryLists = queries.map((q) => window.matchMedia(q))

	const getValue = () => {
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

export const useOnClickOutside = (ref, handler) => {
	const handledRecentlyRef = React.useRef(false)

	React.useEffect(() => {
		const listener = (event) => {
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

export const useInterval = (callback, delay) => {
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

export const usePrevious = (value) => {
	const ref = React.useRef()

	React.useEffect(() => {
		ref.current = value
	}, [value])

	return ref.current
}

export const useEffectWithInitial = (callback, deps) => {
	if (!deps) throw new Error('useEffectWithInitial() requires dependancy array...')
	deps.push(callback)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => callback(), [])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => callback(), deps)
}
