import { useState } from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"
import { ReactComponent as SvgArrowRight } from "../../shared/assets/material-icons/arrow-right.svg"

/* --------------------------------- STYLES --------------------------------- */

const AccordRoot = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

const MenuRoot = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ opened, theme }) => css`
		border-top: 1px solid ${theme.altBackground};
		flex: ${opened ? "1 0" : "0 0 auto"};
	`}
`

const MenuTitle = styled(Button)`
	padding: 0;
	justify-content: flex-end;
	${({ opened }) => css`
		> .svg-container {
			transform: rotate(${opened ? "90deg" : 0});
		}
	`}
`

const MenuContent = styled.div`
	overflow-x: hidden;
	${({ opened }) => css`
		height: ${opened ? "100%" : "0px"};
		overflow-y: ${opened ? "auto" : "hidden"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Menu({ data }) {
	const [opened, setOpened] = useState(true)
	const { title, content } = data

	return !data ? null : (
		<MenuRoot opened={opened}>
			<MenuTitle
				tag="div"
				variant="fancy"
				onClick={() => setOpened((prev) => !prev)}
				svg={SvgArrowRight}
				opened={opened}
			>
				{title}
			</MenuTitle>
			<MenuContent opened={opened}>{content}</MenuContent>
		</MenuRoot>
	)
}

export default function Accordion({ data, ...props }) {
	return !data ? null : (
		<AccordRoot {...props}>
			{data.map((ele) => {
				return <Menu key={ele.id} data={ele} />
			})}
		</AccordRoot>
	)
}
