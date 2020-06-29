import * as React from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"

const Menu = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

const SmRoot = styled.div`
	display: flex;
	flex-direction: column;
	${({ open, theme }) => css`
		border-top: 1px solid ${theme.background};
		flex: ${open ? "1 1" : "0 1"};
	`}
`

const TitleContent = styled(Button)`
	padding: 0;
	display: block;
`

const MenuContent = styled.div`
	overflow-x: hidden;
	${({ open }) => css`
		height: ${open ? "100%" : "0px"};
		overflow-y: ${open ? "auto" : "hidden"};
	`}
`

function SubMenu({ data }) {
	const [open, setOpen] = React.useState(true)
	const { title, content } = data
	return !data ? null : (
		<SmRoot isFocused={open} open={open}>
			<TitleContent tag="div" variant="fancy" onClick={() => setOpen((prev) => !prev)}>
				{title}
			</TitleContent>
			<MenuContent open={open}>{content}</MenuContent>
		</SmRoot>
	)
}

export default function Accordion({ data }) {
	return !data ? null : (
		<Menu>
			{data.map((ele) => {
				return <SubMenu key={ele.id} data={ele} />
			})}
		</Menu>
	)
}
