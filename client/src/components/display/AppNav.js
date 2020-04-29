import * as React from "react"
import styled from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as MenuSVG } from "../../shared/assets/icons/menu.svg"
import { Contexts } from "../../shared/shared"
import Drawer from "../ui/Drawer"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import Loading from "../ui/Loading"
import SocialLogin from "../auth/SocialLogin"

/* --------------------------------- STYLES --------------------------------- */

const MobileHamburgerButton = styled(Button)`
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

	const [isLoading, setIsLoading] = React.useState(false)

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
	const toggleDrawer = React.useCallback(() => {
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
			toggleDrawer,
			setIsLoading,
		}),
		[toggleDrawer]
	)

	// Sets the appropriate callback for the global nav/taskbar mobile menu nav button.
	React.useEffect(() => {
		if (isFocused && drawerContent) setMainNavBurgerCB(toggleDrawer)
	}, [isFocused, drawerContent, setMainNavBurgerCB, toggleDrawer])

	// Prevent renders for apps. They only care about context which will override memo.
	const memoApp = React.useMemo(() => <app.class />, [])

	// Some apps require the user to be logged in. We check this per 'app' config and the Auth context.
	const authContext = React.useContext(Contexts.Auth)

	if (app && (!app.class.shared.authRequired || (app.class.shared.authRequired && authContext.isAuthed))) {
		return (
			<>
				<Drawer side="right" isShown={drawerOpened} onClose={toggleDrawer}>
					{drawerContent}
				</Drawer>
				{isMobileWindow && !isMobileSite && drawerContent && (
					<MobileHamburgerButton variant="fancy" onClick={toggleDrawer} svg={MenuSVG} />
				)}
				<Loading isLoading={isLoading} />
				<Contexts.AppNav.Provider value={appNavContextCallbacks}>{memoApp}</Contexts.AppNav.Provider>
			</>
		)
	} else return <SocialLogin />
}

export default AppNav
