import { memo, useState, useRef, useEffect, useCallback, Fragment } from "react"
import styled, { css, keyframes } from "styled-components/macro"
import { DateTime } from "luxon"
import throttle from "lodash/throttle"

import Button from "../ui/Button"
import HorizLine from "../ui/HorizLine"
import { ReactComponent as UserSVG } from "../../shared/assets/icons/user.svg"
import { ReactComponent as ArrowDownCircleSVG } from "../../shared/assets/icons/arrow-down-circle.svg"
import { opac } from "../../shared/shared"
import { useEventListener } from "../../shared/hooks"

/* --------------------------------- STYLES --------------------------------- */

const Row = styled.div`
	max-width: 90%;
	${({ authored }) => css`
		align-self: ${authored ? "flex-end" : "flex-start"};
	`}
`

const LogsRoot = styled.div`
	--logs-padding: 0.4em;
	flex: 1 1;
	display: flex;
	flex-direction: column;
	padding: var(--logs-padding);
	overflow-y: auto;
	overflow-x: hidden;
	> div {
		margin-bottom: var(--logs-padding);
	}
	> ${Row}:last-child {
		margin-bottom: 0;
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
	`}
`

const Info = styled.div`
	display: flex;
	> * {
		flex: 0 0 auto;
	}
	align-items: flex-start;
	${({ authored }) => css`
		flex-direction: ${authored ? "row-reverse" : "row"};
		${authored &&
		css`
			margin
		`}
	`}
`

const ContentBG = styled.div`
	${({ theme }) => css`
		background: ${theme.background};
		border: 1px solid ${theme.accent};
	`}
`

const Content = styled.div`
	padding: var(--logs-padding) calc(var(--logs-padding) * 2);
	${({ theme, authored }) => css`
		color: ${authored ? theme.primaryContrast : theme.bgContrast};
		background: ${authored ? opac(0.5, theme.highlight) : "none"};
	`}
`

const Lessen = styled.span`
	opacity: 0.75;
	font-size: 0.8em;
	${({ authored }) => css`
		margin-${authored ? "right" : "left"}: var(--logs-padding);
	`}
`

const CenterChildrenDiv = styled.div`
	display: flex;
	justify-content: center;
	position: relative;
	height: 0;
`

const SnapEndBtnAnim = () => keyframes`
	0% { transform: scale3d(1, 1, 1); }
	25% { transform: scale3d(1.2, 1.2, 1); }
	50% { transform: scale3d(1, 1, 1); }
	75% { transform: scale3d(.8, .8, 1); }
	100% { transform: scale3d(1, 1, 1); }
`

const SnapEndBtn = styled(Button)`
	position: absolute;
	bottom: 100%;
	svg {
		animation: ${SnapEndBtnAnim} 4s linear infinite;
	}
`

/* ------------------------------- COMPONENTS ------------------------------- */

const Log = memo(({ data, authored, openDM }) => {
	const { uid, uname, mid, dmid, msg, created_at } = data
	if (!mid && !dmid) return null

	const relativeTime = DateTime.fromISO(created_at).toLocal().toRelative()
	const preciseTime = DateTime.fromISO(created_at).toLocal().toFormat("t")
	return (
		<Row authored={authored}>
			<ContentBG>
				<Content authored={authored}>{msg}</Content>
			</ContentBG>
			<Info authored={authored}>
				<Button svg={UserSVG} isFocused={authored} onClick={() => openDM({ uid, uname })}>
					{uname}
				</Button>
				<Lessen authored={authored}>
					{relativeTime} at {preciseTime}
				</Lessen>
			</Info>
		</Row>
	)
})

function Logs({ data, user, openDM, roomsShown, ...props }) {
	const rootRef = useRef()
	const [followLast, setFollowLast] = useState(null)

	const scroll2end = useCallback(() => {
		if (rootRef.current) rootRef.current.scrollTop = rootRef.current.scrollHeight
		if (!followLast) {
			setFollowLast(true)
		}
	}, [followLast])

	const type = roomsShown ? "msgs" : "dms"
	const logsLength = data?.[type] ? Object.keys(data[type]).length : 0
	useEffect(() => {
		if (followLast === null) {
			const horizLine = document.getElementById("chat-unread-start")
			if (horizLine) horizLine.scrollIntoView({ block: "center" })
			else scroll2end()
		} else if (followLast) scroll2end()
	}, [logsLength, followLast, scroll2end])

	const handleScrolling = useCallback(
		throttle(() => {
			const root = rootRef.current
			const { height: rootHeight } = root.getBoundingClientRect()
			const atBottom = Math.round(rootHeight + root.scrollTop) === Math.round(root.scrollHeight)
			// console.log(`Logs handlecrolling() atBottom: ${atBottom}`)
			setFollowLast(atBottom)
		}, 1000),
		[rootRef.current]
	)
	useEventListener("scroll", handleScrolling, rootRef)

	function getData() {
		if (!data?.[type] || data[type].length < 1) return null

		let foundUnread = false
		const ids = Object.keys(data[type]).filter((key) => isNaN(data[type][key]))
		return ids.map((id, i) => {
			const log = data[type][id]
			let HL = null
			if (!foundUnread && log?.unread) {
				foundUnread = true
				HL = <HorizLine id="chat-unread-start">NEW MESSAGES BELOW</HorizLine>
			}
			return (
				<Fragment key={id}>
					{HL}
					<Log
						data={log}
						authored={user.uid == log.uid}
						id={i === ids.length - 1 ? "logs-end" : null}
						openDM={openDM}
					/>
				</Fragment>
			)
		})
	}

	return (
		<>
			<LogsRoot {...props} ref={rootRef} id="logs-root">
				{getData()}
			</LogsRoot>
			{!followLast && (
				<CenterChildrenDiv>
					<SnapEndBtn onClick={scroll2end} svg={ArrowDownCircleSVG} color="primary" />
				</CenterChildrenDiv>
			)}
		</>
	)
}

export default Logs
