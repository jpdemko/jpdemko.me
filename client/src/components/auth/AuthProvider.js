import { useState, useEffect, useMemo } from "react"

import { Contexts } from "../../shared/shared"

function AuthProvider({ children }) {
	const [isAuthed, setIsAuthed] = useState(false)
	const [user, setUser] = useState(null)

	function getUser() {
		fetch("/auth/user", { withCredentials: true })
			.then((res) => res?.json?.())
			.then((data) => {
				// console.log("<AuthProvider /> getUser() data: ", data)
				if (data?.error && isAuthed) setIsAuthed(false)
				else if (data?.pid && !isAuthed) {
					setIsAuthed(true)
					setUser(data)
				}
			})
			.catch((error) => console.error("<AuthProvider /> getuser() error: ", error))
	}

	useEffect(() => {
		getUser()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const authContext = useMemo(() => ({ isAuthed, user }), [isAuthed, user])

	return <Contexts.Auth.Provider value={authContext}>{children}</Contexts.Auth.Provider>
}

export default AuthProvider
