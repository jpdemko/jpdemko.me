import React from 'react'
import styled, { css } from 'styled-components/macro'

const Anchor = styled.a`
	text-decoration: none;
	${({ theme, animDuration = 0.175 }) => css`
		color: ${theme.mainColor};
		transition: all ${animDuration}s;
		box-shadow: 0 0.05em 0 0 ${theme.mainColor}, 0 -0.05em 0 0 ${theme.mainColor} inset;
		&:hover {
			color: ${theme.contrastColor};
			box-shadow: 0 0.05em 0 0 ${theme.mainColor}, 0 calc(-0.05em + -1em) 0 0 ${theme.mainColor} inset;
		}
	`}
`

const Link = ({ children, openNewTab = true, ...props }) => {
	return (
		<Anchor {...props} {...(openNewTab && { target: '_blank', rel: 'noopener noreferrer' })}>
			{children}
		</Anchor>
	)
}

export default Link
