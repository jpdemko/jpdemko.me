import React from 'react'
import styled, { css } from 'styled-components/macro'
import { transparentize, mix } from 'polished'

import { propStartsWith } from '../../shared/helpers'
import { sharedFlags, sharedCSS } from '../../shared/variables'

const Button = styled.button.attrs(({ disabled, size, variant, color, SVG, adjustSVG }) => {
	let extraProps = {
		buttonCSS: {
			fontSize: '1em',
			sidePadding: '.6em',
			verticalPadding: '.25em',
			...sharedCSS.themes.mono,
		},
		disabled: disabled ? disabled : false,
	}

	// Default style changes based on incoming 'size' (small/default/large) prop.
	if (propStartsWith(size, 's')) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			fontSize: '.8em',
			sidePadding: '.5em',
			verticalPadding: '.2em',
		}
	} else if (propStartsWith(size, 'l')) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			fontSize: '1.2em',
		}
	}

	// Default style changes based on incoming 'color' (default/blue/red) prop and/or
	// 'variant' (default/outlined/fancy) prop.
	if (propStartsWith(variant, 'f') || propStartsWith(color, 'b')) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...sharedCSS.themes.blue,
		}
	}
	if (propStartsWith(color, 'r')) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...sharedCSS.themes.red,
		}
	}

	// Default style changes based on incoming 'SVG' and/or 'adjustSVG' prop.
	if (SVG) {
		let translation = {}
		if (adjustSVG) {
			const translateType = `translate${sharedFlags.isChrome ? '' : '3d'}`
			const adjustment = `${adjustSVG}${sharedFlags.isChrome ? '' : ', 0'}`
			translation = { adjustSVG: `${translateType}(${adjustment})` }
		}
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...translation,
			sidePadding: `calc(${extraProps.buttonCSS.sidePadding} / 2)`,
			verticalPadding: `calc(${extraProps.buttonCSS.verticalPadding} / 2)`,
		}
	}

	return extraProps
})`
	display: inline-flex;
	justify-content: center;
	align-items: center;
	border: none;
	background: none;
	text-transform: uppercase;
	transition: opacity 0.2s, background 0.15s, box-shadow 0.15s, outline 0.1s;
	font-weight: 500;
	outline: none;
	${({ buttonCSS, disabled, adjustSVG }) => css`
		padding: ${buttonCSS.verticalPadding} ${buttonCSS.sidePadding};
		color: ${buttonCSS.mainColor};
		opacity: ${disabled ? 0.33 : 1};
		font-size: ${buttonCSS.fontSize};
		cursor: ${disabled ? 'default' : 'pointer'};
		svg {
			${adjustSVG && `transform: translate(${adjustSVG});`}
		}
		svg + span {
			margin: ${buttonCSS.verticalPadding} ${buttonCSS.sidePadding};
		}
		&:focus {
			background: ${transparentize('.75', buttonCSS.mainColor)};
		}
		&:hover {
			background: ${transparentize('.65', buttonCSS.mainColor)};
		}
		&:active {
			background: ${transparentize('.55', buttonCSS.mainColor)};
			outline: 2px solid ${transparentize('.25', buttonCSS.mainColor)};
		}
	`}
`

const OutlinedButton = styled(Button)`
	${({ buttonCSS }) => css`
		border: 1px solid ${buttonCSS.mainColor};
		&:active {
			outline: 1px solid ${transparentize('.25', buttonCSS.mainColor)};
		}
	`}
`

const FancyButton = styled(Button)`
	color: white;
	${({ buttonCSS }) => {
		const mixedColors = mix('.6', buttonCSS.mainColor, buttonCSS.altColor)
		return css`
			${buttonCSS.gradient}
			box-shadow: 0 1px 6px 1px ${transparentize('.4', mixedColors)};
			&:focus {
				${buttonCSS.gradient}
				outline: 1px solid ${buttonCSS.mainColor};
			}
			&:hover {
				${buttonCSS.gradient}
				opacity: 0.8;
			}
			&:active {
				${buttonCSS.gradient}
				box-shadow: 0 1px 10px 3px ${transparentize('.7', mixedColors)};
				opacity: 1;
			}
		`
	}}
`

export default function({ variant, SVG, children, ...props }) {
	let ButtonVariant = Button
	if (variant) {
		// 'variant' prop (default/outlined/fancy)
		if (propStartsWith(variant, 'o')) ButtonVariant = OutlinedButton
		else if (propStartsWith(variant, 'f')) ButtonVariant = FancyButton
	}

	return (
		<ButtonVariant {...props}>
			{SVG && <SVG />}
			{children && <span>{children}</span>}
		</ButtonVariant>
	)
}
