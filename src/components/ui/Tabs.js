import React, { useState } from 'react'
import styled, { css } from 'styled-components/macro'

import { opac, themes } from '../../shared/shared'
import { ButtonBase } from './Button'

/* --------------------------------- STYLES --------------------------------- */

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

const Root = styled.div`
	border: 1px solid ${dark.mainColor};
	background: ${light.mainColor};
`

const TabsHeader = styled.div`
	overflow: hidden;
	background: ${opac(0.2, dark.mainColor)};
`

/* -------------------------------- COMPONENT ------------------------------- */

const Tabs = ({ children, ...props }) => {
	const [content, setContent] = useState(children[0])

	return (
		<Root {...props}>
			<TabsHeader>
				{children.map((ele) => (
					<TabButton key={ele.props.title} isFocused={content === ele} onClick={() => setContent(ele)}>
						{ele.props.title}
					</TabButton>
				))}
			</TabsHeader>
			{content}
		</Root>
	)
}

export default Tabs
