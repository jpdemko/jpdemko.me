import { lighten, saturate } from "polished"
import styled, { css, keyframes } from "styled-components/macro"

import { opac } from "../../shared/shared"
import ThemeCheck from "./ThemeCheck"

/* --------------------------------- STYLES --------------------------------- */

export const ButtonBase = styled.button.attrs(({ svg, column, reverse, ...props }) => {
	reverse = reverse ? "-reverse" : ""
	let varCSS = {
		...props,
		column,
		fontSize: "1em",
		sidePadding: "0.8em",
		verticalPadding: "0.4em",
		flexDirection: column ? `column${reverse}` : `row${reverse}`,
		alignItems: column ? "stretch" : "center",
	}
	if (svg) {
		varCSS.sidePadding = `calc(${varCSS.sidePadding} * 0.5)`
		varCSS.verticalPadding = `calc(${varCSS.verticalPadding} * 0.5)`
	}
	return varCSS
})`
	display: inline-flex;
	justify-content: center;
	border: none;
	background: none;
	transition: 0.2s;
	outline: none;
	font-weight: 500;
	position: relative;
	border-radius: 0;
	${(props) => css`
		flex-direction: ${props.flexDirection};
		align-items: ${props.alignItems};
		font-size: ${props.fontSize};
		padding: ${props.verticalPadding} ${props.sidePadding};
		box-shadow: 0 0 0 0 ${props.theme.accent};
		opacity: ${props.disabled ? 0.33 : 1};
		cursor: ${props.disabled ? "default" : "pointer"};
		.svg-container {
			flex: ${props.column ? 1 : 0} 1 auto;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		> .svg-container + div {
			padding: 0 ${props.sidePadding};
		}
	`}
`

const BasicButton = styled(ButtonBase).attrs(({ color, theme, ...props }) => ({
	...props,
	color: color ?? theme.bgContrast,
	theme,
}))`
	${(props) => css`
		color: ${props.color};
		background: ${opac(props.isFocused ? 0.15 : 0, props.color)};
		&:focus {
			box-shadow: 0 0 0 1px ${props.color};
		}
		&:hover {
			box-shadow: 0 0 0 1px ${props.color};
			background: ${opac(0.2, props.color)};
		}
		&:active {
			background: ${opac(0.25, props.color)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	${(props) => css`
		box-shadow: 0 0 0 1px ${props.color};
		&:hover {
			box-shadow: 0 0 0 2px ${props.color};
		}
		&:active {
			box-shadow: 0 0 0 3px ${props.color};
		}
	`}
`

const FancyButton = styled(ButtonBase).attrs(({ color, theme, ...props }) => ({
	...props,
	color: color ?? theme.highlight,
	theme,
}))`
	${({ theme, color }) => css`
		background: ${color ?? "none"};
		color: ${theme.primaryContrast};
		box-shadow: 0 1px 8px 1px ${opac(0.5, theme.accent)}, 0 0 0 1px ${opac(0.7, theme.accent)};
		&:focus,
		&:hover {
			box-shadow: 0 1px 8px 3px ${opac(0.5, theme.accent)}, 0 0 0 2px ${theme.accent};
			background: ${color ? saturate(0.04, lighten(0.04, color)) : "none"};
		}
		&:active {
			box-shadow: 0 1px 8px 2px ${opac(0.7, theme.accent)}, 0 0 0 3px ${theme.accent};
			opacity: 1;
		}
	`}
`

const BtnContent = styled.div`
	flex: 0 0 auto;
`

const BadgeAnim = (props) => keyframes`
	0% { box-shadow: 0 0 0 1px ${props.theme.primaryContrast}; }
	25% { box-shadow: 0 0 0 1px ${props.theme.background}; }
	50% { box-shadow: 0 0 0 1px ${props.theme.accent}; }
	75% { box-shadow: 0 0 0 1px ${props.theme.altBackground}; }
	100% { box-shadow: 0 0 0 1px ${props.theme.primaryContrast}; }
`

const Badge = styled.div`
	position: absolute;
	top: 0;
	left: 100%;
	transform: translate3d(-70%, -30%, 0);
	width: max-content;
	padding: 0 0.4em;
	${(props) => css`
		animation: ${BadgeAnim(props)} 2s linear infinite;
		background: ${props.theme.highlight};
		color: ${props.theme.primaryContrast};
		${FancyButton} & {
			background: ${props.theme.altBackground};
			border: 1px solid ${props.theme.accent};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Button({ tag, variant, badge, children, ...props }) {
	let ButtonVariant = BasicButton
	if (variant) {
		if (variant.includes("outline")) ButtonVariant = OutlinedButton
		else if (variant === "fancy") ButtonVariant = FancyButton
	}

	return (
		<ThemeCheck {...props}>
			<ButtonVariant {...props} as={tag}>
				{props.svg && (
					<div className="svg-container">
						<props.svg />
					</div>
				)}
				{children && <BtnContent>{children}</BtnContent>}
				{badge && <Badge>{badge}</Badge>}
			</ButtonVariant>
		</ThemeCheck>
	)
}

export default Button
