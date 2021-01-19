import { memo, useState, useRef, useEffect, useCallback, Fragment } from "react"
import styled, { css, keyframes } from "styled-components/macro"
import { DateTime } from "luxon"
import throttle from "lodash/throttle"

import Button from "../ui/Button"
import HorizLine from "../ui/HorizLine"
import { ReactComponent as SvgUser } from "../../shared/assets/material-icons/user.svg"
import { ReactComponent as SvgArrowDownCircle } from "../../shared/assets/material-icons/arrow-down-circle.svg"
import { useEventListener, usePrevious } from "../../shared/hooks"

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
		margin-top: var(--chat-padding);
	}
	> ${Row}:last-child {
		margin-bottom: var(--chat-padding);
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
	button {
		font-size: 0.8em;
	}
	align-items: flex-start;
	${({ authored }) => css`
		flex-direction: ${authored ? "row-reverse" : "row"};
	`}
`

const ContentBG = styled.div`
	${({ theme, authored }) => css`
		background: ${theme.background};
		border: 1px solid ${authored ? theme.highlight : theme.accent};
	`}
`

const Content = styled.div`
	padding: var(--chat-padding) calc(var(--chat-padding) * 2);
`

const Lessen = styled.span`
	opacity: 0.75;
	font-size: 0.8em;
	${({ authored }) => css`
		margin-${authored ? "right" : "left"}: var(--chat-padding);
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

const Log = memo(({ data, authored, openDM, id }) => {
	const { uid, uname, mid, dmid, msg, created_at } = data
	if (!mid && !dmid) return null

	const relativeTime = DateTime.fromISO(created_at).toLocal().toRelative()
	const preciseTime = DateTime.fromISO(created_at).toLocal().toFormat("t")
	return (
		<Row authored={authored} id={id}>
			<ContentBG authored={authored}>
				<Content>{msg}</Content>
			</ContentBG>
			<Info authored={authored}>
				<Button svg={SvgUser} isFocused={authored} onClick={() => openDM({ uid, uname })}>
					{uname}
				</Button>
				<Lessen authored={authored}>
					{relativeTime} at {preciseTime}
				</Lessen>
			</Info>
		</Row>
	)
})

function Logs({ data, user, openDM, roomsShown, inputSent, ...props }) {
	const rootRef = useRef()
	const [followLast, setFollowLast] = useState(null)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleScrolling = useCallback(
		throttle(() => {
			const ele = rootRef.current
			if (ele) {
				const { height: rootHeight } = ele.getBoundingClientRect()
				const pxFromBot = ele.scrollHeight % (Math.round(rootHeight) + ele.scrollTop)
				setFollowLast(pxFromBot < 32)
			}
		}, 1000),
		[rootRef.current]
	)
	useEventListener("scroll", handleScrolling, rootRef)

	const scroll2end = useCallback(() => {
		const ele = rootRef.current
		if (ele) {
			ele.scrollTop = ele.scrollHeight
			handleScrolling()
		}
		if (!followLast) setFollowLast(true)
	}, [followLast, handleScrolling])

	const type = roomsShown ? "msgs" : "dms"
	// Determine where to scroll on fresh start or following updates.
	const logsLength = data?.[type] ? Object.keys(data[type]).length : 0
	useEffect(() => {
		if (followLast === null) {
			const horizLine = document.getElementById("chat-unread-start")
			if (horizLine) horizLine.scrollIntoView({ block: "center" })
			else scroll2end()
		} else if (followLast) scroll2end()
	}, [logsLength, followLast, scroll2end])

	// We want to scroll to the end if the user sends a message. Have to implement this w/ parent
	// state change since <ChatInput /> is sibling.
	const prevInputSent = usePrevious(inputSent)
	useEffect(() => {
		if (prevInputSent !== inputSent) scroll2end()
	}, [inputSent, prevInputSent, scroll2end])

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
					<SnapEndBtn onClick={scroll2end} svg={SvgArrowDownCircle} setColor="highlight" />
				</CenterChildrenDiv>
			)}
		</>
	)
}

export default Logs
