import styled, { css } from "styled-components/macro"

import { Banner } from "../ui/Misc"
import { cgTitles } from "./Themes"

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

function CompGroup({ banner, id, children, ...props }) {
	return (
		<Root {...props} id={`cg-${id}`} className="comp-group">
			<ThemeBanner>{banner ?? cgTitles?.[id] ?? id}</ThemeBanner>
			<ListOfSCGs>{children}</ListOfSCGs>
		</Root>
	)
}

export default CompGroup
