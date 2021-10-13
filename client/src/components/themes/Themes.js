import { useContext, useRef, useState } from "react"
import styled, { css } from "styled-components/macro"

import { themes, setupAppSharedOptions, Contexts, Debug } from "../../shared/shared"
import { ReactComponent as SvgPalette } from "../../shared/assets/material-icons/palette.svg"
import Button from "../ui/Button"
import ListOfCGs from "./ListOfCGs"
import CompGroup from "./CompGroup"
import SubCompGroup from "./SubCompGroup"
import ThemeNav from "./ThemeNav"
import { useEventListener, useThrottle, useUpdatedValRef } from "../../shared/hooks"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--theme-spacing: calc(var(--content-spacing) / 2);
	display: flex;
	height: 100%;
	${({ theme }) => css`
		background: ${theme.backgroundAlt} !important;
		pre {
			background: ${theme.backgroundAlt};
			padding: calc(var(--theme-spacing) * 0.9) var(--theme-spacing);
			border: 1px solid ${theme.accent};
		}
		code,
		pre {
			word-break: normal;
			word-wrap: normal;
			overflow: auto;
			overflow-wrap: normal;
		}
	`}
`

const SectionWrap = styled.div`
	flex: 1 1 auto;
	overflow: auto;
`

const CompGroupsSection = styled.section`
	padding: 0 var(--theme-spacing) !important;
	> div {
		margin: var(--theme-spacing) 0 !important;
	}
	> div:last-child {
		margin-bottom: var(--theme-spacing) !important;
	}
`

const ThemeBtn = styled(Button)`
	text-transform: uppercase;
	font-size: 1.2em;
`

/* -------------------------------- COMPONENT ------------------------------- */

const debug = new Debug("Themes: ", true)

export const cgTitles = {
	themes: "Decide Theme",
	buttons: "Buttons",
	io: "IO",
	dataDisplay: "Data Display",
	misc: "Misc",
}

function Themes({ title, ...props }) {
	const { curTheme, setTheme } = useContext(Contexts.Index)
	const [focusedID, setFocusedID] = useState("cg-themes")

	function setID(id) {
		if (id !== focusedID) {
			document.activeElement.blur()
			setFocusedID(id)
		}
	}
	const setRef = useUpdatedValRef(setID)

	const cgSectRef = useRef()
	const handleScrollThrottled = useThrottle(() => {
		const wrap = cgSectRef.current
		if (!wrap) return

		const cgs = wrap.getElementsByClassName("comp-group")
		for (let i = 0; i < cgs.length; i++) {
			const cg = cgs[i]
			const nearBottom =
				wrap.scrollHeight - wrap.scrollTop < wrap.clientHeight + cgs[cgs.length - 1].scrollHeight / 3
			const offset = Math.round(cg.scrollHeight / 2.5)
			const rMin = cg.offsetTop - offset
			const rMax = cg.offsetTop + cg.scrollHeight - offset
			const inRange = wrap.scrollTop > rMin && wrap.scrollTop < rMax
			if (nearBottom) {
				setRef.current?.(cgs[cgs.length - 1].id)
				break
			} else if (inRange) {
				setRef.current?.(cg.id)
				break
			}
		}
	}, 250)
	useEventListener(cgSectRef, "scroll", handleScrollThrottled)

	const availThemes = Object.keys(themes).filter((name) => themes[name].public)
	const lightNames = availThemes.filter((name) => themes[name].type === "light")
	const darkNames = availThemes.filter((name) => themes[name].type === "dark")

	let themeJSON = JSON.stringify(curTheme, null, 3)
		.split(/(#\w+)/gm)
		.map((str, i) =>
			str.includes("#") ? (
				<span key={i}>
					{str} <input type="color" value={str} disabled />
				</span>
			) : (
				str
			)
		)

	return (
		<>
			<Root {...props}>
				<ThemeNav focusedID={focusedID} setFocusedID={setFocusedID} />
				<SectionWrap ref={cgSectRef} id="themes-overflowed-section">
					<CompGroupsSection>
						<CompGroup id="themes">
							<SubCompGroup descrip="Light themes">
								{lightNames.map((name) => (
									<ThemeBtn
										key={name}
										variant="solid"
										setTheme={name}
										onClick={() => setTheme(name)}
										setColor="primary"
									>
										{name}
									</ThemeBtn>
								))}
							</SubCompGroup>
							<SubCompGroup descrip="Dark themes">
								{darkNames.map((name) => (
									<ThemeBtn
										key={name}
										variant="solid"
										setTheme={name}
										onClick={() => setTheme(name)}
										setColor="primary"
									>
										{name}
									</ThemeBtn>
								))}
							</SubCompGroup>
							<SubCompGroup descrip="Currently selected theme">
								<pre>
									<code>{themeJSON}</code>
								</pre>
							</SubCompGroup>
						</CompGroup>
						<ListOfCGs curTheme={curTheme} />
					</CompGroupsSection>
				</SectionWrap>
			</Root>
		</>
	)
}

Themes.shared = setupAppSharedOptions({
	title: "Themes",
	logo: SvgPalette,
	theme: themes.purple,
})

export default Themes
