import { useState, useEffect, useRef, useCallback } from "react"
import throttle from "lodash/throttle"

import { Debug, ls } from "./shared"

const debug = new Debug("hooks.js - ", false)

/* -------------------------------------------------------------------------- */

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @return {[*, const():void]}
 */
export function useLocalStorage(key, initValue, skipParse = false) {
	const [value, setValue] = useState(() => {
		let item = ls.get(key, skipParse)
		if (!item && initValue) {
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
 * If media query matches return true, otherwise false.
 * @param {string} queries EG: '(min-width: 480px)' or '(min-width: 1024px)'
 * @return {boolean}
 */
export function useMediaQuery(query) {
	const mq = window.matchMedia(query)
	const [match, setMatch] = useState(mq.matches)

	useEffect(() => {
		const handler = () => setMatch(mq.matches)
		mq.addEventListener("change", handler)
		return () => mq.removeEventListener("change", handler)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return match
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

export function useThrottle(cb, throttleMS = 200, depArr = []) {
	const cbRef = useUpdatedValRef(cb)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback(
		throttle((...args) => {
			debug.log(`useThrottle()`, ...args)
			cbRef.current(...args)
		}, throttleMS),
		[...depArr, throttleMS]
	)
}

/* -------------------------------------------------------------------------- */

/**
 * @callback useResizeObserverCallback
 * @param {DOMRectReadOnly} resizeEleRect
 * @return {boolean}
 */

/**
 * @param {useResizeObserverCallback} cb
 * @param {number} throttleMS=number
 */
export function useResizeObserver(cb, throttleMS = 200, depArr = []) {
	const eleRef = useRef()
	const cbRef = useUpdatedValRef(cb)
	const isLoadedRef = useRef(true)

	const [cbOutput, setCbOutput] = useState()
	const cbOutputRef = useUpdatedValRef(cbOutput)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const cbThrottled = useThrottle(
		(rect) => {
			const prevOutput = cbOutputRef.current
			const nextOutput = cbRef.current(rect)
			if (prevOutput !== nextOutput) setCbOutput(nextOutput)
		},
		throttleMS,
		depArr
	)

	useEffect(() => {
		const ele = eleRef.current
		const resizeObserver = new ResizeObserver((entries) => {
			if (!Array.isArray(entries) || !entries.length || !isLoadedRef.current) return
			const entry = entries[0]
			cbThrottled(entry.contentRect)
		})
		resizeObserver.observe(ele)

		return () => {
			cbThrottled?.cancel?.()
			isLoadedRef.current = false
			resizeObserver.unobserve(ele)
		}
	}, [cbThrottled])

	return [eleRef, cbOutput]
}

/* -------------------------------------------------------------------------- */

export function useEventListener(eleRef, eventName, cb) {
	const cbRef = useRef(cb)
	useEffect(() => {
		cbRef.current?.cancel?.()
		cbRef.current = cb
	}, [cb])

	useEffect(
		() => {
			const ele = eleRef.current
			const curCb = cbRef.current
			// Wrap cb for easy
			const handler = (...args) => curCb(...args)
			// Add event listener.
			ele?.addEventListener?.(eventName, handler)
			// Remove event listener and possible throttle/debounce w/ cancel() on cleanup.
			return () => {
				curCb?.cancel?.()
				ele?.removeEventListener?.(eventName, handler)
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[eleRef.current, eventName]
	)
}
