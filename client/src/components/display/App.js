import * as React from "react"

import { Contexts } from "../../shared/shared"
import SocialLogin from "../auth/SocialLogin"
import { mountableApps } from "./Display"

/* -------------------------------- COMPONENT ------------------------------- */

function App({ title, isFocused, tabHidden }) {
	// isFocused is primarily used for UI/CSS related things and isn't sufficient for an app that wants
	// to make sure the user is actively participating.
	const appActive = !tabHidden && isFocused

	// Prevent renders for apps from frequent Display and Window component updates.
	const App = mountableApps[title]
	const memoApp = React.useMemo(() => <App appActive={appActive} />, [appActive])

	// Some apps require the user to be logged in. We check this per 'app' config and the Auth context.
	const authContext = React.useContext(Contexts.Auth)

	if (App && (!App.shared.authRequired || (App.shared.authRequired && authContext.isAuthed))) {
		return memoApp
	} else {
		return <SocialLogin />
	}
}

export default App
