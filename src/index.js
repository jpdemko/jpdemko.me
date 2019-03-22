import 'react-app-polyfill/ie11'
import 'normalize.css'
import './index.scss'

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'

import Window from './window/Window'
import CustomHooks from './lib/CustomHooks'
import Util from './lib/Util'

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
  const isMobile = CustomHooks.useMedia(
    [`(min-width: ${Util.queryBreakpoints.desktop}px)`],
    [false],
    true
  )

  const addApp = (e, jsx) => {
    const xOrigin = e.clientX
    const yOrigin = e.clientY
    setApps(prevApps => [...prevApps, { id: ++windowInstances, jsx, xOrigin, yOrigin }])
  }

  return (
    <div className="display">
      <button onClick={e => addApp(e, <Placeholder />)}>ADD TOMATO</button>
      <div style={{ marginTop: '50vh' }}>
        <button onClick={e => addApp(e, <Placeholder />)}>ADD STEAK</button>
      </div>
      {apps.map(app => (
        <Window key={app.id} id={app.id} isMobile={isMobile} xOrigin={app.xOrigin} yOrigin={app.yOrigin}>
          {React.cloneElement(app.jsx, { id: app.id, isMobile })}
        </Window>
      ))}
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
