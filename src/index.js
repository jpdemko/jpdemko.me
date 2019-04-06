import 'normalize.css'
import 'react-app-polyfill/ie11'

import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components/macro'

import { useMedia } from './shared/customHooks'
import QueryBreakpoints from './shared/QueryBreakpoints'
import registerServiceWorker from './registerServiceWorker'
import Window from './components/window/Window'

const GlobalStyle = createGlobalStyle`
	html {
		box-sizing: border-box;
		font-size: 20px;
	}

	*, *::before, *::after {
		box-sizing: inherit;
	}

	.display {
		height: 100vh;
		position: relative;
		overflow: hidden;
	}
`

const Placeholder = props => (
  <>
    <div>{`content#${props.id} isMobile: ${props.isMobile}`}</div>
    <div>
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolore, totam beatae error praesentium,
      enim molestiae laudantium dolores cupiditate nam adipisci perspiciatis odit maiores tenetur.
      Magnam, qui reprehenderit veritatis, atque, velit repellendus quaerat quae laboriosam facilis enim
      aperiam ea dolor asperiores?
    </div>
    <div>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat soluta recusandae dolorem nostrum
      delectus, illo laudantium vel id! Iste tempore perspiciatis itaque quidem, fugiat ab aperiam!
      Minima harum deserunt iure eligendi enim totam, autem reiciendis minus cumque quaerat. Praesentium
      soluta perferendis totam laboriosam quis nihil, optio suscipit eaque neque ducimus molestias?
      Eligendi placeat vero laudantium dicta in labore temporibus! Ad?
    </div>
  </>
)

let windowInstances = 0

function App() {
  const [apps, setApps] = useState([])
  const isMobile = useMedia([`(min-width: ${QueryBreakpoints.desktop}px)`], [false], true)

  const openApp = (e, title, jsx) => {
    const xOrigin = e.clientX
    const yOrigin = e.clientY
    setApps(prevApps => [...prevApps, { id: ++windowInstances, title, jsx, xOrigin, yOrigin }])
  }

  const closeApp = id => setApps(prevApps => prevApps.filter(app => app.id !== id))

  return (
    <>
      <GlobalStyle />
      <div className="display">
        <button onClick={e => openApp(e, 'BUTTON1', <Placeholder />)}>ADD TOMATO</button>
        <div style={{ marginTop: '50vh' }}>
          <button onClick={e => openApp(e, 'BUTTON2', <Placeholder />)}>ADD STEAK</button>
        </div>
        {apps.map(app => (
          <Window
            key={app.id}
            id={app.id}
            title={app.title}
            isMobile={isMobile}
            xOrigin={app.xOrigin}
            yOrigin={app.yOrigin}
            close={closeApp}
          >
            {React.cloneElement(app.jsx, { id: app.id, isMobile })}
          </Window>
        ))}
      </div>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
