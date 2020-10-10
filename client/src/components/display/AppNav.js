import * as React from "react"
import styled from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as MenuSVG } from "../../shared/assets/icons/menu.svg"
import { Contexts } from "../../shared/shared"
import Drawer from "../ui/Drawer"
import Button from "../ui/Button"
import Loading from "../ui/Loading"
import SocialLogin from "../auth/SocialLogin"
import { mountableApps } from "./Display"

/* --------------------------------- STYLES --------------------------------- */

const MobileHamburgerButton = styled(Button)`
	position: absolute;
	margin: 0.5em;
	bottom: 0;
	left: 0;
	z-index: 4000;
`

/* -------------------------------- COMPONENT ------------------------------- */

function AppNav({ title, isFocused, isMobileSite, setMainNavBurgerCB }) {
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

	// isFocused is primarily used for UI/CSS related things and isn't sufficient for an app that wants
	// to make sure the user is actively participating.
	const tabHidden = React.useContext(Contexts.TabHidden)
	const appActive = !tabHidden && isFocused
	// Prevent renders for apps from frequent Display and Window component updates.
	const App = mountableApps[title]
	const memoApp = React.useMemo(() => <App appActive={appActive} />, [appActive])

	// Some apps require the user to be logged in. We check this per 'app' config and the Auth context.
	const authContext = React.useContext(Contexts.Auth)

	// TODO Remove MobileHamburgerButton and implement it inside Window.
	// TODO Move Drawer and Loading features into Window or somewhere else. Need to think about things...
	if (App && (!App.shared.authRequired || (App.shared.authRequired && authContext.isAuthed))) {
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
