import * as React from "react"
import styled, { css } from "styled-components/macro"

const InputRoot = styled.input`
	outline: none;
	margin: 1px;
	${({ theme }) => css`
		color: ${theme.contrast};
		box-shadow: 0 0 0 0 ${theme.accent};
		border: 1px solid ${theme.accent};
		&:active,
		&:focus {
			box-shadow: 0 0 0 1px ${theme.accent};
		}
	`}
`

export const Input = React.forwardRef((props, ref) => <InputRoot {...props} ref={ref} />)

export const MsgBox = styled.textarea`
	outline: none;
	min-height: calc(var(--nav-height) * 3);
	height: 100%;
	width: 100%;
	resize: none;
	border: none;
	overflow: auto;
	${({ theme }) => css`
		border-top: 1px solid ${theme.accent};
		color: ${theme.contrast};
		padding: 0.4em 0.8em;
	`}
`
