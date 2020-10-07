import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

export default styled.span`
	display: flex;
	text-transform: uppercase;
	font-size: 0.75em;
	font-style: italic;
	${({ theme, children }) => css`
		color: ${theme.accent};
		&::before,
		&::after {
			content: "";
			flex: 1;
			border-bottom: 1px solid ${theme.accent};
			margin: auto;
		}
		${children &&
		css`
			&::before {
				margin-right: 1em;
			}
			&::after {
				margin-left: 1em;
			}
		`}
	`}
`
