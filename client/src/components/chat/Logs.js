import { memo, useState, useRef, useEffect, useCallback, Fragment, useMemo } from "react"
import styled, { css, keyframes } from "styled-components/macro"
import { DateTime, Interval } from "luxon"
import Linkify from "react-linkify"

import Button from "../ui/Button"
import Link from "../ui/Link"
import { ReactComponent as SvgUser } from "../../shared/assets/material-icons/user.svg"
import { ReactComponent as SvgArrowDownCircle } from "../../shared/assets/material-icons/arrow-down-circle.svg"
import { ReactComponent as SvgBlock } from "../../shared/assets/material-icons/block.svg"
import { useEventListener, usePrevious, useThrottle } from "../../shared/hooks"
import { Debug } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Row = styled.div`
	max-width: 90%;
	${({ authored }) => css`
		align-self: ${authored ? "flex-end" : "flex-start"};
	`}
`

const LogsRoot = styled.div`
	flex: 30 1;
	display: flex;
	flex-direction: column;
	padding: 0 var(--chat-padding);
	overflow-y: auto;
	overflow-x: hidden;
	> div {
		margin-top: calc(var(--chat-padding) * 1.25);
		&:last-child {
			margin-bottom: calc(var(--chat-padding) * 1.25);
		}
	}
	${({ theme }) => css`
		background: ${theme.backgroundAlt};
	`}
`

const Info = styled.div`
	font-size: 0.8em;
	display: flex;
	align-items: center;
	padding: 0 1px;
	> * {
		flex: 0 0 auto;
	}
	button {
		height: 1.2em;
		svg {
			height: 100%;
		}
	}
	${({ authored }) => css`
		flex-direction: ${authored ? "row-reverse" : "row"};
	`}
`

const ContentBG = styled.div`
	${({ theme, authored }) => css`
		background: ${theme.background};
		border-radius: ${!authored ? "1.2em 0" : "0 1.2em"};
	`}
`

const Content = styled.div`
	padding: var(--chat-padding) calc(var(--chat-padding) * 2);
`

const UserBtn = styled(Button)``

const Lessen = styled.span`
	opacity: 0.55;
	font-style: italic;
	margin: 0 var(--chat-padding);
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

const HorizLine = styled.span`
	display: flex;
	text-transform: uppercase;
	font-size: 0.75em;
	font-style: italic;
	${({ theme, children }) => css`
		color: ${theme.accent};
		&::before,
		&::after {
			content: "";
			flex: 1;
			border-bottom: 1px solid ${theme.accent};
			margin: auto;
		}
		${children &&
		css`
			&::before {
				margin-right: 1em;
			}
			&::after {
				margin-left: 1em;
			}
		`}
	`}
`

/* ------------------------------- COMPONENTS ------------------------------- */

// eslint-disable-next-line no-unused-vars
const debug = new Debug("Logs: ", true)

// react-linkify docs are completely wrong, there is no 'component' prop, but I can abuse the
// 'componentDecorator' prop which you can override what they were doing for yourself.
const linkifyCompDec = (href, text, key) => (
	<Link href={href} key={key}>
		{text}
	</Link>
)

const Log = memo(({ user, ban, data, authored, openDM, id, children }) => {
	const { uid, uname, mid, dmid, created_at } = data
	if (!mid && !dmid) return null

	const relativeTime = DateTime.fromISO(created_at).toLocal().toRelative()
	const preciseTime = DateTime.fromISO(created_at).toLocal().toFormat("t")

	return (
		<Row authored={authored} id={id}>
			<ContentBG authored={authored}>
				<Content>
					<Linkify componentDecorator={linkifyCompDec}>{children}</Linkify>
				</Content>
			</ContentBG>
			<Info authored={authored}>
				{user?.access === "admin" && user?.uid != uid && (
					<Button svg={SvgBlock} onClick={() => ban(data)} setTheme="red" setColor="primary" />
				)}
				<UserBtn
					svg={SvgUser}
					isFocused={authored}
					onClick={() => openDM({ uid, uname })}
					setColor="highlight"
				>
					{uname}
				</UserBtn>
				<Lessen authored={authored}>
					{relativeTime} at {preciseTime}
				</Lessen>
			</Info>
		</Row>
	)
})

function Logs({ data, user, openDM, roomsShown, inputSent, ban, ...props }) {
	const rootRef = useRef()
	const [followLast, setFollowLast] = useState(null)

	const logType = roomsShown ? "msgs" : "dms"
	const logsLength = data?.[logType] ? Object.keys(data[logType]).length : 0
	const totalUnread = data?.[logType]?.totalUnread

	const throtScroll = useThrottle(() => {
		const ele = rootRef.current
		if (ele) {
			const { height: rootHeight } = ele.getBoundingClientRect()
			const pxFromBot = ele.scrollHeight % (Math.round(rootHeight) + ele.scrollTop)
			setFollowLast(pxFromBot < 32)
		}
	}, 1000)
	useEventListener(rootRef, "scroll", throtScroll)

	const scroll2end = useCallback(() => {
		const ele = rootRef.current
		if (ele) {
			ele.scrollTop = ele.scrollHeight
			throtScroll()
		}
		if (!followLast) setFollowLast(true)
	}, [followLast, throtScroll])

	// Determine where to scroll on fresh start or following updates.
	useEffect(() => {
		if (followLast === null) {
			const horizLine = document.getElementById("chat-unread-start")
			if (horizLine) horizLine.scrollIntoView({ block: "center" })
			else scroll2end()
		} else if (followLast) scroll2end()
	}, [logsLength, followLast, scroll2end])

	// I want to scroll to the end if the user sends a message. Have to implement this w/ parent
	// state change since <ChatInput /> is sibling.
	const prevInputSent = usePrevious(inputSent)
	useEffect(() => {
		if (prevInputSent !== inputSent) scroll2end()
	}, [inputSent, prevInputSent, scroll2end])

	// Want to limit renders and prevent a bunch of logic inside the JSX of the hook.
	const groupedData = useMemo(() => {
		if (logsLength < 1) return null

		// Remove non id keys like { unread: true } instead of { 12: {} }
		const ids = Object.keys(data[logType]).filter((id) => !isNaN(id))

		// Need to quickly find, copy, and add properties of logs for returned data.
		function getLog(i) {
			if (i < ids.length) {
				const log = { ...data[logType][ids[i]], id: ids[i] }
				if (log) log.dt = DateTime.fromISO(log.created_at)
				return log
			}
			return {}
		}

		// For a cleaner UI, I want to group logs from the same person which are submitted in quick succession.
		let allLogs = [] // Going for an array of arrays [p1:[1,2], p2:[4], p1:[8,9]]
		for (let i = 0, j = 0; i < ids.length; ) {
			let logs = []
			let curLog = getLog(i)
			logs.push(curLog)
			let nextLog = getLog(++j)
			// If consecutive logs are from the same person within 2 minutes then add them to the array group.
			if (!curLog?.interval && nextLog?.uid == curLog?.uid) {
				curLog.groupMsgsInt = Interval.fromDateTimes(curLog.dt, curLog.dt.plus({ minutes: 2 }))
			}
			while (curLog?.uid == nextLog?.uid && curLog?.groupMsgsInt?.contains(nextLog.dt)) {
				logs.push(nextLog)
				nextLog = getLog(++j)
			}
			allLogs.push(logs)
			i = j
		}

		let foundUnread = false
		// Go through the mapped logs (array of arrays) and properly layout the JSX.
		return allLogs.map((logGroup, i) => {
			const lastLog = logGroup?.[logGroup.length - 1]
			let HL = null
			// QoL for returning users to make sure their focus is returned to their last read location.
			if (!foundUnread && lastLog?.unread) {
				foundUnread = true
				HL = <HorizLine id="chat-unread-start">NEW MESSAGES BELOW</HorizLine>
			}
			return !lastLog ? null : (
				<Fragment key={`${lastLog.uid}-${i}`}>
					{HL}
					<Log
						data={lastLog}
						authored={user.uid == lastLog.uid}
						id={i === allLogs.length - 1 ? "logs-end" : null}
						openDM={openDM}
						user={user}
						ban={ban}
					>
						{logGroup.map((log, i) => (
							<div key={log?.dmid || log?.mid}>{log.msg}</div>
						))}
					</Log>
				</Fragment>
			)
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, logType, logsLength, totalUnread])

	return (
		<>
			<LogsRoot {...props} ref={rootRef} id="logs-root">
				{groupedData}
			</LogsRoot>
			{!followLast && (
				<CenterChildrenDiv>
					<SnapEndBtn onClick={scroll2end} svg={SvgArrowDownCircle} setColor="highlight" />
				</CenterChildrenDiv>
			)}
		</>
	)
}

export default Logs
