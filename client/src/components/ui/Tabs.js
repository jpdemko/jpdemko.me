import { useState, useEffect } from "react"
import styled, { css } from "styled-components/macro"

import Button from "./Button"
import { usePrevious } from "../../shared/hooks"
import { opac } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	${({ theme }) => css`
		background: ${theme.backgroundAlt};
		border: 1px solid ${theme.accent};
	`}
`

const TabsHeader = styled.div`
	flex: 0 0 auto;
	display: flex;
	${({ theme }) => css`
		background: ${theme.background};
		border-bottom: 1px solid ${theme.accent};
	`}
`

const BtnHeaderGroup = styled.div`
	flex: 0 1 auto;
	display: flex;
	overflow-x: auto;
	font-weight: bold;
	> * {
		flex: 0 0 auto;
	}
	${({ theme }) => css`
		background: ${theme.backgroundAlt};
	`}
`

const TabButton = styled(Button)`
	${({ theme, isFocused }) => css`
		color: ${theme.backgroundContrast};
		border-right: 1px solid ${opac(0.6, theme.accent)};
	`}
`

const SelectedContent = styled.div`
	flex: 1 1 auto;
	position: relative;
	overflow-y: auto;
`

const TabContent = styled.div`
	height: 100%;
	${({ isFocused, theme }) => css`
		color: ${theme.backgroundContrast};
		position: ${isFocused ? "static" : "absolute"};
		display: ${isFocused ? "block" : "none"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const defaultData = [{ id: 1, header: null, content: null }]

function Tabs({ data = defaultData, ...props }) {
	const [focusedID, setFocusedID] = useState(data?.[0]?.id)

	const prevContentLength = usePrevious(data?.length)
	useEffect(() => {
		if (data?.length !== prevContentLength) {
			if (!data.find((ele) => ele.id === focusedID)) {
				const nextEle = data.find((ele) => ele.id !== focusedID)
				setFocusedID(nextEle ? nextEle.id : null)
			}
		}
	}, [data, focusedID, prevContentLength])

	return (
		<Root {...props}>
			<TabsHeader>
				<BtnHeaderGroup>
					{data.map(({ id, header }) => (
						<TabButton
							key={`tab-header-${id}`}
							isFocused={id === focusedID}
							onClick={() => setFocusedID(id)}
							column
						>
							{header}
						</TabButton>
					))}
				</BtnHeaderGroup>
			</TabsHeader>
			<SelectedContent>
				{data.map(({ id, content }) => (
					<TabContent key={`tab-content-${id}`} isFocused={id === focusedID}>
						{content}
					</TabContent>
				))}
			</SelectedContent>
		</Root>
	)
}

export default Tabs
