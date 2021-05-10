import styled, { css } from "styled-components/macro"

import { Banner } from "../ui/misc"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const ListOfSCGs = styled.div`
	${({ theme }) => css`
		> * {
			margin: calc(var(--content-spacing) / 2);
			padding: calc(var(--content-spacing) / 2);
			border-left: 4px solid ${theme.accent};
			background: ${theme.background};
			> * {
				margin-left: calc(var(--content-spacing) / 4) !important;
			}
		}
	`}
	padding-bottom: 1px;
`

export const ThemeBanner = styled(Banner)`
	margin-bottom: 0 !important;
`

/* -------------------------------- COMPONENT ------------------------------- */

function CompGroup({ title, children, ...props }) {
	const genID = title.toLowerCase().split(" ").join("-")
	return (
		<Root {...props} id={genID} className="comp-group">
			<ThemeBanner>{title}</ThemeBanner>
			<ListOfSCGs>{children}</ListOfSCGs>
		</Root>
	)
}

export default CompGroup
