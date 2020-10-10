import * as React from "react"
import styled, { css } from "styled-components/macro"
import { DateTime } from "luxon"
import throttle from "lodash/throttle"

import Button from "../ui/Button"
import HorizLine from "../ui/HorizLine"
import { ReactComponent as UserSVG } from "../../shared/assets/icons/user.svg"
import { opac } from "../../shared/shared"
import { useEventListener } from "../../shared/hooks"
import { transpileModule } from "typescript"

/* --------------------------------- STYLES --------------------------------- */

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
	> div:last-child {
		margin-bottom: 0;
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
	`}
`

const Row = styled.div`
	max-width: 90%;
	${({ authored }) => css`
		align-self: ${authored ? "flex-end" : "flex-start"};
	`}
`

const Info = styled.div`
	display: flex;
	> * {
		flex: 0 0 auto;
	}
	align-items: flex-start;
	${({ authored }) => css`
		flex-direction: ${authored ? "row" : "row-reverse"};
	`}
`

const ContentBG = styled.div`
	${({ theme }) => css`
		background: ${theme.color};
		border: 1px solid ${theme.accent};
	`}
`

const Content = styled.div`
	padding: var(--logs-padding) calc(var(--logs-padding) * 2);
	${({ theme, authored }) => css`
		background: ${opac(authored ? 0.25 : 1, theme.background)};
	`}
`

const Lessen = styled.span`
	opacity: 0.75;
	font-size: 0.8em;
	${({ authored }) =>
		authored &&
		css`
			margin-left: var(--logs-padding);
		`}
`

/* ------------------------------- COMPONENTS ------------------------------- */

function Msg({ data, authored, sendDM, ...props }) {
	const { uid, uname, mid, msg, created_at } = data

	if (!mid) return null

	const relativeTime = DateTime.fromISO(created_at).toLocal().toRelative()
	const preciseTime = DateTime.fromISO(created_at).toLocal().toFormat("t")
	return (
		<Row {...props} authored={authored}>
			<ContentBG>
				<Content authored={authored}>{msg}</Content>
			</ContentBG>
			<Info authored={authored}>
				<Button svg={UserSVG} isFocused={authored} onClick={() => sendDM(uid)}>
					{uname}
				</Button>
				<Lessen authored={authored}>
					{relativeTime} at {preciseTime}
				</Lessen>
			</Info>
		</Row>
	)
}

function Logs({ data, user, ...props }) {
	const rootRef = React.useRef()
	const [followLast, setFollowLast] = React.useState(null)

	// TODO Add button that scrolls to bottom and pins. Should only showup if !followLast.
	const scroll2end = React.useCallback(() => {
		if (rootRef.current) rootRef.current.scrollTop = rootRef.current.scrollHeight
		if (!followLast) setFollowLast(true)
	}, [followLast])

	const msgsLength = Object.keys(data.msgs).length
	React.useEffect(() => {
		if (followLast === null) {
			const horizLine = document.getElementById("chat-unread-msgs-start")
			if (horizLine) horizLine.scrollIntoView({ block: "center" })
			else scroll2end()
		} else if (followLast) scroll2end()
	}, [msgsLength, followLast, scroll2end])

	const handleScrolling = React.useCallback(
		throttle(() => {
			const root = rootRef.current
			const { height: rootHeight } = root.getBoundingClientRect()
			const atBottom = rootHeight + root.scrollTop === root.scrollHeight
			setFollowLast(atBottom)
		}, 1000),
		[rootRef.current]
	)
	useEventListener("scroll", handleScrolling, rootRef)

	function getMsgs() {
		if (data?.msgs?.length < 1) return null

		let foundUnread = false
		const mids = Object.keys(data.msgs).filter((key) => isNaN(data.msgs[key]))
		return mids.map((mid, i) => {
			const msg = data.msgs[mid]
			let HL = null
			if (!foundUnread && msg?.unread) {
				foundUnread = true
				HL = <HorizLine id="chat-unread-msgs-start">NEW MESSAGES BELOW</HorizLine>
			}
			return (
				<React.Fragment key={mid}>
					{HL}
					<Msg
						data={msg}
						authored={user.uid == msg.uid}
						id={i === mids.length - 1 ? "last-msg" : null}
					/>
				</React.Fragment>
			)
		})
	}

	return (
		<LogsRoot {...props} ref={rootRef} id="logs-root">
			{getMsgs()}
		</LogsRoot>
	)
}

export default Logs
