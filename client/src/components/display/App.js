import { useMemo, useContext } from "react"

import { Contexts } from "../../shared/shared"
import SocialLogin from "../auth/SocialLogin"
import { mountableApps } from "./Display"

/* -------------------------------- COMPONENT ------------------------------- */

function App({ title, isFocused, tabHidden }) {
	// isFocused is primarily used for UI/CSS related things and isn't sufficient for an app that wants
	// to make sure the user is actively participating.
	const appActive = !tabHidden && isFocused

	// Some apps require the user to be logged in. I check this per 'app' config and the Auth context.
	const { isAuthed, isBanned, user, resetAuth } = useContext(Contexts.Auth)

	// Prevent renders for apps from frequent Display and Window component updates.
	const App = mountableApps[title]
	const memoApp = useMemo(
		() => <App appActive={appActive} title={title} user={user} resetAuth={resetAuth} />,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[appActive, title, user]
	)

	if (App && (!App.shared.authRequired || (App.shared.authRequired && isAuthed && !isBanned && user))) {
		return memoApp
	} else {
		return <SocialLogin reason={App?.shared.authReasoning} />
	}
}

export default App
