import * as React from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"

const AccordRoot = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

const MenuRoot = styled.div`
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	${({ opened, theme }) => css`
		border-top: 1px solid ${theme.background};
		flex: ${opened ? "1 1" : "0 1 auto"};
	`}
`

const MenuTitle = styled(Button)`
	padding: 0;
	display: block;
`

const MenuContent = styled.div`
	overflow-x: hidden;
	${({ opened }) => css`
		height: ${opened ? "100%" : "0px"};
		overflow-y: ${opened ? "auto" : "hidden"};
	`}
`

function Menu({ data }) {
	const [opened, setOpened] = React.useState(true)
	const { title, content } = data
	return !data ? null : (
		<MenuRoot opened={opened}>
			<MenuTitle tag="div" variant="fancy" onClick={() => setOpened((prev) => !prev)}>
				{title}
			</MenuTitle>
			<MenuContent opened={opened}>{content}</MenuContent>
		</MenuRoot>
	)
}

export default function Accordion({ data }) {
	return !data ? null : (
		<AccordRoot>
			{data.map((ele) => {
				return <Menu key={ele.id} data={ele} />
			})}
		</AccordRoot>
	)
}
