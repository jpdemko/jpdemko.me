import styled, { css, keyframes } from "styled-components/macro"

import { opac } from "../../shared/shared"
import { useCorrectTheme } from "../../shared/hooks"

/* --------------------------------- STYLES --------------------------------- */

export const ButtonBase = styled.button.attrs(({ svg, theme, color, ...props }) => {
	let varCSS = {
		...props,
		theme,
		fontSize: `1em`,
		sidePadding: `0.8em`,
		verticalPadding: `0.4em`,
		calcColor: !color ? theme.contrast : theme.color,
	}
	if (svg) {
		varCSS = {
			...varCSS,
			sidePadding: `calc(${varCSS.sidePadding} * 0.5)`,
			verticalPadding: `calc(${varCSS.verticalPadding} * 0.5)`,
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
	position: relative;
	border-radius: 0;
	${({ theme, varCSS, disabled, column, isFocused }) => css`
		flex-direction: ${column ? "column" : "row"};
		align-items: ${column ? "stretch" : "center"};
		box-shadow: 0 0 0 0 ${theme.accent};
		font-size: ${varCSS.fontSize};
		padding: ${varCSS.verticalPadding} ${varCSS.sidePadding};
		color: ${varCSS.calcColor};
		opacity: ${disabled ? 0.33 : 1};
		cursor: ${disabled ? "default" : "pointer"};
		${isFocused && `background: ${opac(0.2, varCSS.calcColor)};`}
		> svg + div {
			padding: 0 ${varCSS.sidePadding};
		}
	`}
`

const BasicButton = styled(ButtonBase)`
	${({ varCSS }) => css`
		&:focus {
			box-shadow: 0 0 0 1px ${varCSS.calcColor};
		}
		&:hover {
			box-shadow: 0 0 0 1px ${varCSS.calcColor};
			background: ${opac(0.3, varCSS.calcColor)};
		}
		&:active {
			background: ${opac(0.4, varCSS.calcColor)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	${({ varCSS }) => css`
		box-shadow: 0 0 0 1px ${varCSS.calcColor};
		&:hover {
			box-shadow: 0 0 0 2px ${varCSS.calcColor};
		}
		&:active {
			box-shadow: 0 0 0 3px ${varCSS.calcColor};
		}
	`}
`

const FancyButton = styled(ButtonBase)`
	${({ theme, varCSS }) => css`
		background: ${theme.color};
		color: ${theme.contrast};
		box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 1px ${theme.accent};
		opacity: 1;
		&:focus,
		&:hover {
			box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 2px ${theme.accent};
			opacity: 0.95;
		}
		&:active {
			box-shadow: 0 1px 10px 1px ${opac(0.2, varCSS.calcColor)}, 0 0 0 4px ${theme.accent};
			opacity: 1;
		}
	`}
`

const BtnContent = styled.div`
	flex: 0 0 auto;
`

const BadgeAnim = ({ theme }) => keyframes`
	0% { box-shadow: 0 0 0 1px ${theme.contrast}; }
	25% { box-shadow: 0 0 0 1px ${theme.highlight}; }
	50% { box-shadow: 0 0 0 1px ${theme.accent}; }
	75% { box-shadow: 0 0 0 1px ${theme.altBackground}; }
	100% { box-shadow: 0 0 0 1px ${theme.contrast}; }
`

const Badge = styled.div`
	position: absolute;
	top: 0;
	left: 100%;
	transform: translate3d(-50%, -50%, 0);
	width: max-content;
	padding: 0 0.4em;
	animation: ${BadgeAnim} 2s linear infinite;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.contrast};
		${FancyButton} & {
			background: ${theme.altBackground};
			border: 1px solid ${theme.accent};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Button({ tag, variant, color, disabled = false, badge, children, ...props }) {
	let ButtonVariant = BasicButton
	if (variant) {
		if (variant.includes("outline")) ButtonVariant = OutlinedButton
		else if (variant === "fancy") ButtonVariant = FancyButton
	}
	const themeProps = useCorrectTheme(color)

	return (
		<ButtonVariant {...props} as={tag} disabled={disabled} {...themeProps}>
			{props.svg && <props.svg />}
			{children && <BtnContent>{children}</BtnContent>}
			{badge && <Badge>{badge}</Badge>}
		</ButtonVariant>
	)
}

export default Button
