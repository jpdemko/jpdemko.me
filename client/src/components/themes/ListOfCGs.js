import { useEffect, useMemo, useState } from "react"
import styled, { css } from "styled-components/macro"

import { themes } from "../../shared/shared"
import CompGroup from "./CompGroup"
import SubCompGroup from "./SubCompGroup"
import Button from "../ui/Button"
import { MsgBox, Input } from "../ui/IO"
import Accordion from "../ui/Accordion"
import Tabs from "../ui/Tabs"
import Link from "../ui/Link"
import { LoadingSvgInline } from "../ui/Loading"

/* --------------------------------- STYLES --------------------------------- */

const AccordionExample = styled(Accordion)`
	${({ theme }) => css`
		background: ${theme.backgroundAlt};
	`}
`

const DummyContent = styled.div`
	padding: var(--theme-spacing) calc(var(--theme-spacing) * 1.25);
`
const LoadingExample = styled.div`
	> * {
		margin-right: var(--theme-spacing);
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function ErrorCG({ complimTName }) {
	// For showcasing components that deal with errors.
	const errMsg = "Something happened and the user needs to know!"
	const [error, setError] = useState(errMsg)
	useEffect(() => {
		const setErr = setInterval(() => setError(errMsg), 8000)
		return () => clearInterval(setErr)
	}, [])

	// Placeholder text for <MsgBox /> component.
	const msgBoxPH = `resizeable={true}\nsetTheme="${complimTName}"`

	return (
		<CompGroup id="io">
			<SubCompGroup descrip={`Inputs Type="Text"`}>
				<Input label="Base input" placeholder="Placeholder" />
				<Input label="stickyLabel ex:" placeholder="stickyLabel={true}" stickyLabel />
				<Input
					label="setTheme ex:"
					setTheme={complimTName}
					placeholder={`setTheme="${complimTName}"`}
					stickyLabel
				/>
				<Input
					label="Error example"
					error={error}
					clearError={setError}
					placeholder="error={err} clearError={setErr}"
					stickyLabel
				/>
			</SubCompGroup>
			<SubCompGroup descrip="Text areas">
				<MsgBox placeholder="This is a placeholder." />
				<MsgBox setTheme={complimTName} placeholder={msgBoxPH} resizeable />
				<MsgBox error={error} defaultValue="Here is something user has written before error." />
			</SubCompGroup>
		</CompGroup>
	)
}

function ListOfCGs({ curTheme, cgTitles }) {
	const complimTName = useMemo(() => {
		const complimThemes = Object.values(themes).filter(
			(t) => t.type === curTheme.type && t.name !== curTheme.name && t.public
		)
		return complimThemes[Math.floor(Math.random() * complimThemes.length)]?.name ?? "purple"
	}, [curTheme])

	// Generate dummy data for data display components (eg: Accordion, Tabs).
	function genData(title) {
		return new Array(3).fill(null).map((e, i) => ({
			id: i,
			header: `${title} header ${i + 1}`,
			content: (
				<DummyContent key={i}>
					<div className="enpha">
						{title} {i + 1} content.
					</div>
					<div>
						Custom <code>.jsx</code> here. Can be anything, this is just a random{" "}
						<code>{`<div />`}</code> with some padding.
					</div>
					<pre>
						<code>{`data={[{ id, header, content${
							title.includes("cord") ? ", startOpened" : ""
						} }]}`}</code>
					</pre>
				</DummyContent>
			),
			startOpened: Math.round(Math.random()),
		}))
	}

	return (
		<>
			<CompGroup id="buttons">
				<SubCompGroup descrip="Base buttons">
					<Button>Button</Button>
					<Button setColor="highlight">setColor="highlight"</Button>
					<Button setTheme={complimTName} setColor="highlight">
						setTheme="{complimTName}" setColor="highlight"
					</Button>
				</SubCompGroup>
				<SubCompGroup descrip="Outlined buttons">
					<Button variant="outline" gleam>
						variant="outline" gleam={`{true}`}
					</Button>
					<Button variant="outline" setColor="highlight" badge={1}>
						setColor="highlight" badge={`{1}`}
					</Button>
					<Button variant="outline" setTheme={complimTName} setColor="highlight">
						setTheme="{complimTName}" setColor="highlight"
					</Button>
				</SubCompGroup>
				<SubCompGroup descrip="Solid buttons">
					<Button variant="solid" gleam={false}>
						variant="solid" gleam={`{false}`}
					</Button>
					<Button variant="solid" setColor="primary" badge={1}>
						setColor="primary" badge={`{1}`}
					</Button>
					<Button variant="solid" setTheme={complimTName}>
						setTheme="{complimTName}"
					</Button>
				</SubCompGroup>
			</CompGroup>
			<ErrorCG complimTName={complimTName} />
			<CompGroup id="dataDisplay">
				<SubCompGroup descrip="Accordion">
					<AccordionExample data={genData("Accordion")} />
				</SubCompGroup>
				<SubCompGroup descrip="Tabs">
					<Tabs data={genData("Tabs")} />
				</SubCompGroup>
			</CompGroup>
			<CompGroup id="misc">
				<SubCompGroup descrip="Anchor / Link">
					<Link openNewTab={false}>
						<code>{`<Link href="" openNewTab={false} />`}</code>
					</Link>
				</SubCompGroup>
				<SubCompGroup descrip="Loading" block>
					<LoadingExample>
						<code>{`<LoadingSVG />`}</code>
						<LoadingSvgInline />
					</LoadingExample>
					<LoadingExample>
						<code>{`<LoadingSVG sideLength="48px" />`}</code>
						<LoadingSvgInline sideLength="48px" />
					</LoadingExample>
				</SubCompGroup>
			</CompGroup>
		</>
	)
}

export default ListOfCGs
