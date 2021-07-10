import styled, { css } from "styled-components/macro"
import { useContext, useState } from "react"
import { DateTime } from "luxon"

import { useAsyncEffect, useLocalStorage, usePrevious } from "../../shared/hooks"
import { Contexts } from "../../shared/shared"
import SocialLogin from "../auth/SocialLogin"
import { getDisplayTime, MsDifs } from "./Minesweeper"
import Tabs from "../ui/Tabs"
import { Table, THeader, TBody, TRow, TH, TD } from "../ui/Table"
import { ReactComponent as SvgCheck } from "../../shared/assets/material-icons/check.svg"
import { ReactComponent as SvgRefresh } from "../../shared/assets/material-icons/refresh.svg"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	padding: calc(var(--content-spacing) / 2);
	height: 100%;
	position: relative;
	${({ isShown }) => css`
		display: ${isShown ? "block" : "none"};
	`}
`

const MainTabs = styled(Tabs)`
	height: 100%;
	max-width: 1024px;
	margin: 0 auto;
	${({ theme }) => css`
		border: 2px solid ${theme.accent};
	`}
`

const STRoot = styled(Tabs)`
	border: none;
	height: 100%;
	overflow-x: auto;
`

const StyTD = styled(TD)`
	white-space: nowrap;
`

const ScoreSubmitBtn = styled(Button)`
	font-size: 0.75em;
	margin: 0.45em;
`

const StySvgCheck = styled(SvgCheck)`
	${({ theme }) => css`
		fill: ${theme.backgroundContrast};
	`}
`

const LbTabWrap = styled.div`
	display: flex;
	align-items: center;
	> span {
		margin-right: 0.6em;
	}
`

const RefreshBtn = styled(Button)`
	> * {
		margin: 0 !important;
	}
`

/* -------------------------------------------------------------------------- */

function newScoreIsLeader(newScore, scores = []) {
	if (!newScore || !scores) return false
	scores = scores.filter((sc) => sc.difficulty === newScore.difficulty)
	scores.sort((a, b) => parseFloat(a?.time_sec ?? "0") - parseFloat(b?.time_sec ?? "0"))
	return scores.length < 1
		? true
		: parseFloat(newScore?.time_sec ?? "0") <= parseFloat(scores?.[0]?.time_sec ?? "0")
}

/* -------------------------------------------------------------------------- */

function ScoresTable({ scores = [], addSubmitColumn, submitScore, ...props }) {
	scores.sort((a, b) => parseFloat(a.time_sec) - parseFloat(b.time_sec))
	return (
		<Table {...props}>
			<THeader>
				<TRow>
					<TH>#</TH>
					<TH>Username</TH>
					<TH>Time</TH>
					<TH>Date</TH>
					{addSubmitColumn ? <TH>Submitted?</TH> : null}
				</TRow>
			</THeader>
			<TBody>
				{scores.map((sc, i) => {
					return (
						<TRow key={sc.game_id}>
							<TD style={{ fontWeight: "bold" }}>{i + 1}</TD>
							<TD>{sc.uname ?? "You (not signed-in)"}</TD>
							<StyTD>{getDisplayTime(parseFloat(sc.time_sec) * 1000, true)}</StyTD>
							<StyTD>{DateTime.fromISO(sc.created_at).toFormat("M-dd-yy")}</StyTD>
							{addSubmitColumn ? (
								<TD>
									{i === 0 ? (
										!sc.submitted ? (
											<ScoreSubmitBtn
												variant="outline"
												onClick={async () => {
													await submitScore(sc)
												}}
											>
												Submit
											</ScoreSubmitBtn>
										) : (
											<StySvgCheck />
										)
									) : (
										"n/a"
									)}
								</TD>
							) : null}
						</TRow>
					)
				})}
			</TBody>
		</Table>
	)
}

/* -------------------------------------------------------------------------- */

function SubTabs({ data = [], ...props }) {
	const difSorted = data.reduce((acc, sc) => {
		acc[sc.difficulty] = {
			...(acc[sc.difficulty] ?? {}),
			[sc.game_id]: sc,
		}
		return acc
	}, {})
	const tabContent = Object.keys(difSorted).map((dif) => {
		const scoresArr = Object.values(difSorted[dif])
		return {
			order: MsDifs[dif].order ?? dif,
			id: dif,
			header: dif,
			content: <ScoresTable scores={scoresArr} {...props} />,
		}
	})
	tabContent.sort((a, b) => a.order - b.order)
	return <STRoot data={tabContent} />
}

/* -------------------------------------------------------------------------- */

async function getMyScores(user, prevScores = []) {
	if (user?.uid) {
		try {
			let res = await fetch(`/minesweeper/my-scores?uid=${user.uid}`)
			if (res.ok) {
				let ms = await res.json()
				ms = ms.filter((s) => {
					s.submitted = true
					return !prevScores.some((ps) => ps.game_id == s.game_id)
				})
				return ms
			} else throw Error(res.status)
		} catch (error) {
			console.error(error)
		}
	}
	return prevScores
}

async function getLeaderboard(prevLeaderboard = []) {
	try {
		let res = await fetch("/minesweeper/leaderboard")
		if (res.ok) return res.json()
		else throw Error(res.status)
	} catch (error) {
		console.error(error)
	}
	return prevLeaderboard
}

async function postScore(newScore, prevScores = []) {
	const ns = newScoreIsLeader(newScore, prevScores)
	if (newScore?.user_id && ns) {
		try {
			let res = await fetch("/minesweeper/submit-score", {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newScore),
			})
			if (res.ok) {
				res = await res.json()
				if (Array.isArray(res)) newScore.submitted = true
			} else throw Error(res.status)
		} catch (error) {
			console.error(error)
		}
	}
	return newScore
}

function isRealisticScore(score) {
	const { time_sec, difficulty: difName } = score
	if (!time_sec || !difName) return false
	return time_sec >= (MsDifs[difName]?.wr ?? 0.1)
}

/* -------------------------------------------------------------------------- */

function Leaderboard({ gameState, timeMS, ...props }) {
	const { game_id, started, lost, won, unopened, mines, flags, difficulty } = gameState
	const { isAuthed, isBanned, user, resetAuth } = useContext(Contexts.Auth)
	const prevAuthed = usePrevious(isAuthed)

	const [myScores, setMyScores] = useLocalStorage("MinesweeperMyScores", [])
	const [leaderboard, setLeaderboard] = useLocalStorage("MinesweeperLeaderboard", [])

	const [modalShown, setModalShown] = useState(false)

	async function refreshLeaderboard() {
		const lb = await getLeaderboard()
		setLeaderboard(lb)
		return lb
	}

	async function submitScore(score) {
		if (!isAuthed) setModalShown(true)
		else if (score) {
			await postScore(score, myScores)
			setMyScores((prev) => [...prev])
		}
	}

	// On initial load get the current global leaderboard.
	useAsyncEffect(async (mounted) => {
		let lb = await getLeaderboard(leaderboard)
		if (mounted) setLeaderboard(lb)
	})

	// If user has or just signed-in, get their potential previous scores.
	useAsyncEffect(
		async (mounted) => {
			if ((!prevAuthed && isAuthed) || (isAuthed && myScores.length < 1)) {
				let ms = await getMyScores(user, myScores)
				if (mounted) {
					setMyScores((prev) => {
						prev = prev.map((sc) => ({ ...sc, user_id: user?.uid, uname: user?.uname }))
						return [...prev, ...(ms ?? [])]
					})
				}
			}
		},
		[isAuthed]
	)

	// Save all scores locally and submit the score to the DB if it's good enough.
	useAsyncEffect(
		async (mounted) => {
			if (won) {
				let score = {
					game_id,
					user_id: user?.uid ?? null,
					uname: user?.uname ?? null,
					difficulty,
					time_sec: timeMS / 1000,
					created_at: DateTime.now().toString(),
					submitted: false,
				}
				if (isRealisticScore(score)) {
					score = await postScore(score, myScores)
					if (mounted && !myScores.some((sc) => score.game_id === sc.game_id)) {
						setMyScores((prev) => [...prev, score])
					}
				}
			}
		},
		[gameState]
	)

	return (
		<Root {...props}>
			<Modal isShown={modalShown} onClose={() => setModalShown(false)}>
				<SocialLogin reason="To submit your scores to the global leaderboard you need to be signed-in!" />
			</Modal>
			<MainTabs
				data={[
					{
						id: "ms-myScores",
						header: "My Scores",
						content: <SubTabs data={myScores} addSubmitColumn submitScore={submitScore} />,
					},
					{
						id: "ms-globalLeaderboard",
						header: (
							<LbTabWrap>
								<span>Leaderboard</span>
								<RefreshBtn
									tag="div"
									variant="outline"
									svg={SvgRefresh}
									onClick={async (e) => {
										e.stopPropagation()
										await refreshLeaderboard()
									}}
								/>
							</LbTabWrap>
						),
						content: <SubTabs data={leaderboard} />,
					},
				]}
			/>
		</Root>
	)
}

export default Leaderboard
