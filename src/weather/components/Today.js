import React from 'react'

const Today = ({ city, now }) => (
  <div className="today">
    <i className={`wi wi-forecast-io-${now.icon} txt-g`} />
    <div className="today-data">
      <div className="txt-xl">{city}</div>
      <div>{now.summary}</div>
      <div className="txt-xl">{Math.round(now.apparentTemperature)}°</div>
    </div>
  </div>
)

export default Today
