import React from 'react'

let instances = 0
export default class Wrap extends React.Component {
  constructor(props) {
    super(props)
    this.id = ++instances
  }
  render() {
    return <div>{`id: ${this.id}`}</div>
  }
}
