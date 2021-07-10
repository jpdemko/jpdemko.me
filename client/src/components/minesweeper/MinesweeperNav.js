import { memo } from "react"
import { useLayoutEffect } from "react"
import styled, { css } from "styled-components/macro"

import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--mnav-spacing: calc(var(--content-spacing) / 2) calc(var(--content-spacing) * 0.75);
	height: 100%;
	display: flex;
	flex-direction: column;
	${({ isMobileSite }) => css`
		justify-content: ${isMobileSite ? "flex-end" : "flex-start"};
	`}
`

const NavInfo = styled.div`
	margin: var(--mnav-spacing);
	font-weight: bold;
	${({ theme }) => css`
		color: ${theme.highlight};
		border-bottom: 2px solid ${theme.accent};
	`}
`

const NavBtn = styled(Button)`
	width: 100%;
	justify-content: flex-start;
	> div {
		margin: var(--mnav-spacing) !important;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function MinesweeperNav({ setAppDrawerContent, page, pages, setPage, ...props }) {
	const drawer = (
		<Root {...props}>
			<NavInfo>Minesweeper Pages</NavInfo>
			{pages.map((p) => (
				<NavBtn key={p} isFocused={p === page} onClick={() => setPage(p)}>
					{p}
				</NavBtn>
			))}
		</Root>
	)

	useLayoutEffect(() => setAppDrawerContent(drawer))
	return null
}

function navCompareProps(prev, next) {
	// Return true if nextProps change would render the same as before, false otherwise.
	return prev?.page === next?.page
}

export default memo(MinesweeperNav, navCompareProps)
