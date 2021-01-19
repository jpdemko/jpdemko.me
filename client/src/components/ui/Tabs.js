import { useState, useEffect } from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"
import { usePrevious } from "../../shared/hooks"
import { opac } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ theme }) => css`
		background: ${theme.altBackground};
		border: 1px solid ${theme.accent};
	`}
`

const TabButton = styled(Button)`
	${({ theme }) => css`
		color: ${theme.bgContrast};
		border-right: 1px solid ${opac(0.6, theme.accent)};
	`}
`

const TabsHeader = styled.div`
	font-weight: bold;
	flex: 0 0 auto;
	display: flex;
	overflow-x: auto;
	> * {
		flex: 0 0 auto;
	}
`

const SelectedContent = styled.div`
	flex: 1 1 auto;
	position: relative;
	overflow-y: auto;
`

const TabContents = styled.div`
	height: 100%;
	${({ isFocused, theme }) => css`
		color: ${theme.bgContrast};
		position: ${isFocused ? "initial" : "absolute"};
		display: ${isFocused ? "initial" : "none"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const defaultContent = [{ id: 1, tabHeader: null, tabContent: null }]

function Tabs({ content = defaultContent, ...props }) {
	const [focusedID, setFocusedID] = useState(content[0].id)

	const prevContentLength = usePrevious(content?.length)
	useEffect(() => {
		if (content?.length !== prevContentLength) {
			if (!content.find((ele) => ele.id === focusedID)) {
				const nextEle = content.find((ele) => ele.id !== focusedID)
				setFocusedID(nextEle ? nextEle.id : null)
			}
		}
	}, [content, focusedID, prevContentLength])

	return (
		<Root {...props}>
			<TabsHeader>
				{content.map(({ id, tabHeader }) => (
					<TabButton
						key={`tab-header-${id}`}
						isFocused={id === focusedID}
						onClick={() => setFocusedID(id)}
						setColor="highlight"
						column
					>
						{tabHeader}
					</TabButton>
				))}
			</TabsHeader>
			<SelectedContent>
				{content.map(({ id, tabContent }) => (
					<TabContents key={`tab-content-${id}`} isFocused={id === focusedID}>
						{tabContent}
					</TabContents>
				))}
			</SelectedContent>
		</Root>
	)
}

export default Tabs
