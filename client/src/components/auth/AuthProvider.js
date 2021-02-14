import { useState, useEffect, useMemo } from "react"

import { Contexts, Debug } from "../../shared/shared"

const debug = new Debug("AuthProvider: ", true)

function AuthProvider({ children }) {
	const [isAuthed, setIsAuthed] = useState(false)
	const [user, setUser] = useState(null)

	function getUser() {
		fetch("/auth/user", {
			credentials: "include",
		})
			.then((res) => res.json())
			.then((data) => {
				debug.log("Auth getUser() init data: ", data)
				if (data?.error && isAuthed) {
					setIsAuthed(false)
					debug.log("setIsAuthed(FALSE) parsedData: ", data)
				} else if (data?.pid && !isAuthed) {
					setIsAuthed(true)
					setUser(data)
					debug.log("setIsAuthed(TRUE) parsedData: ", data)
				}
			})
			.catch((error) => console.error("<AuthProvider /> getUser() error: ", error))
	}

	useEffect(() => {
		getUser()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const authContext = useMemo(() => ({ isAuthed, user }), [isAuthed, user])

	return <Contexts.Auth.Provider value={authContext}>{children}</Contexts.Auth.Provider>
}

export default AuthProvider
