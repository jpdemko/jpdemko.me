import React from 'react'
import styled, { css } from 'styled-components/macro'

import { ButtonBase } from './Button'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	flex-direction: column;
	${({ theme }) => css`
		background: ${theme.mainColor};
	`}
`

const TabButton = styled(ButtonBase)`
	${({ isFocused, theme }) => css`
		color: ${theme.bgContrastColor};
		opacity: ${isFocused ? 1 : 0.65};
		border-right: 1px solid ${theme.mixedColor};
	`}
`

const TabsHeader = styled.div`
	font-weight: 500;
	flex: 0 0;
	display: flex;
	${({ headerFilled, theme }) => css`
		background: ${theme.gradient};
		> * {
			flex: ${headerFilled ? 1 : 0} 1 auto;
		}
	`}
`

const SelectedContent = styled.div`
	flex: 1 1;
	position: relative;
`

const TabContents = styled.div`
	${({ isFocused, theme }) => css`
		background: ${theme.mainColor};
		color: ${theme.bgContrastColor};
		position: ${isFocused ? 'initial' : 'absolute'};
		display: ${isFocused ? 'initial' : 'none'};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const defaultContent = [{ id: 1, tabHeader: <div>header#1</div>, tabContent: <div>content#1</div> }]

const Tabs = ({ content = defaultContent, headerFilled = false, ...props }) => {
	const [focusedID, setFocusedID] = React.useState(content[0].id)

	return (
		<Root {...props}>
			<TabsHeader headerFilled={headerFilled}>
				{content.map(({ id, tabHeader }) => (
					<TabButton key={`header#${id}`} isFocused={id === focusedID} onClick={() => setFocusedID(id)}>
						{tabHeader}
					</TabButton>
				))}
			</TabsHeader>
			<SelectedContent>
				{content.map(({ id, tabContent }) => (
					<TabContents key={`content#${id}`} isFocused={id === focusedID}>
						{tabContent}
					</TabContents>
				))}
			</SelectedContent>
		</Root>
	)
}

export default Tabs
