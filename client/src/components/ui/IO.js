import { forwardRef, useRef } from "react"
import styled, { css } from "styled-components/macro"
import { useCorrectTheme } from "../../shared/hooks"

const Label = styled.label`
	pointer-events: none;
	transition: all 0.25s;
	position: absolute;
	font-weight: 400;
	line-height: 1;
	padding: calc(var(--input-padding) / 2) var(--input-padding);
	top: 50%;
	left: calc(var(--input-padding) * 2);
	transform-origin: center left;
	transform: translate3d(0, -50%, 0);
	${({ theme }) => css`
		color: ${theme.bgContrast};
		background: inherit;
	`}
`

const Root = styled.div`
	--input-padding: 0.25em;
	display: inline-block;
	width: 25ch;
	position: relative;
	margin: calc(var(--input-padding) * 3);
	background: inherit;
	${({ theme, value }) => {
		const labelCSS = css`
			${Label} {
				color: ${theme.highlight};
				top: 0;
				font-weight: bold;
				transform: translate3d(0, -54%, 0) scale(0.8);
			}
		`
		return value
			? labelCSS
			: css`
					&:focus-within {
						${labelCSS}
					}
			  `
	}}
`

const StyledInput = styled.input`
	outline: none;
	width: 100%;
	transition: all 0.25s;
	padding: var(--input-padding) calc(var(--input-padding) * 2);
	${({ theme }) => css`
		color: ${theme.primaryContrast};
		box-shadow: 0 0 0 0 ${theme.accent};
		border: 1px solid ${theme.accent};
		&:active,
		&:focus {
			box-shadow: 0 0 0 1px ${theme.accent};
		}
		&::placeholder {
			transition: opacity 0.25s;
			opacity: 0;
			font-style: italic;
			font-size: 0.8em;
		}
		&:active::placeholder,
		&:focus::placeholder {
			opacity: 0.6;
		}
	`}
`

const Error = styled.span`
	pointer-events: none;
	transition: all 0.25s;
	position: absolute;
	font-weight: bold;
	font-size: 0.8em;
	line-height: 1;
	padding-top: var(--input-padding);
	top: 100%;
	left: 0;
	${({ theme, validError }) => css`
		color: ${theme.primary};
		opacity: ${validError ? 1 : 0};
	`}
`

/**
 * If label prop is provided, be sure to set parent element background to a color or as 'inherit'.
 * Otherwise the label will intersect w/ the border of the input.
 */
export const Input = forwardRef(
	({ value, error, placeholder, className, setTheme, label, id, ...props }, ref) => {
		const idRef = useRef(id ?? new Date().getTime())

		const validError = error && error?.length > 0
		if (validError) setTheme = "red"

		const themeProps = useCorrectTheme({ setTheme })

		return (
			<Root {...themeProps} className={className} value={value}>
				{label && <Label htmlFor={`${idRef.current}`}>{label}</Label>}
				<StyledInput
					{...themeProps}
					{...props}
					ref={ref}
					value={value}
					placeholder={placeholder}
					id={`${idRef.current}`}
				/>
				<Error {...themeProps} validError={validError} className="chLimit">
					ERROR: {error}
				</Error>
			</Root>
		)
	}
)

/* -------------------------------------------------------------------------- */

export const MsgBox = styled.textarea`
	outline: none;
	min-height: var(--nav-height);
	height: 100%;
	width: 100%;
	resize: none;
	overflow: auto;
	${({ theme }) => css`
		border: 1px solid ${theme.accent};
		color: ${theme.bgContrast};
		padding: 0.25em 0.5em;
		box-shadow: 0 0 0 0 ${theme.accent};
		&:active,
		&:focus {
			box-shadow: 0 0 0 1px ${theme.accent};
		}
	`}
`
