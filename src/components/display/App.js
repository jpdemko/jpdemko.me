import React from 'react'

import Drawer from '../ui/Drawer'
import Contexts from '../../shared/contexts'
import { usePrevious, useEffectWithInitial } from '../../shared/customHooks'

const App = ({ app, isFocused, setMobileMenuCallback }) => {
	const [drawerOpened, setDrawerOpened] = React.useState(false)
	const [mobileNavContent, setMobileNavContent] = React.useState(null)

	const isMobileWindow = React.useContext(Contexts.MobileWindow)
	React.useEffect(() => {
		if (!isMobileWindow && drawerOpened) setDrawerOpened(false)
	}, [drawerOpened, isMobileWindow])

	const handleMobileMenu = React.useCallback(() => setDrawerOpened((prev) => !prev), [])

	const appContextCallbacks = React.useMemo(() => ({ setDrawerOpened, setMobileNavContent }), [])

	const prevFocused = usePrevious(isFocused)
	useEffectWithInitial(() => {
		if (isFocused && !prevFocused) setMobileMenuCallback(handleMobileMenu)
	}, [isFocused])

	const MemoApp = React.useMemo(() => React.memo(() => <app.class />), [])

	return (
		<>
			{mobileNavContent && (
				<Drawer side='right' isShown={drawerOpened} onClose={() => setDrawerOpened(false)}>
					{mobileNavContent}
				</Drawer>
			)}
			<Contexts.App.Provider value={appContextCallbacks}>
				<MemoApp />
			</Contexts.App.Provider>
		</>
	)
}

export default App
