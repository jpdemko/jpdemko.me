import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const Title = styled.div`
	font-weight: bold;
	text-transform: uppercase;
	font-size: 1.1em;
	${({ theme }) => css`
		color: ${theme.backgroundContrast};
	`}
`

const Display = styled.div`
	padding: var(--theme-spacing) 0;
	max-width: 100%;
	${({ block }) => css`
		display: ${block ? "block" : "inline-block"};
	`}
`

const FlexGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-top: calc(-1 * var(--theme-spacing)) !important;
	> * {
		margin: var(--theme-spacing) var(--theme-spacing) 0 0;
		flex: 0 1 auto;
	}
	${({ column }) =>
		column &&
		css`
			flex-direction: column;
		`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function SubCompGroup({ title, children, column, block, ...props }) {
	return (
		<Root {...props}>
			<Title>{title}</Title>
			<Display block={block}>
				<FlexGroup column={column}>{children}</FlexGroup>
			</Display>
		</Root>
	)
}

export default SubCompGroup
