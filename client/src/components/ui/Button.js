import styled, { css, keyframes } from "styled-components/macro"
import { useCorrectTheme } from "../../shared/hooks"

import { opac } from "../../shared/shared"

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
		varCSS = {
			...varCSS,
			sidePadding: `calc(${varCSS.sidePadding} * 0.5)`,
			verticalPadding: `calc(${varCSS.verticalPadding} * 0.5)`,
		}
	}
	return varCSS
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
	${(props) => css`
		flex-direction: ${props.flexDirection};
		align-items: ${props.alignItems};
		font-size: ${props.fontSize};
		padding: ${props.verticalPadding} ${props.sidePadding};
		color: ${props.color};
		box-shadow: 0 0 0 0 ${props.theme.accent};
		opacity: ${props.disabled ? 0.33 : 1};
		cursor: ${props.disabled ? "default" : "pointer"};
		${props.isFocused &&
		css`
			background: ${opac(0.2, props.color)};
		`}
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

const BasicButton = styled(ButtonBase)`
	${(props) => css`
		&:focus {
			box-shadow: 0 0 0 1px ${props.color};
		}
		&:hover {
			box-shadow: 0 0 0 1px ${props.color};
			background: ${opac(0.3, props.color)};
		}
		&:active {
			background: ${opac(0.4, props.color)};
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
	const themeProps = useCorrectTheme(props)

	return (
		<ButtonVariant {...props} {...themeProps} as={tag}>
			{props.svg && (
				<div className="svg-container">
					<props.svg />
				</div>
			)}
			{children && <BtnContent>{children}</BtnContent>}
			{badge && <Badge {...themeProps}>{badge}</Badge>}
		</ButtonVariant>
	)
}

export default Button
