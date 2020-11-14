import styled, { css, keyframes } from "styled-components/macro"
import { useCorrectTheme } from "../../shared/hooks"

import { opac } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

export const ButtonBase = styled.button.attrs(({ svg, theme, color, column, reverse, ...props }) => {
	reverse = reverse ? "-reverse" : ""
	let varCSS = {
		...props,
		theme,
		fontSize: "1em",
		sidePadding: "0.8em",
		verticalPadding: "0.4em",
		color: color || theme?.bgContrast || "#56ff00",
		flexDirection: column ? `column${reverse}` : `row${reverse}`,
		alignItems: column ? "stretch" : "center",
	}
	if (svg) {
		varCSS = {
			...varCSS,
			sidePadding: `calc(${varCSS.sidePadding} * 0.5)`,
			verticalPadding: `calc(${varCSS.verticalPadding} * 0.5)`,
		}
	}
	return { varCSS, column }
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
	${({ theme, varCSS, column, disabled, isFocused }) => css`
		flex-direction: ${varCSS.flexDirection};
		align-items: ${varCSS.alignItems};
		font-size: ${varCSS.fontSize};
		padding: ${varCSS.verticalPadding} ${varCSS.sidePadding};
		color: ${varCSS.color};
		box-shadow: 0 0 0 0 ${theme.accent};
		opacity: ${disabled ? 0.33 : 1};
		cursor: ${disabled ? "default" : "pointer"};
		${isFocused && `background: ${opac(0.2, varCSS.color)};`}
		.svg-container {
			flex: ${column ? 1 : 0} 1 auto;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		> .svg-container + div {
			padding: 0 ${varCSS.sidePadding};
		}
	`}
`

const BasicButton = styled(ButtonBase)`
	${({ varCSS }) => css`
		&:focus {
			box-shadow: 0 0 0 1px ${varCSS.color};
		}
		&:hover {
			box-shadow: 0 0 0 1px ${varCSS.color};
			background: ${opac(0.3, varCSS.color)};
		}
		&:active {
			background: ${opac(0.4, varCSS.color)};
		}
	`}
`

const OutlinedButton = styled(BasicButton)`
	${({ varCSS }) => css`
		box-shadow: 0 0 0 1px ${varCSS.color};
		&:hover {
			box-shadow: 0 0 0 2px ${varCSS.color};
		}
		&:active {
			box-shadow: 0 0 0 3px ${varCSS.color};
		}
	`}
`

const FancyButton = styled(ButtonBase)`
	${({ theme }) => css`
		background: ${theme.primary};
		color: ${theme.primaryContrast};
		box-shadow: 0 1px 10px 1px ${opac(0.2, theme.primaryContrast)}, 0 0 0 1px ${theme.accent};
		opacity: 1;
		&:focus,
		&:hover {
			box-shadow: 0 1px 10px 1px ${opac(0.2, theme.primaryContrast)}, 0 0 0 2px ${theme.accent};
			opacity: 0.95;
		}
		&:active {
			box-shadow: 0 1px 10px 1px ${opac(0.2, theme.primaryContrast)}, 0 0 0 4px ${theme.accent};
			opacity: 1;
		}
	`}
`

const BtnContent = styled.div`
	flex: 0 0 auto;
`

const BadgeAnim = ({ theme, varCSS }) => keyframes`
	0% { box-shadow: 0 0 0 1px ${varCSS.color}; }
	25% { box-shadow: 0 0 0 1px ${theme.highlight}; }
	50% { box-shadow: 0 0 0 1px ${theme.accent}; }
	75% { box-shadow: 0 0 0 1px ${theme.altBackground}; }
	100% { box-shadow: 0 0 0 1px ${varCSS.color}; }
`

const Badge = styled.div`
	position: absolute;
	top: 0;
	left: 100%;
	transform: translate3d(-50%, -50%, 0);
	width: max-content;
	padding: 0 0.4em;
	${({ theme, varCSS }) => css`
		animation: ${BadgeAnim} 2s linear infinite;
		background: ${theme.highlight};
		color: ${varCSS.color};
		${FancyButton} & {
			background: ${theme.altBackground};
			border: 1px solid ${theme.accent};
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
	const themeProps = useCorrectTheme(props)
	if (props.log) console.log("Btn log() themeProps: ", themeProps)

	return (
		<ButtonVariant {...props} {...themeProps} as={tag}>
			{props.svg && (
				<div className="svg-container">
					<props.svg />
				</div>
			)}
			{children && <BtnContent>{children}</BtnContent>}
			{badge && <Badge>{badge}</Badge>}
		</ButtonVariant>
	)
}

export default Button
