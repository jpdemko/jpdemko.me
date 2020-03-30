import React from 'react'
import styled, { ThemeProvider } from 'styled-components/macro'

import { useUpdatedValRef } from '../../shared/hooks'
import { ReactComponent as MenuSVG } from '../../shared/assets/icons/menu.svg'
import { themes, Contexts } from '../../shared/constants'
import Drawer from '../ui/Drawer'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import SocialLogin from '../auth/SocialLogin'

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

function AppNav({ app, isFocused, isMobileSite, setMainNavBurgerCB }) {
	const [drawerContent, setDrawerContent] = React.useState(null)
	const [drawerOpened, setDrawerOpened] = React.useState(false)

	const [modalContent, setModalContent] = React.useState()
	const [modalShown, setModalShown] = React.useState(false)

	function toggleModal() {
		setModalShown((prev) => !prev)
	}

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

	// Context callback functions that most apps care about.
	const appNavContextCallbacks = React.useMemo(
		() => ({
			setDrawerContent,
			toggleMobileMenu,
			setModalContent,
			toggleModal,
		}),
		[toggleMobileMenu],
	)

	// Sets the appropriate callback for the global nav/taskbar mobile menu nav button.
	React.useEffect(() => {
		if (isFocused && drawerContent) setMainNavBurgerCB(toggleMobileMenu)
	}, [isFocused, drawerContent, setMainNavBurgerCB, toggleMobileMenu])

	// Prevent renders for apps. They only care about context which will override memo.
	const memoApp = React.useMemo(() => <app.class />, [])

	// Some apps require the user to be logged in. We check this per 'app' config and the Auth context.
	const authContext = React.useContext(Contexts.Auth)

	if (app && (!app.class.shared.authRequired || (app.class.shared.authRequired && authContext.isAuthed))) {
		return (
			<>
				{drawerContent && (
					<>
						<Drawer side='right' isShown={drawerOpened} onClose={toggleMobileMenu}>
							{drawerContent}
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
				<>
					<Modal isShown={modalShown} onClose={toggleModal}>
						{modalContent}
					</Modal>
					<Root>
						<Contexts.AppNav.Provider value={appNavContextCallbacks}>{memoApp}</Contexts.AppNav.Provider>
					</Root>
				</>
			</>
		)
	} else {
		return (
			<Root>
				<SocialLogin />
			</Root>
		)
	}
}

export default AppNav
