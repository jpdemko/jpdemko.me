import { useState, useEffect, useRef, useCallback } from "react"
import throttle from "lodash/throttle"
import isFunction from "lodash/isFunction"

import { Debug, ls } from "./shared"

const debug = new Debug("hooks.js - ", false)

/* -------------------------------------------------------------------------- */

/**
 * Custom hook to expedite the common React localStorage scenario.
 * @param {string} key
 * @param {*} [initValue] - optional value only used on initial creation
 * @returns {[*, const():void]}
 */
export function useLocalStorage(key, initValue, skipParse = false) {
	if (typeof initValue === "string") skipParse = true

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
	 * @param {*} val
	 */
	function set(val) {
		if (isFunction(val)) val = val(value)
		ls.set(key, val)
		setValue(val)
	}

	return [value, set]
}

/* -------------------------------------------------------------------------- */

/**
 * If media query matches return true, otherwise false.
 * @param {string} queries EG: '(min-width: 480px)' or '(min-width: 1024px)'
 * @returns {boolean}
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
			cbRef.current?.(...args)
		}, throttleMS),
		[...depArr, throttleMS]
	)
}

/* -------------------------------------------------------------------------- */

/**
 * @callback useResizeObserverCallback
 * @param {DOMRectReadOnly} resizeEleRect
 * @param {*} prevOutput
 * @returns {*}
 */

/**
 * @param {useResizeObserverCallback} cb
 * @param {number} throttleMS=number
 * @returns {[import("react").RefObject, *]}
 */
export function useResizeObserver(cb, eleID, throttleMS = 200, depArr = []) {
	const eleRef = useRef()
	const cbRef = useUpdatedValRef(cb)
	const isLoadedRef = useRef(true)

	const [cbOutput, setCbOutput] = useState()
	const cbOutputRef = useUpdatedValRef(cbOutput)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const cbThrottled = useThrottle(
		(eleRect, ele) => {
			const prevOutput = cbOutputRef.current
			const nextOutput = cbRef.current(eleRect, ele, prevOutput)
			if (prevOutput !== nextOutput) setCbOutput(nextOutput)
		},
		throttleMS,
		depArr
	)

	useEffect(() => {
		if (!eleRef.current && eleID) eleRef.current = document.getElementById(eleID)
		const ele = eleRef.current
		let resizeObserver = null
		if (ele) {
			resizeObserver = new ResizeObserver((entries) => {
				if (!Array.isArray(entries) || !entries.length || !isLoadedRef.current) return
				const entry = entries[0]
				cbThrottled(entry.contentRect, entry.target)
			})
			resizeObserver.observe(ele)
		}

		return () => {
			cbThrottled?.cancel?.()
			isLoadedRef.current = false
			resizeObserver?.unobserve?.(ele)
		}
	}, [cbThrottled, eleID])

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
			const handler = (...args) => {
				debug.log("useEventListener", { eventName, ele, curCb })
				return curCb(...args)
			}
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

/* -------------------------------------------------------------------------- */

export function useAsyncEffect(fn, dep = []) {
	useEffect(() => {
		let mounted = true
		void (async function runFn() {
			fn(() => mounted)
		})()
		return () => {
			mounted = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dep)
}
