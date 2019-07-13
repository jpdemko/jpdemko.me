import React, { useState } from 'react'

export default function Navigation({ openedApps, isMobile, toggleDesktop }) {
  const [mobileNavOpened, setMobileNavOpened] = useState(false)

  function handleClick(app) {
    app.windowRef.current.toggleMinimize()
    setMobileNavOpened(false)
  }

  return <></>
}
