import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

export const Banner = styled.div`
	line-height: 1;
	text-transform: uppercase;
	font-weight: bold;
	font-size: 2em;
	padding: 0.1em 0.2em;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.background};
	`}
`
