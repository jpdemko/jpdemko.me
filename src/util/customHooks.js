import { useState } from 'react'

function tryCallback(value, callback) {
  try {
    value = callback(value)
  } catch (error) {
    console.log(error)
  }
  return value
}

export function useLocalStorage(key, callback) {
  const [value, setValue] = useState(() => {
    let returnValue = localStorage.getItem(key)
    if (callback) returnValue = tryCallback(returnValue, callback)
    return returnValue
  })

  function set(item, callback) {
    if (callback) item = tryCallback(item, callback)
    localStorage.setItem(key, item)
    setValue(item)
  }

  function reset() {
    localStorage.removeItem(key)
    value = undefined
  }

  return { value, set, reset }
}
