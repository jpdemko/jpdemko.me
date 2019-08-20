import React, { useState } from 'react'
import styled, { css } from 'styled-components/macro'

import { opac } from '../../shared/helpers'
import { themes } from '../../shared/variables'
import { ButtonBase } from './Button'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const { dark, light } = themes

const TabButton = styled(ButtonBase)`
	${({ isFocused }) => css`
		border-right: ${isFocused ? 'none' : `1px solid ${opac(0.2, dark.mainColor)}`};
		background: ${isFocused ? light.mainColor : opac(0.1, dark.mainColor)};
		&:focus {
			background: ${isFocused ? light.mainColor : opac(0.2, dark.mainColor)};
		}
		&:hover {
			background: ${isFocused ? opac(0.8, light.mainColor) : opac(0.2, dark.mainColor)};
		}
	`}
`

const TabsRoot = styled.div`
	border: 1px solid ${dark.mainColor};
	background: ${light.mainColor};
`

const TabsHeader = styled.div`
	overflow: hidden;
	background: ${opac(0.2, dark.mainColor)};
`

/* ----------------------------- TABS COMPONENT ----------------------------- */

const Tabs = ({ children }) => {
	const [content, setContent] = useState(children[0])

	return (
		<TabsRoot>
			<TabsHeader>
				{children.map((ele) => (
					<TabButton key={ele.props.title} isFocused={content === ele} onClick={() => setContent(ele)}>
						{ele.props.title}
					</TabButton>
				))}
			</TabsHeader>
			{content}
		</TabsRoot>
	)
}

export default Tabs
