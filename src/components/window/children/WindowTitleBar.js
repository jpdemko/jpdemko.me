import React from 'react'
import styled from 'styled-components/macro'

import QueryBreakpoints from '../../../shared/QueryBreakpoints'

const WindowTitleBar = styled.div`
  background: coral;
  display: none;

  @media (min-width: ${QueryBreakpoints.desktop}px) {
    display: flex;
  }

  > * {
    flex: 0 0;
  }
`

const WindowBarButtons = styled.div`
  margin-left: auto;
  display: flex;

  > * {
    flex: 1;
  }
`

export default ({ id, title, isMaximized, minimize, restore, maximize, close }) => (
  <WindowTitleBar id={`window-title-bar-${id}`}>
    <div className="window-title">{title}</div>
    <WindowBarButtons>
      <button onClick={minimize}>-</button>
      {isMaximized ? <button onClick={restore}>[[]</button> : <button onClick={maximize}>[]</button>}
      <button onClick={() => close(id)}>X</button>
    </WindowBarButtons>
  </WindowTitleBar>
)
