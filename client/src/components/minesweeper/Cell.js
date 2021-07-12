import { memo, useEffect, useRef, useState } from "react"
import styled, { css } from "styled-components/macro"
import { darken } from "polished"

import { ReactComponent as SvgFlag } from "../../shared/assets/material-icons/flag.svg"
import { ReactComponent as SvgBomb } from "../../shared/assets/material-icons/bomb.svg"
import { ReactComponent as SvgShovel } from "../../shared/assets/misc-icons/shovel.svg"
import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
import { getRect, opac, themes } from "../../shared/shared"
import Button, { BadgeAnim } from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	line-height: 1;
	font-weight: bold;
	font-family: monospace;
	position: relative;
	min-height: 1rem;
	min-width: 1rem;
	display: flex;
	${({ theme, altPattern, isDug, cellOpened }) => {
		let color = theme.background
		if (!isDug && altPattern) color = theme.accent
		else if (!isDug) color = darken(0.1, theme.accent)
		else if (isDug && altPattern) color = theme.backgroundAlt
		return css`
			color: ${theme.highlightContrast};
			background: ${color};
			${cellOpened &&
			css`
				z-index: 100;
				animation: ${BadgeAnim(theme)} 2s linear infinite;
			`}
		`
	}}
`

const CellBtn = styled(Button)`
	margin: 0 !important;
	font-size: var(--ms-size);
	flex: 1 1;
	${({ theme, isDisabled, mineColor }) => css`
		cursor: ${isDisabled ? "default" : "pointer"};
		color: ${mineColor ?? theme.backgroundContrast};
	`}

	&:hover,
	&:focus,
	&:active {
		z-index: 100;
	}

	> * {
		margin: 0 !important;
	}

	.btn-content {
		display: flex;
		align-items: center;
	}

	svg {
		height: var(--ms-size);
		width: var(--ms-size);
	}
`

const ActionsMenu = styled.div`
	position: fixed;
	z-index: 100;
	${({ cellOpened, userOpened }) => css`
		> div {
			display: ${userOpened ? "block" : "none"};
			visibility: ${cellOpened ? "visible" : "hidden"};
		}
	`}
`

const MenuRow = styled.div`
	margin: 0.75em;
	position: relative;
	height: 2.75em;
	width: 2.75em;
	transition: transform 0.2s;
	&:active {
		transform: scale(1.2);
	}
	${({ theme }) => css`
		svg {
			height: 100%;
			fill: ${themes.red.highlight};
			filter: drop-shadow(0px 0px 1px ${opac(0.5, theme.lightestColor)});

			#SvgShovel {
				transform: scale(0.9);
			}
		}
	`}
`

const RowBG = styled.div`
	position: absolute;
	height: 100%;
	width: 100%;
	top: 0;
	left: 0;
	border-radius: 50%;
	z-index: -1;
	${({ theme }) => css`
		background: ${theme.highlightContrast};
	`}
`

/* -------------------------------------------------------------------------- */

function determineMenuPos(boundaryRef, menuRef, cellRef) {
	const menu = menuRef?.current
	const bdry = boundaryRef?.current
	const cell = cellRef?.current
	if (!bdry || !menu || !cell) return false

	let br = getRect(bdry)
	let mr = getRect(menu)
	let cr = getRect(cell)

	menu.style.left = `${cr.left - mr.width}px`
	menu.style.top = `${cr.top - mr.height / 2 + cr.height / 2}px`

	br = getRect(bdry)
	mr = getRect(menu)
	cr = getRect(cell)

	const ofLeft = mr.left <= br.left
	const ofTop = mr.top <= br.top
	const ofBottom = mr.bottom >= br.bottom

	if (ofLeft) menu.style.left = `${cr.right}px`
	if (ofTop) menu.style.top = `${cr.bottom}px`
	if (ofBottom) menu.style.top = `${br.height - mr.height - cr.height}px`
	return true
}

/* -------------------------------- COMPONENT ------------------------------- */

// Dumb way to easily reference other cell's open/close menu setState cb.
let curCellSetCb = null

function Cell({
	children,
	data,
	altPattern,
	isMobileSite,
	colorMap,
	boardRef,
	dig,
	flag,
	digArea,
	game_id,
	...props
}) {
	const { id, coords, isDug, isFlagged, isMine, surMines } = data

	const cellRef = useRef()
	const menuRef = useRef()

	// Calculate menu position on initial opening
	const [calcedCSS, setCalcedCSS] = useState(false)
	const [userOpened, setUserOpened] = useState(false)
	const cellOpened = calcedCSS && userOpened

	// Remove reference to open/close menu setState call on cell unmount.
	useEffect(() => {
		setUserOpened(false)
		setCalcedCSS(false)
		return () => {
			curCellSetCb = null
		}
	}, [data])

	useEffect(() => {
		if (!userOpened || calcedCSS) return
		let outcome = determineMenuPos(boardRef, menuRef, cellRef)
		if (outcome) setCalcedCSS(true)
	}, [userOpened, boardRef, calcedCSS])

	function digAreaMobileWrap() {
		if (isDug && surMines > 0) digArea(coords)
		else dig(coords)
	}

	// Each cell has menu close/open state for mobile. Close open menus of other cells.
	function handleClick(e) {
		e.stopPropagation()
		if (curCellSetCb && setUserOpened !== curCellSetCb) curCellSetCb?.(false)
		if (!isMobileSite) return
		curCellSetCb = setUserOpened
		setUserOpened((prev) => !prev)
	}

	// Determine colors based on cell state.
	let colors = { setColor: !isDug ? "highlightContrast" : "backgroundContrast" }
	if (isDug && isMine) {
		colors.setTheme = "dark"
		colors.setColor = "highlight"
	}

	// Determines content based on cell state.
	let cellContent = null
	if (isFlagged) cellContent = <SvgFlag />
	else if (isDug) {
		if (isMine) cellContent = <SvgBomb />
		else if (surMines > 0) cellContent = surMines
	}

	return (
		<Root {...props} altPattern={altPattern} isDug={isDug} cellOpened={cellOpened} ref={cellRef}>
			<CellBtn
				{...colors}
				tag="div"
				mineColor={colorMap[surMines - 1]}
				isDisabled={isDug}
				onClick={handleClick}
			>
				{isMobileSite && (
					<ActionsMenu
						ref={menuRef}
						userOpened={userOpened}
						cellOpened={cellOpened}
						calcedCSS={calcedCSS}
					>
						<MenuRow onClick={digAreaMobileWrap} isDisabled={isFlagged || (isDug && surMines < 1)}>
							<RowBG />
							<SvgShovel id="SvgShovel" />
						</MenuRow>
						<MenuRow onClick={() => flag(coords)} isDisabled={isDug}>
							<RowBG />
							<SvgFlag />
						</MenuRow>
						<MenuRow onClick={handleClick}>
							<RowBG />
							<SvgClose />
						</MenuRow>
					</ActionsMenu>
				)}
				{cellContent}
				{children}
			</CellBtn>
		</Root>
	)
}

function cellCompareProps(prev, next) {
	// Return true if nextProps change would render the same as before, false otherwise.
	const mobileDif = prev.isMobileSite !== next.isMobileSite
	const gidDif = prev.game_id !== next.game_id
	const digDif = prev.data?.isDug !== next.data?.isDug
	const flagDif = prev.data?.isFlagged !== next.data?.isFlagged
	if (mobileDif || gidDif || digDif || flagDif) return false
	else return true
}

export default memo(Cell, cellCompareProps)
