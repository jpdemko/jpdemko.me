import React from 'react'
import styled from 'styled-components/macro'

import Drawer from '../ui/Drawer'
import Contexts from '../../shared/contexts'
import { usePrevious, useRefFromValue, useEffectWithInitial } from '../../shared/customHooks'

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

/* -------------------------------- COMPONENT ------------------------------- */

const App = ({ app, isFocused, setMobileMenuCallback }) => {
	const [drawerOpened, setDrawerOpened] = React.useState(false)
	const [mobileNavContent, setMobileNavContent] = React.useState(null)

	// Prevents possible UI confusion where if the app's drawer is open in mobile and the layout switches
	// to desktop there could be two navs open if the app implements a visible desktop one.
	const isMobileWindow = React.useContext(Contexts.MobileWindow)
	React.useEffect(() => {
		if (!isMobileWindow && drawerOpened) setDrawerOpened(false)
	}, [drawerOpened, isMobileWindow])

	// Callback for parent mobile nav and any child button toggle. Also prevents the following issues;
	// - prevents drawer closing and opening at the same time making it appear as if it did nothing
	// - prevents drawer opening if not focused
	const tempDisabledRef = React.useRef(false)
	const isFocusedRef = useRefFromValue(isFocused)
	const toggleMobileMenu = React.useCallback(() => {
		if (!tempDisabledRef.current && isFocusedRef.current) {
			tempDisabledRef.current = true
			setDrawerOpened((prev) => !prev)
			setTimeout(() => {
				tempDisabledRef.current = false
			}, 250)
		}
	}, [isFocusedRef])

	// Checks to see if the app is freshly focused by the user, if so, the mobile app menu will only
	// contain the focused app's nav options.
	const prevFocused = usePrevious(isFocused)
	useEffectWithInitial(() => {
		if (isFocused && !prevFocused) setMobileMenuCallback(toggleMobileMenu)
	}, [isFocused])

	// Callbacks inherited by every app via context to deal with mobile navigation.
	const appContextCallbacks = React.useMemo(() => ({ toggleMobileMenu, setMobileNavContent }), [
		toggleMobileMenu,
	])

	return (
		<>
			{mobileNavContent && (
				<Drawer side='right' isShown={drawerOpened} onClose={toggleMobileMenu}>
					{mobileNavContent}
				</Drawer>
			)}
			<Contexts.App.Provider value={appContextCallbacks}>
				<Root>
					<app.class />
				</Root>
			</Contexts.App.Provider>
		</>
	)
}

export default App
