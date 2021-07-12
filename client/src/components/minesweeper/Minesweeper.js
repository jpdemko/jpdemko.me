import { useContext, useEffect, useState } from "react"
import styled, { css } from "styled-components/macro"

import { ReactComponent as SvgFlag } from "../../shared/assets/material-icons/flag.svg"
import { setupAppSharedOptions, themes, Contexts, uuidv4 } from "../../shared/shared"
import { useLocalStorage, usePrevious, useResizeObserver, useUpdatedValRef } from "../../shared/hooks"
import MinesweeperNav from "./MinesweeperNav"
import Board from "./Board"
import GameInfo, { useTimer } from "./GameInfo"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import Leaderboard from "./Leaderboard"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	${({ theme, isDesktop }) => css`
		--ms-size: ${isDesktop ? 1.5 : 1}rem;
		height: 100%;
		overflow: hidden;
		background: ${theme.backgroundAlt};
	`}
	.subtle-ms {
		opacity: 0.7;
		font-size: 0.8em;
		font-style: italic;
	}
	.ms-show-false {
		display: none;
	}
`

const GameWrap = styled.div`
	position: relative;
	height: 100%;
	flex-direction: column;
	${({ isShown }) => css`
		display: ${isShown ? "flex" : "none"};
	`}
`

const GameOverModal = styled(Modal)`
	user-select: none;
`

const GameEndedWrap = styled.div`
	padding: calc(var(--content-spacing) * 0.75) var(--content-spacing);
	> div {
		margin: calc(var(--content-spacing) * 0.5);
	}
`

const GEBtns = styled.div`
	margin-top: calc(var(--content-spacing) * -0.5);
	> * {
		margin-right: calc(var(--content-spacing) * 0.5);
		margin-bottom: calc(var(--content-spacing) * 0.5);
	}
`

const GEHighlight = styled.div`
	font-weight: bold;
	font-size: 1.5em;
`

const GESummary = styled.div`
	${({ theme }) => css`
		> span {
			color: ${theme.highlight};
			font-weight: bold;
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

export const MsDifs = {
	Easy: {
		order: 1,
		name: "Easy",
		rows: 9,
		cols: 9,
		mines: 10,
		wr: 0.1,
	},
	Medium: {
		order: 2,
		name: "Medium",
		rows: 16,
		cols: 16,
		mines: 40,
		wr: 6,
	},
	Hard: {
		order: 3,
		name: "Hard",
		rows: 16,
		cols: 30,
		mines: 99,
		wr: 28,
	},
}

function getGameState(difName = "Hard") {
	const { mines, cols, rows } = MsDifs[difName]
	return {
		game_id: uuidv4(),
		started: false,
		lost: false,
		won: false,
		mines,
		flags: 0,
		unopened: rows * cols - mines,
		difficulty: difName,
	}
}

export function getDisplayTime(timeMS = 0, showMS = false) {
	let ms = String(Math.round(timeMS % 1000)).padStart(3, "0")
	let sec = String(Math.floor(timeMS / 1000) % 60).padStart(2, "0")
	let min = Math.floor(timeMS / 1000 / 60)
	return (
		<span>
			{min}:{sec}
			{showMS ? <span className="subtle-ms">.{ms}</span> : null}
		</span>
	)
}

function Minesweeper({ title, ...props }) {
	const { setAppDrawerContent, isMobileWindow, isMobileSite } = useContext(Contexts.Window)

	const pages = ["Leaderboard", "Play"]
	const [page, setPage] = useLocalStorage("MinesweeperCurPage", "Play")

	const [difName, setDifName] = useState("Hard")

	const [gameState, setGameState] = useState(() => getGameState())
	const prevGS = usePrevious({ ...gameState })

	const [timeMS, setTimeMS] = useState()
	const [startTimer, pauseTimer, resetTimer] = useTimer((ms) => setTimeMS(ms))

	const [modalShown, setModalShown] = useState(false)

	useEffect(() => {
		if (!gameState || !prevGS) return
		if (!prevGS.started && gameState.started) {
			startTimer()
		} else if (gameState.lost || gameState.won) setModalShown(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gameState])

	const resetGameRef = useUpdatedValRef(resetGame)
	function resetGame() {
		setGameState(getGameState(difName))
		if (modalShown) setModalShown(false)
		resetTimer()
	}

	// Restart game if currently ongoing as well as switch rows/cols for better portrait UI/UX.
	const handleResizeVert = (eleRect) => eleRect.height > eleRect.width * 1.5
	let [rootRef, isVert] = useResizeObserver(handleResizeVert)
	if (isVert == null) isVert = isMobileSite

	const prevName = usePrevious(difName)
	const prevVert = usePrevious(isVert)
	useEffect(() => {
		if (prevVert !== isVert || prevName !== difName) {
			resetGameRef.current?.()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVert, difName])

	const isDesktop = !isMobileSite && !isMobileWindow

	return (
		<Root {...props} ref={rootRef} isDesktop={isDesktop}>
			<MinesweeperNav
				setAppDrawerContent={setAppDrawerContent}
				page={page}
				pages={pages}
				setPage={setPage}
				isMobileSite={isMobileSite}
			/>
			<Leaderboard gameState={gameState} timeMS={timeMS} isShown={page === "Leaderboard"} />
			<GameWrap isShown={page === "Play"}>
				<GameOverModal
					isShown={modalShown}
					onContextMenu={(e) => {
						e.preventDefault()
						return false
					}}
				>
					<GameEndedWrap>
						<GEHighlight>
							{gameState?.won ? "Congratulations, you've won!" : "Game over..."}
						</GEHighlight>
						<GESummary>
							You're final time was <span>{getDisplayTime(timeMS, true)}</span>!
							{gameState?.won ? (
								<>
									<br />
									To submit your time to the global leaderboard, please go to the leaderboard and
									sign-in, otherwise you can save your times locally via local storage.
								</>
							) : null}
						</GESummary>
						<GEBtns>
							<Button variant="solid" onClick={() => resetGame()}>
								Start new game!
							</Button>
							<Button variant="solid" onClick={() => setPage("Leaderboard")} setColor="accent">
								Check Leaderboard
							</Button>
						</GEBtns>
					</GameEndedWrap>
				</GameOverModal>
				<Board
					isVert={isVert}
					isDesktop={isDesktop}
					title={title}
					isMobileSite={isMobileSite}
					gameState={gameState}
					setGameState={setGameState}
					resetGame={resetGame}
					pauseTimer={pauseTimer}
				/>
				<GameInfo
					difName={difName}
					setDifName={setDifName}
					gameState={gameState}
					setGameState={setGameState}
					timeMS={timeMS}
				/>
			</GameWrap>
		</Root>
	)
}

Minesweeper.shared = setupAppSharedOptions({
	title: "Minesweeper",
	logo: SvgFlag,
	theme: themes.dark,
})

export default Minesweeper
