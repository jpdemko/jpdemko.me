import { useContext } from "react"

import { setupAppSharedOptions, themes, Contexts } from "../../shared/shared"
import { ReactComponent as SvgFlag } from "../../shared/assets/material-icons/flag.svg"

import MinesweeperNav from "./MinesweeperNav"

/* --------------------------------- STYLES --------------------------------- */

/* -------------------------------- COMPONENT ------------------------------- */

/*
-- Nav sliding tray
	- Go to game board
	- Go to global leaderboard (requires user auth)
		- Show social login if not authed
		-

-- Game
	- Top info bar
		- On mobile where does the info bar go?
		- Content
			- Difficulty selection
			- Flags remaining
			- Timer
		- Difficulties
			- Easy
				- Board size (8x8)
				- Mines (10)
			- Medium
				- Board size (16x16)
				- Mines (40)
			- Hard
				- Board size (16x30)
				- Mines (99)

	- Rules
		- First click will always be safe and all surrounding squares will be empty
		- Distribute
*/

function Minesweeper() {
	const { setAppDrawerContent, isMobileWindow } = useContext(Contexts.Window)

	return (
		<div>
			<MinesweeperNav setAppDrawerContent={setAppDrawerContent} isMobileWindow={isMobileWindow} />
		</div>
	)
}

Minesweeper.shared = setupAppSharedOptions({
	title: "Minesweeper",
	logo: SvgFlag,
	theme: themes.dark,
})

export default Minesweeper
