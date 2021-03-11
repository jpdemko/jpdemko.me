import { useState, useEffect, useMemo } from "react"

import { Contexts } from "../../shared/shared"

function AuthProvider({ children }) {
	const [isAuthed, setIsAuthed] = useState(false)
	const [isBanned, setIsBanned] = useState(false)
	const [user, setUser] = useState(null)

	function getUser() {
		fetch("/auth/user", {
			credentials: "include",
			withCredentials: true,
		})
			.then((res) => res.json().then((data) => ({ status: res.status, data })))
			.then((res) => {
				const { status, data } = res
				console.log("getUser() res: ", res)
				if (data?.user) console.log("<AuthProvider /> getUser() user: ", data.user)
				switch (status) {
					case 401:
						setUser(null)
						setIsBanned(false)
						setIsAuthed(false)
						break
					case 403:
						setUser(data?.user)
						setIsBanned(true)
						setIsAuthed(true)
						break
					default:
						setUser(data?.user)
						setIsBanned(false)
						setIsAuthed(true)
						break
				}
				if (data?.error) throw Error(data?.error)
			})
			.catch((error) => console.error("<AuthProvider /> getUser() error: ", error))
	}

	function resetAuth() {
		setUser(null)
		setIsAuthed(false)
		getUser()
	}

	useEffect(() => {
		getUser()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const authContext = useMemo(() => ({ isAuthed, isBanned, user, resetAuth }), [isAuthed, isBanned, user])

	return <Contexts.Auth.Provider value={authContext}>{children}</Contexts.Auth.Provider>
}

export default AuthProvider
