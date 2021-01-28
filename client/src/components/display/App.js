import { useMemo, useContext } from "react"

import { Contexts } from "../../shared/shared"
import SocialLogin from "../auth/SocialLogin"
import { mountableApps } from "./Display"

/* -------------------------------- COMPONENT ------------------------------- */

function App({ title, isFocused, tabHidden }) {
	// isFocused is primarily used for UI/CSS related things and isn't sufficient for an app that wants
	// to make sure the user is actively participating.
	const appActive = !tabHidden && isFocused

	// Some apps require the user to be logged in. We check this per 'app' config and the Auth context.
	const { isAuthed, user } = useContext(Contexts.Auth)

	// Prevent renders for apps from frequent Display and Window component updates.
	const App = mountableApps[title]
	const memoApp = useMemo(() => <App appActive={appActive} title={title} user={user} />, [
		appActive,
		title,
		user,
	])

	if (App && (!App.shared.authRequired || (App.shared.authRequired && isAuthed && user))) {
		return memoApp
	} else {
		return <SocialLogin reason={App?.shared.authReasoning} />
	}
}

export default App
