import { useState, useEffect } from 'react'

export function useLocalStorage(key, initValue) {
	const [value, setValue] = useState(() => {
		if (initValue) {
			let convInitValue = JSON.stringify(initValue)
			localStorage.setItem(key, convInitValue)
			return convInitValue
		}
		let item = localStorage.getItem(key)
		try {
			return item ? JSON.parse(item) : item
		} catch {
			return item
		}
	})

	function set(value) {
		localStorage.setItem(key, JSON.stringify(value))
		setValue(value)
	}

	return [value, set]
}

export function useMedia(queries, values, defaultValue) {
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
	})

	return value
}

export function useOnClickOutside(ref, handler) {
	useEffect(() => {
		const listener = (event) => {
			if (!ref.current || ref.current.contains(event.target)) {
				return
			}

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
