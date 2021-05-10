import { useLayoutEffect, useRef, useState } from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"
import { ReactComponent as SvgArrowRight } from "../../shared/assets/material-icons/arrow-right.svg"
import { usePrevious } from "../../shared/hooks"

/* --------------------------------- STYLES --------------------------------- */

const AccordRoot = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	min-width: 30ch;
	${({ theme, animDuration }) => css`
		@media (hover) {
			transition: ${animDuration}s;
		}
		border: 1px solid ${theme.accent};
		background: ${theme.background};
	`}
`

const MenuRoot = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ opened, theme, animDuration, heights }) => css`
		border-top: 1px solid ${theme.accent};
		@media (hover) {
			transition: ${animDuration}s;
		}
		min-height: ${heights.btn};
		flex: ${opened ? `1 0` : `0 1 ${heights.btn}`};
	`}
`

const MenuTitleBtn = styled(Button)`
	padding: 0;
	flex: 0 0 auto;
	justify-content: flex-start;
	${({ opened, animDuration }) => css`
		> svg {
			transition: transform ${animDuration}s;
			transform: rotate(${opened ? "90deg" : "0deg"});
		}
	`}
`

const MenuContent = styled.div`
	${({ opened, animDuration, heights }) => css`
		overflow: ${opened ? "auto" : "hidden"};
		> div:only-child {
			overflow: ${opened ? "auto" : "hidden"};
		}
		@media (hover) {
			transition: ${animDuration}s ease-in-out;
		}
		height: auto;
		max-height: ${opened ? (heights ? `${heights.content}` : "100vmax") : "0"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Menu({ data, startOpened = true, animDuration }) {
	const { id, header, content } = data
	const [opened, setOpened] = useState(startOpened)
	const prevOpened = usePrevious(opened)

	const contentRef = useRef()
	const [heights, setHeights] = useState({ content: "100vmax", btn: "auto" })
	useLayoutEffect(() => {
		if (prevOpened === opened) return
		const cnt = contentRef.current
		const btn = document.getElementById(`btn-${id}`)
		setHeights({
			content: `${cnt.scrollHeight}px`,
			btn: `${btn.scrollHeight}px`,
		})
	}, [prevOpened, opened, content, id])

	return !data ? null : (
		<MenuRoot opened={opened} animDuration={animDuration} heights={heights}>
			<MenuTitleBtn
				tag="div"
				id={`btn-${id}`}
				variant="solid"
				onClick={() => setOpened((prev) => !prev)}
				svg={SvgArrowRight}
				opened={opened}
				animDuration={animDuration}
			>
				{header}
			</MenuTitleBtn>
			<MenuContent opened={opened} animDuration={animDuration} heights={heights} ref={contentRef}>
				{content}
			</MenuContent>
		</MenuRoot>
	)
}

export default function Accordion({ data, animDuration = 0.35, ...props }) {
	// [{ id, header, content, startOpened }, ...n] = data
	return !data ? null : (
		<AccordRoot {...props} animDuration={animDuration}>
			{data.map((ele) => {
				return <Menu key={ele.id} animDuration={animDuration} data={ele} startOpened={ele.startOpened} />
			})}
		</AccordRoot>
	)
}
