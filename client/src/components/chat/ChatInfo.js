import styled, { css } from "styled-components"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 0 auto;
	padding: var(--chat-padding);
	text-align: center;
	${({ theme }) => css`
		background: ${theme.background};
		color: ${theme.bgContrast};
		border-bottom: 1px solid ${theme.accent};
	`}
`

const Lighten = styled.span`
	opacity: 0.75;
	transform: scale(0.75);
`

const Bold = styled.span`
	font-weight: bold;
`

const Quotes = styled(Bold)`
	${({ theme }) => css`
		color: ${theme.primary};
	`}
`

const Preposition = styled.span`
	font-style: italic;
`

const DisplayData = styled.span`
	font-weight: bold;
	${({ theme }) => css`
		color: ${theme.bgContrast};
		> span {
			font-weight: 400;
		}
	`}
`

/* ------------------------------- COMPONENTS ------------------------------- */

function ChatInfo({ data, roomsShown, ...props }) {
	// ROOMS - Chatting in 'General #RID'
	// DMS - Chatting with 'Bob'
	const category = roomsShown ? "ROOMS" : "DMS"
	const preposition = roomsShown ? "in" : "with"
	const displayData = (
		<DisplayData>
			{roomsShown ? data?.rname : data?.recip_uname}
			{roomsShown && <Lighten> #{data?.rid}</Lighten>}
		</DisplayData>
	)
	return (
		<Root {...props}>
			<Bold>{category}</Bold> - <Preposition>Chatting {preposition} </Preposition>
			<Quotes>'{displayData}'</Quotes>
		</Root>
	)
}

export default ChatInfo
