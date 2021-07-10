import { useCallback, useEffect, useRef } from "react"
import styled, { css } from "styled-components/macro"
import { desaturate } from "polished"

import { MsDifs, getDisplayTime } from "./Minesweeper"
import { ReactComponent as SvgTimer } from "../../shared/assets/material-icons/timer.svg"
import { ReactComponent as SvgFlag } from "../../shared/assets/material-icons/flag.svg"
import { useUpdatedValRef } from "../../shared/hooks"
import { opac } from "../../shared/shared"
import { Select } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--gi-spc: 0.25rem;
	display: flex;
	justify-content: center;
	flex: 0 0;
	height: var(--nav-height);
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.highlightContrast};
		filter: drop-shadow(0px -1px 6px ${opac(0.6, desaturate(0.1, theme.accent))});
		border-top: 1px solid ${theme.accent};
	`}

	> * {
		margin: var(--gi-spc);
		display: inline-flex;
		align-items: center;
	}
`

const DifMenu = styled(Select)`
	font-size: 0.8rem;
	flex: 1;
	padding: 0.25em 1.25em 0.25em 0.4em;
	${({ theme }) => css`
		color: ${theme.highlightContrast};

		option {
			background: ${theme.backgroundAlt} !important;
			color: ${theme.backgroundContrast} !important;
		}
	`}
`

const TimerWrap = styled.div`
	svg {
		margin-left: var(--gi-spc);
	}
`

const MineCounterWrap = styled.div`
	svg {
		margin-right: var(--gi-spc);
	}
`

/* -------------------------------------------------------------------------- */

export function useTimer(stepCB, errorCB, intervalMS = 1000) {
	const cbRef = useUpdatedValRef(stepCB)
	const cbErrorRef = useUpdatedValRef(errorCB)

	const startTimeRef = useRef(0)
	const pausedRef = useRef(true)
	const expectedRef = useRef(Date.now() + intervalMS)
	const timeoutRef = useRef()

	const step = useCallback(() => {
		const drift = Date.now() - expectedRef.current
		if (drift > intervalMS) cbErrorRef.current?.()
		cbRef.current?.(Date.now() - startTimeRef.current)
		expectedRef.current += intervalMS
		timeoutRef.current = setTimeout(step, Math.max(0, intervalMS - drift))
	}, [cbErrorRef, cbRef, intervalMS])

	const startTimer = useCallback(() => {
		if (startTimeRef.current === 0) startTimeRef.current = Date.now()
		if (pausedRef.current) {
			pausedRef.current = false
			expectedRef.current = Date.now() + intervalMS
			timeoutRef.current = setTimeout(step, intervalMS)
		}
	}, [intervalMS, step])

	const pauseTimer = useCallback(() => {
		if (!pausedRef.current) {
			clearTimeout(timeoutRef.current)
			cbRef.current?.(Date.now() - startTimeRef.current)
			pausedRef.current = true
		}
	}, [cbRef])

	const resetTimer = useCallback(() => {
		clearTimeout(timeoutRef.current)
		if (startTimeRef.current !== 0) cbRef.current?.(null)
		startTimeRef.current = 0
	}, [cbRef])

	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [])

	return [startTimer, pauseTimer, resetTimer]
}

/* -------------------------------- COMPONENT ------------------------------- */

function GameInfo({ difName, setDifName, gameState, timeMS, ...props }) {
	return (
		<Root {...props}>
			<TimerWrap>
				<div>{getDisplayTime(timeMS)}</div>
				<SvgTimer />
			</TimerWrap>
			<div>
				<DifMenu onChange={(e) => setDifName(e.target.value)} value="selected">
					<option hidden disabled value="selected">
						Difficulty: {difName}
					</option>
					{Object.keys(MsDifs).map((dif) => (
						<option value={dif} key={dif}>
							{dif}
						</option>
					))}
				</DifMenu>
			</div>
			<MineCounterWrap>
				<SvgFlag />
				<div>{gameState ? gameState.mines - gameState.flags : MsDifs[difName].mines}</div>
			</MineCounterWrap>
		</Root>
	)
}

export default GameInfo
