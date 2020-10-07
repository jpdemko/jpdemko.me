import * as React from "react"
import styled, { css } from "styled-components/macro"
import { DateTime } from "luxon"

import Button from "../ui/Button"
import HorizLine from "../ui/HorizLine"
import { ReactComponent as UserSVG } from "../../shared/assets/icons/user.svg"
import { opac } from "../../shared/shared"

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

const ScrollHelper = styled.span`
	padding: 0;
	margin: 0;
	height: 0;
`

/* ------------------------------- COMPONENTS ------------------------------- */

function Msg({ data, authored, ...props }) {
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
				<Button svg={UserSVG} isFocused={authored}>
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
	const scrollHelperRef = React.useRef()

	React.useEffect(() => {
		if (scrollHelperRef.current) scrollHelperRef.current.scrollIntoView({ block: "end" })
	}, [data])

	function getMsgs() {
		let foundUnread = false
		return !data?.msgs
			? null
			: Object.keys(data.msgs).map((mid) => {
					const msg = data.msgs[mid]
					let HL = null
					if (!foundUnread && msg?.unread) {
						foundUnread = true
						HL = <HorizLine>MISSED MESSAGES</HorizLine>
					}
					return (
						<React.Fragment key={mid}>
							{HL}
							<Msg data={msg} authored={user.uid === msg.uid} />
						</React.Fragment>
					)
			  })
	}

	return (
		<LogsRoot>
			{getMsgs()}
			<ScrollHelper ref={scrollHelperRef} />
		</LogsRoot>
	)
}

export default Logs
