import React from 'react'
import styled, { css } from 'styled-components/macro'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 1 auto;
	${({ theme }) => css`
		background: skyblue;
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function UserList({ focusedRoom = {}, ...props }) {
	return (
		<Root {...props}>
			{focusedRoom?.users?.map((u) => (
				<div key={u.name}>{u.name}</div>
			))}
		</Root>
	)
}

export default UserList
