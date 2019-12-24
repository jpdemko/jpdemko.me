import React from 'react'
import styled, { ThemeProvider } from 'styled-components/macro'

import { useUpdatedValRef } from '../../shared/customHooks'
import { ReactComponent as MenuSVG } from '../../shared/assets/material-icons/menu.svg'
import { themes, Contexts } from '../../shared/shared'
import Drawer from '../ui/Drawer'
import Button from '../ui/Button'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	> div {
		overflow-x: hidden;
		overflow-y: auto;
		position: absolute;
		top: 0;
		height: 100%;
		width: 100%;
	}
`

const MobileContextButtons = styled.div`
	position: absolute;
	margin: 0.5em;
	bottom: 0;
	left: 0;
	z-index: 4000;
`

/* -------------------------------- COMPONENT ------------------------------- */

const AppNav = ({ app, isFocused, isMobileSite, setToggleFocusedAppNavDrawer }) => {
	const [navContent, setNavContent] = React.useState(null)
	const [drawerOpened, setDrawerOpened] = React.useState(false)

	// Prevents possible UI confusion where if the app's drawer is open in mobile and the layout switches
	// to desktop there could be two navs open if the app implements a visible desktop one.
	const isMobileWindow = React.useContext(Contexts.IsMobileWindow)
	React.useEffect(() => {
		if (!isMobileWindow && drawerOpened) setDrawerOpened(false)
	}, [drawerOpened, isMobileWindow])

	// Callback for parent(s)/children. Also prevents the following issues;
	// - prevents drawer closing and opening at the same time making it appear as if it did nothing
	// - prevents drawer opening if not focused
	const tempDisabledRef = React.useRef(false)
	const isFocusedRef = useUpdatedValRef(isFocused)
	const toggleMobileMenu = React.useCallback(() => {
		if (!tempDisabledRef.current && isFocusedRef.current) {
			tempDisabledRef.current = true
			setDrawerOpened((prev) => !prev)
			setTimeout(() => {
				tempDisabledRef.current = false
			}, 250)
		}
	}, [isFocusedRef])

	const setNavContentCallback = React.useCallback((content) => setNavContent(content), [])

	// Callback functions that apps might care about. Open/close nav drawer and setting nav content.
	const appNavContextCallbacks = React.useMemo(() => ({ toggleMobileMenu, setNavContentCallback }), [
		setNavContentCallback,
		toggleMobileMenu,
	])

	// Sets the appropriate callback for the global nav/taskbar mobile menu nav button.
	React.useEffect(() => {
		if (isFocused && navContent) setToggleFocusedAppNavDrawer(toggleMobileMenu)
	}, [isFocused, navContent, setToggleFocusedAppNavDrawer, toggleMobileMenu])

	// Prevent renders for apps. They only care about context which will override memo.
	const memoApp = React.useMemo(() => <app.class />, [])

	return (
		<>
			{navContent && (
				<>
					<Drawer side='right' isShown={drawerOpened} onClose={toggleMobileMenu}>
						{navContent}
					</Drawer>
					{isMobileWindow && !isMobileSite && (
						<ThemeProvider theme={themes.blue}>
							<MobileContextButtons>
								<Button variant='fancy' onClick={toggleMobileMenu} svg={MenuSVG} />
							</MobileContextButtons>
						</ThemeProvider>
					)}
				</>
			)}
			<Root>
				<Contexts.AppNav.Provider value={appNavContextCallbacks}>{memoApp}</Contexts.AppNav.Provider>
			</Root>
		</>
	)
}

export default AppNav
