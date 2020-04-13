import React from "react"
import styled, { css } from "styled-components/macro"

import { opac, themes } from "../../shared/shared"
import { useCorrectTheme } from "../../shared/hooks"

/* --------------------------------- STYLES --------------------------------- */

export const ButtonBase = styled.button.attrs(({ size = 1, svg, theme, color, ...props }) => {
	let sizeModifier = 1
	if (size) {
		if (size === "small") sizeModifier = 0.75
		else if (size === "large") sizeModifier = 1.25
	}

	let varCSS = {
		...props,
		theme,
		fontSize: `calc(1em * ${sizeModifier})`,
		sidePadding: `calc(0.8em * ${sizeModifier})`,
		verticalPadding: `calc(0.4em * ${sizeModifier})`,
		calcColor: !color ? theme.contrast : theme.color,
		// calcColor: theme.accent,
	}

	if (svg) {
		varCSS = {
			...varCSS,
			sidePadding: `calc(${varCSS.sidePadding} / 1.5)`,
			verticalPadding: `calc(${varCSS.verticalPadding} / 1.5)`,
		}
	}

	return { varCSS }
})`
	display: inline-flex;
	justify-content: center;
	border: none;
	background: none;
	transition: 0.175s;
	outline: none;
	font-weight: 500;
	${({ theme, varCSS, disabled, column, isFocused, color }) => css`
		flex-direction: ${column ? "column" : "row"};
		align-items: ${column ? "stretch" : "center"};
		box-shadow: 0 0 0 0 ${theme.accent};
		font-size: ${varCSS.fontSize};
		padding: ${varCSS.verticalPadding} ${varCSS.sidePadding};
		color: ${varCSS.calcColor};
		opacity: ${disabled ? 0.33 : 1};
		cursor: ${disabled ? "default" : "pointer"};
		> span {
			padding: ${column ? `${varCSS.verticalPadding} 0 0 0` : `0 0 0 ${varCSS.sidePadding}`};
			flex: 0 0 auto;
		}
		${isFocused && `background: ${opac(0.3, varCSS.calcColor)};`}
	`}
	> svg {
		flex: 1 0 auto;
	}
`

const BasicButton = styled(ButtonBase)`
	${({ theme, varCSS }) => css`
		&:focus {
			background: ${opac(0.3, varCSS.calcColor)};
		}
		&:hover {
			background: ${opac(0.15, varCSS.calcColor)};
		}
		&:active {
			background: ${opac(0.4, varCSS.calcColor)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	${({ theme, varCSS }) => css`
		box-shadow: 0 0 0 1px ${varCSS.calcColor};
		&:active {
			box-shadow: 0 0 0 3px ${varCSS.calcColor};
		}
	`}
`

const FancyButton = styled(ButtonBase)`
	${({ theme, isFocused, varCSS }) => css`
		color: ${varCSS.calcColor};
		background: ${theme.color};
		box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 1px ${theme.accent};
		opacity: 1;
		&:focus {
			box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 2px ${theme.accent};
			opacity: 0.9;
		}
		&:hover {
			box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 2px ${theme.accent};
			opacity: 0.9;
		}
		&:active {
			box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 4px ${theme.accent};
			opacity: 1;
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Button({ tag, variant, color, disabled = false, children, ...props }) {
	let ButtonVariant = BasicButton
	if (variant) {
		if (variant.includes("outline")) ButtonVariant = OutlinedButton
		else if (variant === "fancy") ButtonVariant = FancyButton
	}
	const themeProps = useCorrectTheme(color)

	return (
		<ButtonVariant {...props} as={tag} disabled={disabled} {...themeProps}>
			{props.svg && <props.svg />}
			{children && <span>{children}</span>}
		</ButtonVariant>
	)
}

export default Button
