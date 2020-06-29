import * as React from "react"
import { useLocation } from "react-router-dom"

import { Contexts } from "../../shared/shared"

function AuthProvider({ children }) {
	const [isAuthed, setIsAuthed] = React.useState(false)
	const [user, setUser] = React.useState(null)
	const location = useLocation()

	React.useEffect(() => {
		// getUser()
	}, [])

	function getUser() {
		fetch("/auth/user", { withCredentials: true })
			.then((res) => {
				if (res.data?.error && isAuthed) setIsAuthed(false)
				else if (res.data?.provider_id && !isAuthed) {
					setIsAuthed(true)
					setUser(res.data)
				}
			})
			.catch(console.log)
	}

	return (
		<Contexts.Auth.Provider
			value={{
				isAuthed,
				user,
				getUser,
			}}
		>
			{children}
		</Contexts.Auth.Provider>
	)
}

export default AuthProvider
