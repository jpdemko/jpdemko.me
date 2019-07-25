import React from 'react'
import styled, { css } from 'styled-components/macro'
import { transparentize, mix } from 'polished'

import { safeTranslate } from '../../shared/helpers'
import { sharedCSS } from '../../shared/variables'

const ButtonBase = styled.button.attrs(({ size = 1, variant, theme, SVG, themeOverride, adjustSVG }) => {
	let sizeModifier = 1
	if (size) {
		if (size === 'small') sizeModifier = 0.75
		else if (size === 'large') sizeModifier = 1.25
	}

	let extraProps = {
		buttonCSS: {
			fontSize: `calc(1em * ${sizeModifier})`,
			sidePadding: `calc(0.6em * ${sizeModifier})`,
			verticalPadding: `calc(0.25em * ${sizeModifier})`,
			...sharedCSS.themes.dark,
		},
	}

	if (themeOverride) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...(themeOverride[0] && { mainColor: themeOverride[0] }),
			...(themeOverride[1] && { altColor: themeOverride[1] }),
		}
	}

	if (variant === 'fancy') theme = 'blue'
	if (theme === 'light') {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...sharedCSS.themes.light,
		}
	} else if (theme === 'blue') {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...sharedCSS.themes.blue,
		}
	} else if (theme === 'red') {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			...sharedCSS.themes.red,
		}
	}

	const {
		buttonCSS: { mainColor, altColor, sidePadding, verticalPadding },
	} = extraProps
	extraProps.buttonCSS.mixedColor = mix(0.5, mainColor, altColor)

	if (SVG) {
		extraProps.buttonCSS = {
			...extraProps.buttonCSS,
			sidePadding: `calc(${sidePadding} / 2)`,
			verticalPadding: `calc(${verticalPadding} / 2)`,
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
		box-shadow: 0 0 0 0px ${buttonCSS.mainColor};
		font-size: ${buttonCSS.fontSize};
		padding: ${buttonCSS.verticalPadding} ${buttonCSS.sidePadding};
		color: ${buttonCSS.mainColor};
		opacity: ${disabled ? 0.33 : 1};
		cursor: ${disabled ? 'default' : 'pointer'};
		&:active {
			box-shadow: 0 0 0 3px ${buttonCSS.mainColor};
		}
		svg {
			${adjustSVG && `transform: ${safeTranslate(adjustSVG)};`}
		}
		svg + span {
			margin: 0 ${buttonCSS.sidePadding};
		}
	`}
`

const BasicButton = styled(ButtonBase)`
	${({ buttonCSS, isFocused }) => css`
		background: ${isFocused ? transparentize(0.8, buttonCSS.mainColor) : 'none'};
		&:focus {
			background: ${transparentize(0.9, buttonCSS.mainColor)};
		}
		&:hover {
			background: ${transparentize(0.7, buttonCSS.mainColor)};
		}
		&:active {
			background: ${transparentize(0.6, buttonCSS.mainColor)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	margin: 1px;
	${({ buttonCSS }) => css`
		box-shadow: 0 0 0 1px ${buttonCSS.mainColor};
	`}
`

const FancyButton = styled(ButtonBase)`
	margin: 1px;
	color: white;
	${({ buttonCSS, isFocused }) => css`
		${buttonCSS.gradient}
		box-shadow: 0 1px 13px 1px ${transparentize(0.6, buttonCSS.mixedColor)};
		opacity: ${isFocused ? 0.85 : 1};
		&:focus {
			opacity: .85;
		}
		&:hover {
			box-shadow:
				0 1px 16px 2px ${transparentize(0.7, buttonCSS.mixedColor)},
				0 0 0 1px ${buttonCSS.mixedColor};
			opacity: .70;
		}
		&:active {
			box-shadow:
				0 1px 20px 2px ${transparentize(0.8, buttonCSS.mixedColor)},
				0 0 0 3px ${buttonCSS.mixedColor};
			opacity: 1;
		}
	`}
`

function Button(props) {
	let ButtonVariant = BasicButton
	if (props.variant) {
		if (props.variant.indexOf('outline') > -1) ButtonVariant = OutlinedButton
		else if (props.variant === 'fancy') ButtonVariant = FancyButton
	}

	return (
		<ButtonVariant {...props}>
			{props.SVG && <props.SVG />}
			{props.children && <span>{props.children}</span>}
		</ButtonVariant>
	)
}
export default Button
