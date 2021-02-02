import { forwardRef, useContext, useRef } from "react"
import styled, { css, ThemeContext } from "styled-components/macro"

import ThemeCheck from "./ThemeCheck"
import { ReactComponent as SvgError } from "../../shared/assets/material-icons/error.svg"
import { opac } from "../../shared/shared"

const InpRoot = styled.div`
	--input-padding: 0.25em;
	display: inline-block;
	width: 25ch;
	position: relative;
	margin: calc(var(--input-padding) * 3);
	background: inherit;
	${({ theme, hasValue, error }) => {
		const cssLabelChanged = css`
			> label {
				color: ${theme.highlight};
				font-weight: bold;
				top: 0;
				transform: translate3d(0, -52%, 0) scale(0.8);
				letter-spacing: 1px;
			}
		`
		return css`
			${hasValue && cssLabelChanged}
			${error &&
			css`
				* {
					color: ${theme.highlight} !important;
				}
			`}
			&:focus-within {
				${cssLabelChanged}
			}
		`
	}}
`

const StyledInput = styled.input`
	outline: none;
	border-radius: 0;
	width: 100%;
	padding: var(--input-padding) calc(var(--input-padding) * 2);
	transition-property: color, border, box-shadow;
	transition-duration: 0.25s;
	${({ theme }) => css`
		color: ${theme.bgContrast};
		box-shadow: 0 0 0 0 ${theme.accent};
		border: 1px solid ${theme.accent};
		&:focus,
		&:hover {
			border: 1px solid ${theme.highlight};
		}
		&:active {
			box-shadow: 0 0 0 1px ${theme.highlight};
		}
		&::placeholder {
			transition: opacity 0.2s;
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

const Label = styled.label`
	pointer-events: none;
	position: absolute;
	line-height: 1;
	padding: calc(var(--input-padding) / 2) var(--input-padding);
	top: 50%;
	left: calc(var(--input-padding) * 2);
	transition: 0.2s;
	transform-origin: center left;
	transform: translate3d(0, -50%, 0);
	letter-spacing: normal;
	${({ theme, error }) => css`
		${error &&
		css`
			font-weight: bold;
		`}
		color: ${theme.bgContrast};
		background: inherit;
	`}
`

const Error = styled.div`
	pointer-events: none;
	position: absolute;
	font-weight: bold;
	font-size: 0.8em;
	line-height: 1;
	padding: calc(var(--input-padding) * 1.2);
	top: 100%;
	left: 0;
	display: flex;
	z-index: 100000;
	svg {
		flex: 0 0 auto;
		margin-right: calc(var(--input-padding) * 1.2);
	}
	> div {
		flex: 1 1;
	}
	${({ theme, error }) => css`
		color: ${theme.primary};
		border-left: 1px solid ${theme.accent};
		border-right: 1px solid ${theme.accent};
		border-bottom: 1px solid ${theme.accent};
		opacity: ${error ? 1 : 0};
		background: ${opac(0.9, theme.bgContrast)};
	`}
`

/**
 * If label prop is provided, be sure to set parent element background to a color or as 'inherit'.
 * Otherwise the label will intersect w/ the border of the input.
 */
export const Input = forwardRef(
	({ value, error, placeholder, className, setTheme, label, id, ...props }, ref) => {
		const idRef = useRef(id ?? Date.now() / 1000)

		const curTheme = useContext(ThemeContext)
		if (error && curTheme?.name === "red") setTheme = "dark"
		else if (error) setTheme = "red"

		return (
			<ThemeCheck {...props} setTheme={setTheme}>
				<InpRoot className={className} hasValue={value?.length > 0} error={error}>
					{label && (
						<Label htmlFor={`${idRef.current}`} error={error}>
							{label}
						</Label>
					)}
					<StyledInput
						{...props}
						ref={ref}
						value={value}
						placeholder={placeholder}
						id={`${idRef.current}`}
						maxLength="100"
					/>
					<Error error={error}>
						<SvgError />
						<div>{error}</div>
					</Error>
				</InpRoot>
			</ThemeCheck>
		)
	}
)

/* -------------------------------------------------------------------------- */

const MbRoot = styled.textarea`
	outline: none;
	min-height: var(--nav-height);
	height: 100%;
	width: 100%;
	resize: none;
	overflow: auto;
	transition-property: color, border, box-shadow;
	transition-duration: 0.25s;
	${({ theme, error, inset }) => css`
		border: 1px solid ${theme.accent};
		color: ${error ? theme.highlight : theme.bgContrast};
		padding: calc(var(--content-spacing) * 0.25) calc(var(--content-spacing) * 0.45);
		box-shadow: ${inset && "inset "}0 0 0 ${error ? "1px" : 0} ${theme.accent};
		&:active,
		&:focus {
			box-shadow: ${inset && "inset "}0 0 0 ${error ? "2px" : "1px"} ${theme.accent};
		}
	`}
`

export function MsgBox({ id, error, setTheme, ...props }) {
	const curTheme = useContext(ThemeContext)
	if (error && curTheme?.name === "red") setTheme = "dark"
	else if (error) setTheme = "red"

	return (
		<ThemeCheck {...props} setTheme={setTheme}>
			<MbRoot {...props} error={error} />
		</ThemeCheck>
	)
}
