import React from "react"
import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 1 auto;
	${({ theme }) => css`
		background: skyblue;
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function UserList({ curRoom = {}, ...props }) {
	return (
		<Root {...props}>
			{curRoom?.users?.map((u) => (
				<div key={u.name}>{u.name}</div>
			))}
		</Root>
	)
}

export default UserList
