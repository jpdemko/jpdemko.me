import React from 'react'
import styled, { css } from 'styled-components/macro'

import { ButtonBase } from './Button'
import { usePrevious } from '../../shared/hooks'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ theme }) => css`
		background: ${theme.mainColor};
		border: 2px solid ${theme.mixedColor};
	`}
`

const TabButton = styled(ButtonBase)`
	${({ isFocused, theme }) => css`
		color: ${theme.contrastColor};
		opacity: ${isFocused ? 1 : 0.65};
		background: ${isFocused ? theme.mainColor : null};
		border-right: 2px solid ${theme.mixedColor};
		border-bottom: 2px solid ${!isFocused ? theme.mixedColor : theme.mainColor};
	`}
`

const TabsHeader = styled.div`
	font-weight: 500;
	flex: 0 0 auto;
	display: flex;
	overflow-x: auto;
	${({ theme }) => css`
		background: ${theme.gradient};
		> * {
			flex: 0 0 auto;
		}
	`}
`

const SelectedContent = styled.div`
	flex: 1 1 auto;
	position: relative;
	overflow-y: auto;
`

const TabContents = styled.div`
	height: 100%;
	${({ isFocused, theme }) => css`
		background: ${theme.mainColor};
		color: ${theme.contrastColor};
		position: ${isFocused ? 'initial' : 'absolute'};
		display: ${isFocused ? 'initial' : 'none'};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const defaultContent = [{ id: 1, tabHeader: null, tabContent: null }]

function Tabs({ content = defaultContent, ...props }) {
	const [focusedID, setFocusedID] = React.useState(content[0].id)

	const prevContentLength = usePrevious(content?.length)
	React.useEffect(() => {
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
					<TabButton key={`tab-header-${id}`} isFocused={id === focusedID} onClick={() => setFocusedID(id)}>
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
