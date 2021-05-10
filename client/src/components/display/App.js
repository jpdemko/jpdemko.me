import { useMemo, useContext } from "react"

import { Contexts } from "../../shared/shared"
import SocialLogin from "../auth/SocialLogin"
import { mountableApps } from "./Display"

/* -------------------------------- COMPONENT ------------------------------- */

function App({ title }) {
	// Some apps require the user to be logged in. I check this per 'app' config and the Auth context.
	const { isAuthed, isBanned, user, resetAuth } = useContext(Contexts.Auth)

	// Prevent renders for apps from frequent Display and Window component updates.
	const App = mountableApps[title]
	const memoApp = useMemo(
		() => <App title={title} user={user} resetAuth={resetAuth} />,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[title, user]
	)

	if (App && (!App.shared.authRequired || (App.shared.authRequired && isAuthed && !isBanned && user))) {
		return memoApp
	} else {
		return <SocialLogin reason={App?.shared.authReasoning} />
	}
}

export default App
