import { useContext, useEffect, useMemo, useRef, useState } from "react"
import styled, { css, ThemeContext } from "styled-components/macro"

import { useEventListener, usePrevious, useUpdatedValRef } from "../../shared/hooks"
import { themes } from "../../shared/shared"
import { MsDifs } from "./Minesweeper"
import Cell from "./Cell"

/* --------------------------------- STYLES --------------------------------- */

const BRoot = styled.div`
	display: grid;
	flex: 1 1;
	overflow-y: auto;
	overflow-x: hidden;
	user-select: none;
	${({ rows, cols, isVert }) => css`
		grid-template-columns: repeat(${isVert ? rows : cols}, 1fr);
		grid-template-rows: repeat(${isVert ? cols : rows}, 1fr);
	`}
`

/* -------------------------------------------------------------------------- */

function getCoords(e) {
	const coords = e?.target
		?.closest("[id]")
		?.id?.split(",")
		?.map((s) => parseInt(s))
	return coords
}

function useMouse(rootRef, cbLeft, cbBoth, cbRight, stopOnAny = []) {
	const stop = stopOnAny.some((cond) => cond)
	const stopRef = useUpdatedValRef(stop)

	const cbLeftRef = useUpdatedValRef(cbLeft)
	const cbBothRef = useUpdatedValRef(cbBoth)
	const cbRightRef = useUpdatedValRef(cbRight)

	const leftDownRef = useRef(false)
	const rightDownRef = useRef(false)

	function handleMouseDown(e) {
		e.preventDefault()
		if (stopRef.current) return
		if (e.button === 0) {
			leftDownRef.current = true
		} else if (e.button === 2) {
			rightDownRef.current = true
		}
	}

	const resetMS = 150
	const onCD = useRef()
	function handleMouseUp(e) {
		if (onCD.current || stopRef.current) return
		const coords = getCoords(e)
		const bothDown = leftDownRef.current && rightDownRef.current
		if (bothDown || e.button === 1) {
			if (bothDown) {
				onCD.current = true
				setTimeout(() => {
					onCD.current = false
				}, resetMS)
			}
			rightDownRef.current = false
			leftDownRef.current = false
			cbBothRef.current?.(coords)
		} else if (e.button === 0 && leftDownRef.current) {
			leftDownRef.current = false
			cbLeftRef.current?.(coords)
		} else if (e.button === 2 && rightDownRef.current) {
			rightDownRef.current = false
			cbRightRef.current?.(coords)
		}
	}

	useEventListener(rootRef, "mousedown", handleMouseDown)
	useEventListener(rootRef, "mouseup", handleMouseUp)
}

/* -------------------------------- COMPONENT ------------------------------- */

let board = []
let lastGS = {}

function Board({
	difName,
	children,
	isVert,
	isDesktop,
	title,
	isMobileSite,
	gameState,
	setGameState,
	pauseTimer,
	...props
}) {
	const dif = MsDifs[difName]
	const rows = isVert ? dif.cols : dif.rows
	const cols = isVert ? dif.rows : dif.cols

	const { game_id, started, lost, won, unopened, mines } = gameState
	const stop = lost || won

	const startedRef = useRef(started ?? false)

	const [gameBoard, setBoard] = useState(() => [...board])
	const boardRef = useRef()

	// Generate color map for cells based on current theme and some defaults.
	const curTheme = useContext(ThemeContext)
	const colorMap = [
		themes.blue.highlight,
		themes.green.highlight,
		themes.red.highlight,
		themes.purple.highlight,
		curTheme.accent,
		themes.dark.highlight,
		curTheme.backgroundContrast,
		themes.purple.accent,
	]

	// When to generate a new game.
	const prevID = usePrevious(game_id)
	useEffect(() => {
		if (prevID !== game_id && lastGS?.game_id !== game_id) {
			setBoard(genBlankBoard())
		}
		return () => {
			lastGS = { ...gameState }
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gameState])

	// Whenever gameBoard gets updated go through the cells and determine current gameState in parent.
	function checkGameState() {
		const gs = {
			unopened: 0,
			flags: 0,
		}
		const minesArr = []
		board.forEach((r, i) => {
			r?.forEach?.((c, j) => {
				const cell = board?.[i]?.[j]
				if (!cell) return
				if (cell.isMine) minesArr.push(cell)
				if (cell.isFlagged) gs.flags++
				if (!cell.isDug) gs.unopened++
				else if (cell.isDug) {
					if (cell.isMine) gs.lost = true
					else if (!started) gs.started = true
				}
			})
		})
		if (!lost && gs?.lost) {
			minesArr.forEach((m) => {
				if (!m.isFlagged) m.isDug = true
			})
			setBoard([...board])
		} else if (!gs.lost && gs.unopened === mines) {
			gs.won = true
		}
		if (gs.lost || gs.won) {
			pauseTimer()
		}
		setGameState((prev) => ({ ...prev, ...gs }))
	}

	const refCheckGS = useUpdatedValRef(checkGameState)

	useEffect(() => {
		refCheckGS.current?.()
	}, [gameBoard, refCheckGS])

	function genBlankBoard() {
		board = new Array(rows).fill(null).map((r, i) =>
			new Array(cols).fill(null).map((c, j) => ({
				id: `${i},${j}`,
				coords: [i, j],
				isDug: false,
				isFlagged: false,
				isMine: false,
				display: "",
				surMines: 0,
			}))
		)
		startedRef.current = false
		return board
	}

	function fillBoard(coords) {
		const skippedCells = getSurCells(coords, true)
		for (let i = 0; i < dif.mines; i++) {
			let r = Math.floor(Math.random() * rows)
			let c = Math.floor(Math.random() * cols)
			const cell = board[r][c]
			const invalidCell = skippedCells.some((sc) => sc.id === cell.id)
			if (!invalidCell && !cell.isMine) {
				cell.isMine = true
				getSurCells(cell.coords).forEach((sc) => sc.surMines++)
			} else i--
		}
	}

	function getSurCells(coords, includeOrigin = false) {
		const [r, c] = coords
		const surCells = []
		for (let i = r - 1; i <= r + 1; i++) {
			for (let j = c - 1; j <= c + 1; j++) {
				const sameCell = i === r && j === c
				const cell = board?.[i]?.[j]
				if (!cell || (cell && sameCell && !includeOrigin)) continue
				else surCells.push(cell)
			}
		}
		return surCells
	}

	function dig(coords, skipUpdate = false) {
		if (stop) return
		if (!startedRef.current) {
			startedRef.current = true
			fillBoard(coords)
		}

		const [r, c] = coords
		const cell = board?.[r]?.[c]
		if (!cell || cell.isFlagged || cell.isDug) return

		cell.isDug = true
		if (!cell.isMine && cell.surMines === 0) getSurCells(coords).forEach((c) => dig(c.coords, true))

		if (!skipUpdate) {
			setBoard([...board])
		}
	}

	function flag(coords) {
		if (stop) return
		const [r, c] = coords
		const cell = board[r][c]
		if (!cell || cell.isDug) return
		else {
			cell.isFlagged = !cell.isFlagged
			setBoard([...board])
		}
	}

	function digArea(coords) {
		if (stop) return
		const [r, c] = coords
		const cell = board[r][c]
		if (!cell || !cell.isDug || cell.surMines < 1) return
		const surNotDugCells = getSurCells(coords).filter((sc) => !sc.isDug)
		const flagsMatch = surNotDugCells.filter((sc) => sc.isFlagged).length === cell.surMines
		const containsUnopened = surNotDugCells.some((sc) => !sc.isDug && !sc.isFlagged)
		const surUnopenedCells = surNotDugCells.filter((sc) => !sc.isFlagged)
		if (flagsMatch && containsUnopened) {
			surUnopenedCells.forEach((sc) => dig(sc.coords, true))
			setBoard([...board])
		}
	}

	useMouse(boardRef, dig, digArea, flag, [stop, isMobileSite])

	// Flatten 2D board array.
	let flatBoard = useMemo(() => {
		return gameBoard.reduce((acc, r, i) => {
			const flip = i % 2
			r.forEach((c, j) => {
				const altPattern = j % 2 === flip
				return acc.push(
					<Cell
						key={c.id}
						id={c.id}
						data={{ ...c }}
						altPattern={altPattern}
						isMobileSite={isMobileSite}
						colorMap={colorMap}
						boardRef={boardRef}
						dig={dig}
						flag={flag}
						digArea={digArea}
					/>
				)
			})
			return acc
		}, [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gameBoard])

	return (
		<BRoot
			{...props}
			ref={boardRef}
			id="ms-board"
			rows={dif.rows}
			cols={dif.cols}
			isVert={isVert}
			isDesktop={isDesktop}
			onContextMenu={(e) => {
				e.preventDefault()
				return false
			}}
		>
			{flatBoard}
		</BRoot>
	)
}

export default Board
