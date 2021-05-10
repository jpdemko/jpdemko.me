import { useContext, useEffect } from "react"
import styled, { css } from "styled-components/macro"

import { Contexts, Styles } from "../../shared/shared"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--tnav-spacing: calc(var(--content-spacing) / 2) calc(var(--content-spacing) * 0.75);
	display: flex;
	> * {
		flex: 0 0 auto;
	}
	${({ theme, isMobileSite }) => css`
		flex-direction: column;
		justify-content: ${isMobileSite ? "flex-end" : "flex-start"};
		background: ${theme.background};
	`}
`

const LinkList = styled.div`
	display: flex;
	flex-direction: column;
`

const Descrip = styled.div`
	margin: var(--tnav-spacing);
	font-weight: bold;
	${({ theme }) => css`
		color: ${theme.highlight};
		border-bottom: 2px solid ${theme.accent};
	`}
`

const BtnLink = styled(Button)`
	justify-content: flex-start;
	width: 100%;
	> div {
		margin: var(--tnav-spacing) !important;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function ThemeNav({ cgTitles, children, focusedID, setFocusedID, ...props }) {
	const { setAppDrawerContent, setAppDrawerShown, isMobileWindow, isMobileSite } = useContext(
		Contexts.Window
	)

	function scrollTo(id) {
		const ele = document.getElementById(id)
		if (!ele) return
		const eleStyle = new Styles(ele)
		const eleMargins = eleStyle.get("margin")
		ele.parentNode.parentNode.scrollTop = ele.offsetTop - (eleMargins?.[0] ?? 0)
		setFocusedID(id)
		setAppDrawerShown(false)
	}

	const genID = (t) => t.toLowerCase().split(" ").join("-")

	const drawerContent = (
		<Root {...props} isMobileSite={isMobileSite} isMobileWindow={isMobileWindow}>
			<Descrip>UI Component Groups</Descrip>
			<LinkList>
				{Object.values(cgTitles).map((t) => {
					const id = genID(t)
					return (
						<BtnLink key={id} onClick={() => scrollTo(id)} isFocused={id === focusedID}>
							{t}
						</BtnLink>
					)
				})}
			</LinkList>
		</Root>
	)
	useEffect(() => setAppDrawerContent(drawerContent))
	return null
}

export default ThemeNav
