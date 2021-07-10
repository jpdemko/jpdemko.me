import { forwardRef, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import styled, { css, ThemeContext } from "styled-components/macro"
import uniqueId from "lodash/uniqueId"

import ThemeCheck from "./ThemeCheck"
import { ReactComponent as SvgError } from "../../shared/assets/material-icons/error.svg"
import { opac, themes } from "../../shared/shared"
import { Transition } from "react-transition-group"

/* ------------------------------ INPUT STYLES ------------------------------ */

const InpRoot = styled.div`
	--input-padding: 0.25em;
	display: inline-block;
	width: 25ch;
	position: relative;
	margin: calc(var(--input-padding) * 3);
	${({ theme, hasValue, error, stickyLabel }) => {
		const cssLabelChanged = css`
			> label {
				color: ${theme.highlight};
				font-weight: bold;
				top: 0;
				transform: translate3d(0, -52%, 0) scale(0.8);
			}
		`
		return css`
			${(stickyLabel || hasValue) && cssLabelChanged}
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
	padding: calc(var(--input-padding) * 1.25) calc(var(--input-padding) * 2) var(--input-padding);
	transition: color 0.25s, border 0.25s, box-shadow 0.175s;
	${({ theme, stickyLabel }) => {
		const phOpac = 0.6
		return css`
			color: ${theme.backgroundContrast};
			box-shadow: 0 0 0 0 ${theme.accent};
			border: 1px solid ${theme.accent};
			&:focus {
				border: 1px solid ${opac(0.8, theme.highlight)};
			}
			@media (hover) {
				&:hover {
					border: 1px solid ${theme.highlight};
					box-shadow: 0 0 0 1px ${opac(0.5, theme.accent)};
				}
			}
			&:active {
				box-shadow: 0 0 0 2px ${theme.highlight};
			}
			&::placeholder {
				transition: opacity 0.2s;
				opacity: ${stickyLabel ? phOpac : 0};
				font-size: 0.8em;
			}
			&:active::placeholder,
			&:focus::placeholder {
				opacity: ${phOpac};
			}
		`
	}}
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
	${({ theme }) => css`
		color: ${theme.backgroundContrast};
	`}
`

const Error = styled.div`
	pointer-events: none;
	position: absolute;
	font-weight: bold;
	font-size: 0.8em;
	line-height: 1.3;
	padding: calc(var(--input-padding) * 1.2);
	top: 100%;
	left: 0;
	width: 100%;
	display: flex;
	align-items: center;
	z-index: 100000;
	svg {
		flex: 0 0 auto;
		margin-right: calc(var(--input-padding) * 1.2);
	}
	> div {
		flex: 1 1;
		padding: 0.2em;
		padding-left: 0;
	}
	${({ theme, animDuration }) => css`
		transition: ${animDuration}s;
		color: ${theme.primary};
		border-left: 1px solid ${theme.accent};
		border-right: 1px solid ${theme.accent};
		border-bottom: 1px solid ${theme.accent};
		background: ${opac(0.9, theme.backgroundContrast)};
	`}
`

const errStyleStates = {
	entering: { transform: "scale(1.1)", opacity: 1 },
	entered: { transform: "scale(1)", opacity: 1 },
	exiting: { transform: "scale(0)", opacity: 0 },
	exited: { transform: "scale(0)", opacity: 0 },
}

/* ----------------------------- INPUT COMPONENT ---------------------------- */

function getDefaultBg() {
	const div = document.createElement("div")
	document.head.appendChild(div)
	const bg = window.getComputedStyle(div).backgroundColor
	document.head.removeChild(div)
	return bg
}

function getInheritedBgColor(ele) {
	const defaultStyle = getDefaultBg() // typically "rgba(0, 0, 0, 0)"
	const backgroundColor = window.getComputedStyle(ele).backgroundColor
	if (backgroundColor != defaultStyle) return backgroundColor
	if (!ele.parentElement) return defaultStyle
	return getInheritedBgColor(ele.parentElement)
}

// Handle error msg being displayed to user.
function useErrHandlerIO(error, clearError, clearTimerMS = 5000) {
	useEffect(() => {
		if (!error || !clearError) return
		const timer = setTimeout(() => clearError(null), clearTimerMS)
		return () => clearTimeout(timer)
	}, [error, clearError, clearTimerMS])
}

export const Input = forwardRef(
	(
		{
			value = "",
			error,
			clearError,
			placeholder,
			className,
			setTheme,
			label,
			stickyLabel,
			id,
			onChange,
			animDuration = 0.25,
			...props
		},
		ref
	) => {
		const idRef = useRef(id ?? uniqueId("input_"))

		const curTheme = useContext(ThemeContext)
		if (error) setTheme = "red"

		// Handle all the different ways label should animate and or be stuck at the top-left of the input.
		const [hasValue, setHasValue] = useState(() => {
			if (stickyLabel) return true
			else return value ? value?.length > 0 : false
		})
		const [localVal, setLocalVal] = useState(value)
		function wrapOnChange(e) {
			if (!error) {
				const val = e.target.value
				if (onChange) onChange(e)
				else setLocalVal(val)
				if (!stickyLabel) {
					if (hasValue && val.length < 1) setHasValue(false)
					else if (!hasValue && val.length > 0) setHasValue(true)
				}
			}
		}

		// To overlap label w/ border clearnly the label's background needs to be set to the nearest
		// ancestor's background.
		const rootRef = useRef()
		const labelRef = useRef()
		useLayoutEffect(() => {
			if (!rootRef.current || !labelRef.current) return
			const rgba = getInheritedBgColor(rootRef.current)
			labelRef.current.style.backgroundColor = rgba
		}, [curTheme])

		useErrHandlerIO(error, clearError)

		return (
			<ThemeCheck {...props} setTheme={setTheme}>
				<InpRoot
					className={className}
					hasValue={hasValue}
					error={error}
					ref={rootRef}
					stickyLabel={stickyLabel}
				>
					{label && (
						<Label htmlFor={`${idRef.current}`} ref={labelRef}>
							{label}
						</Label>
					)}
					<StyledInput
						{...props}
						ref={ref}
						value={value > localVal ? value : localVal}
						placeholder={placeholder}
						id={`${idRef.current}`}
						maxLength="100"
						onChange={wrapOnChange}
						stickyLabel={stickyLabel}
					/>
					<Transition timeout={animDuration * 1000} in={!!error}>
						{(state) => (
							<Error
								style={{ ...errStyleStates[state] }}
								animDuration={animDuration}
								theme={themes.red}
							>
								<SvgError />
								<div>{error}</div>
							</Error>
						)}
					</Transition>
				</InpRoot>
			</ThemeCheck>
		)
	}
)

/* ------------------------------ MSGBOX STYLES ----------------------------- */

const MbRoot = styled.textarea`
	min-height: 10ch;
	min-width: 30ch;
	outline: none;
	overflow: auto;
	transition-property: color, border, box-shadow;
	transition-duration: 0.25s;
	${({ resizeable, theme, error, inset }) => css`
		resize: ${resizeable ? "both" : "none"};
		padding: calc(var(--content-spacing) * 0.25) calc(var(--content-spacing) * 0.45);
		color: ${error ? theme.highlight : theme.backgroundContrast};
		border: 1px solid ${theme.accent};
		box-shadow: ${inset && "inset "}0 0 0 1px ${opac(0.8, theme.accent)};
		&:focus {
			border: 1px solid ${opac(0.8, theme.highlight)};
			box-shadow: ${inset && "inset "}0 0 0 1px ${opac(0.5, theme.highlight)};
		}
		@media (hover) {
			&:hover {
				border: 1px solid ${theme.highlight};
				box-shadow: ${inset && "inset "}0 0 0 1px ${opac(0.8, theme.accent)};
			}
		}
		&:active {
			border: 1px solid ${theme.highlight};
			box-shadow: ${inset && "inset "}0 0 0 2px ${theme.highlight};
		}
	`}
`

/* ---------------------------- MSGBOX COMPONENT ---------------------------- */

export function MsgBox({ value, error, clearError, onChange, setTheme, defaultValue, ...props }) {
	const curTheme = useContext(ThemeContext)
	if (error && curTheme?.name === "red") setTheme = "dark"
	else if (error) setTheme = "red"

	useErrHandlerIO(error, clearError)

	const [localVal, setLocalVal] = useState(value ?? defaultValue)
	function wrapOnChange(e) {
		if (!error) {
			if (onChange) onChange(e)
			else setLocalVal(e.target.value)
		}
	}

	return (
		<ThemeCheck setTheme={setTheme}>
			<MbRoot {...props} error={error} value={error ?? value ?? localVal} onChange={wrapOnChange} />
		</ThemeCheck>
	)
}

/* ------------------------------ SELECT STYLES ----------------------------- */

const SRoot = styled.select`
	appearance: none;
	border-radius: 0;
	display: inline-block;
	font: inherit;
	line-height: 1.5em;
	margin: 0;
	transition: 0.2s;
	background-repeat: no-repeat;
	background-position: right;

	${({ theme }) => css`
		outline: 0px solid ${theme.accent};
		border: 1px solid ${theme.backgroundContrast};
		color: ${theme.backgroundContrast};

		&:focus {
			outline: 0px solid ${theme.accent};
			border: 1px solid ${theme.accent};
			outline: 0;
		}
	`}

	&:not([multiple]) {
		appearance: none;
	}
`

/* ---------------------------- SELECT COMPONENT ---------------------------- */

export const Select = ({ children, ...props }) => <SRoot {...props}>{children}</SRoot>
