import { useState } from 'react'
import { stringify } from './helpers'

export function useLocalStorage(key, initValue) {
  const [value, setValue] = useState(() => {
    if (initValue) {
      let convInitValue = stringify(initValue)
      localStorage.setItem(key, convInitValue)
      return convInitValue
    }
    let item = localStorage.getItem(key)
    try {
      return item ? JSON.parse(item) : item
    } catch {
      return item
    }
  })

  function set(value) {
    localStorage.setItem(key, stringify(value))
    setValue(value)
  }

  return [value, set]
}
