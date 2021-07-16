import { lighten, saturate } from "polished"
import { forwardRef } from "react"
import styled, { css, keyframes } from "styled-components/macro"

import { opac } from "../../shared/shared"
import ThemeCheck from "./ThemeCheck"

/* --------------------------------- STYLES --------------------------------- */

const Gleam = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	overflow: hidden;
	&::before {
		content: "";
		position: absolute;
		transform: skewX(20deg) translate(-6%, 0);
		transform-origin: top left;
		z-index: 9999;
		background: white;
		opacity: 0.1;
		top: 0;
		right: -23%;
		width: 80%;
		height: 100%;
		transition: 0.225s;
		pointer-events: none;
	}
`

const BtnContent = styled.div`
	flex: 0 0 auto;
`

export const ButtonBase = styled.button.attrs(({ svg, column, reverse, ...props }) => {
	reverse = reverse ? "-reverse" : ""
	let varCSS = {
		...props,
		column,
		horizPad: "0.6em",
		vertPad: "0.4em",
		flexDirection: column ? `column${reverse}` : `row${reverse}`,
		alignItems: column ? "stretch" : "center",
	}
	return varCSS
})`
	position: relative;
	display: inline-flex;
	justify-content: center;
	border: none;
	background: none;
	transition: 0.2s;
	outline: none;
	position: relative;
	border-radius: 0;
	padding: 0;
	${({ flexDirection, alignItems, theme, disabled, column, vertPad, horizPad, gleam }) => css`
		flex-direction: ${flexDirection};
		align-items: ${alignItems};
		box-shadow: 0 0 0 0 ${theme.accent};
		opacity: ${disabled ? 0.33 : 1};
		cursor: ${disabled ? "default" : "pointer"};
		> svg,
		> ${BtnContent} {
			margin-top: ${vertPad};
			margin-right: ${column ? horizPad : 0};
			margin-bottom: ${vertPad};
			margin-left: ${horizPad};
		}
		> *:last-child {
			margin-right: ${horizPad};
			margin-bottom: ${vertPad};
		}
		> svg {
			flex: ${column ? 1 : 0} 1 auto;
		}
		svg + ${BtnContent} {
			margin-right: ${!column && `calc(${horizPad} * 1.5) !important`};
			margin-top: ${column && 0};
		}
		@media (hover) {
			&:hover ${Gleam}::before {
				transform: skewX(20deg) translate(4%, 0);
				opacity: 0.2;
			}
		}
		&:active ${Gleam}::before {
			transform: skewX(20deg) translate(10%, 0);
			opacity: 0.2;
		}
	`}
`

const BasicButton = styled(ButtonBase).attrs(({ color, theme, ...props }) => {
	return {
		...props,
		color: color ?? theme.backgroundContrast,
		theme,
	}
})`
	${(props) => css`
		color: ${props.color};
		svg {
			fill: ${props.color};
		}
		background: ${opac(props.isFocused ? 0.15 : 0, props.color)};
		box-shadow: 0 0 0 1px ${opac(props.isFocused ? 0.2 : 0, props.color)};
		&:focus {
			background: ${opac(0.1, props.color)};
		}
		@media (hover) {
			&:hover {
				box-shadow: 0 0 0 1px ${opac(0.4, props.color)};
				background: ${opac(0.2, props.color)};
			}
		}
		&:active {
			box-shadow: 0 0 0 1px ${props.color};
			background: ${opac(0.4, props.color)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	${(props) => css`
		box-shadow: 0 0 0 1px ${opac(0.6, props.color)};
		&:focus {
			box-shadow: 0 0 0 1px ${opac(0.7, props.color)};
			background: ${opac(0.15, props.color)};
		}
		@media (hover) {
			&:hover {
				box-shadow: 0 0 0 1px ${props.color};
				background: ${opac(0.2, props.color)};
			}
		}
		&:active {
			box-shadow: 0 0 0 1px ${props.color}, 0 0 0 3px ${opac(0.75, props.color)};
			background: ${opac(0.3, props.color)};
		}
	`}
`

const SolidButton = styled(ButtonBase).attrs(({ color, colorContrast, theme, gleam, ...props }) => {
	return {
		...props,
		color: color ?? theme.highlight,
		colorContrast: colorContrast ?? theme.highlightContrast,
		theme,
	}
})`
	${({ theme, color, colorContrast }) => css`
		background: ${color};
		color: ${colorContrast};
		svg {
			fill: ${colorContrast};
		}
		box-shadow: 0 1px 8px 1px ${opac(0.5, theme.accent)}, 0 0 0 1px ${opac(0.7, theme.accent)};
		&:focus {
			box-shadow: 0 1px 8px 2px ${opac(0.55, theme.accent)}, 0 0 0 1px ${theme.accent};
			background: ${color ? lighten(0.02, saturate(0.05, color)) : "none"};
		}
		@media (hover) {
			&:hover {
				box-shadow: 0 1px 8px 3px ${opac(0.55, theme.accent)}, 0 0 0 2px ${theme.accent};
				background: ${color ? lighten(0.04, saturate(0.1, color)) : "none"};
			}
		}
		&:active {
			box-shadow: 0 1px 8px 2px ${opac(0.7, theme.accent)}, 0 0 0 3px ${theme.accent};
			opacity: 1;
		}
	`}
`

const ComboButton = styled(SolidButton)`
	opacity: 1;
	${({ theme, color, colorContrast }) => css`
		svg {
			max-height: 3rem;
		}
		svg,
		> ${BtnContent} {
			transition: -webkit-filter 0.4s;
			color: ${opac(0.9, colorContrast)};
			filter: drop-shadow(2px 0px 1px ${opac(0.8, theme.accent)})
				drop-shadow(0px -1px 1px ${opac(0.9, theme.accent)})
				drop-shadow(0px 2px 1px ${opac(0, theme.accent)})
				drop-shadow(-1px 0px 1px ${opac(0, theme.accent)});
		}
		background: ${opac(0.9, color)};
		color: ${colorContrast};
		border: 2px solid ${opac(0.7, theme.accent)};
		box-shadow: 0 1px 8px 1px ${opac(0.5, theme.accent)};
		&:focus {
			box-shadow: 0 1px 8px 2px ${opac(0.4, theme.accent)};
			background: ${color ? lighten(0.01, saturate(0.04, opac(0.9, color))) : "none"};
		}
		@media (hover) {
			&:hover {
				box-shadow: 0 1px 8px 3px ${opac(0.3, theme.accent)}, 0 0 0 1px ${theme.accent};
				background: ${color ? lighten(0.03, saturate(0.1, opac(0.9, color))) : "none"};
				svg,
				> ${BtnContent} {
					filter: drop-shadow(2px 0px 1px ${opac(0, theme.accent)})
						drop-shadow(0px -1px 1px ${opac(0, theme.accent)})
						drop-shadow(0px 2px 1px ${opac(0.8, theme.accent)})
						drop-shadow(-1px 0px 1px ${opac(0.9, theme.accent)});
				}
			}
		}
		&:active {
			box-shadow: 0 1px 8px 2px ${opac(0.6, theme.accent)}, 0 0 0 3px ${theme.accent};
			svg,
			> ${BtnContent} {
				filter: drop-shadow(2px 0px 1px ${opac(0, theme.accent)})
					drop-shadow(0px -1px 1px ${opac(0, theme.accent)})
					drop-shadow(0px 2px 1px ${opac(0.8, theme.accent)})
					drop-shadow(-1px 0px 1px ${opac(0.9, theme.accent)});
			}
		}
	`}
`

export const BadgeAnim = (theme) => keyframes`
	0% { box-shadow: 0 0 0 2px ${theme.highlightContrast}; }
	25% { box-shadow: 0 0 0 2px ${theme.background}; }
	50% { box-shadow: 0 0 0 2px ${theme.accent}; }
	75% { box-shadow: 0 0 0 2px ${theme.backgroundAlt}; }
	100% { box-shadow: 0 0 0 2px ${theme.highlightContrast}; }
`

const Badge = styled.span`
	font-size: 0.8em;
	position: absolute;
	z-index: 10000;
	top: 0;
	left: 100%;
	transform: translate3d(-70%, -30%, 0);
	padding: 0 0.4em;
	font-weight: bold;
	${({ theme }) => css`
		animation: ${BadgeAnim(theme)} 2s linear infinite;
		background: ${theme.highlight};
		color: ${theme.highlightContrast};
		${SolidButton} & {
			background: ${theme.accent};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const Button = forwardRef(({ tag, variant, badge, gleam, children, ...props }, ref) => {
	let ButtonVariant = BasicButton
	if (variant) {
		if (variant.includes("outline")) ButtonVariant = OutlinedButton
		else if (variant === "solid") ButtonVariant = SolidButton
		else if (variant === "combo") ButtonVariant = ComboButton
		if ((variant === "solid" || variant === "combo") && typeof gleam !== "boolean") gleam = true
	}
	if (typeof gleam !== "boolean") gleam = false

	return (
		<ThemeCheck {...props}>
			<ButtonVariant {...props} as={tag} ref={ref}>
				{badge && <Badge>{badge}</Badge>}
				{gleam && <Gleam />}
				{props.svg && <props.svg />}
				{children && <BtnContent className="btn-content">{children}</BtnContent>}
			</ButtonVariant>
		</ThemeCheck>
	)
})

export default Button
