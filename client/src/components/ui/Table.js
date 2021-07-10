import styled, { css } from "styled-components"

import { opac } from "../../shared/shared"

export const Table = styled.table`
	position: relative;
	width: 100%;
	border-collapse: collapse;
	text-align: center;
	font-family: monospace;
`

export const THeader = styled.thead`
	white-space: nowrap;
	font-weight: bold;
	tr {
		padding: 0;
	}
`

export const TBody = styled.tbody`
	overflow: auto;
	${({ theme }) => css`
		tr:nth-child(odd) {
			background: ${opac(0.5, theme.background)};
		}
	`}
`

export const TRow = styled.tr`
	${({ theme }) => css`
		> * {
			padding: 0.15em 0.45em;
			border: 1px solid ${opac(0.4, theme.accent)};
		}
	`}
`

const THRoot = styled.th`
	position: sticky;
	z-index: 1000;
	top: 0;
	border-top: none;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.highlightContrast};
	`}
`

const TDRoot = styled.td``

const InnerCellWrap = styled.div`
	display: flex;
	flex-direction: column;
	text-align: center;
	justify-content: center;
	align-items: center;
`

export function TH({ children, ...props }) {
	return (
		<THRoot {...props}>
			<InnerCellWrap>{children}</InnerCellWrap>
		</THRoot>
	)
}

export function TD({ children, ...props }) {
	return (
		<TDRoot {...props}>
			<InnerCellWrap>{children}</InnerCellWrap>
		</TDRoot>
	)
}
