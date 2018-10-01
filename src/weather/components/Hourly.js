import React from 'react'

class Hourly extends React.Component {
  getHour = time => {
    let date = new Date(time * 1000)
    let localeTime = date.toLocaleTimeString().replace(/:\d+/g, '')
    if (localeTime.includes('AM') || localeTime.includes('PM')) {
      let [hour, tag] = localeTime.split(' ')
      return (
        <div>
          {hour}
          <span>{tag}</span>
        </div>
      )
    }
    return <div>{localeTime}</div>
  }

  render() {}
}

export default Hourly
