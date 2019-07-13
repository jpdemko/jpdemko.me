import { sharedFlags } from './variables'

export function getStyleProperty(ele, prop, parseValue = false) {
  const styleProp = window.getComputedStyle(ele).getPropertyValue(prop)
  return parseValue ? parseFloat(styleProp.match(/\d+\.?\d*/)[0]) : styleProp
}

export function simplerFetch(url, action) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw Error(`bad response --> code ${res.status}`)
      return res.json()
    })
    .catch((err) => {
      let output = `${action} error: ${err.message}`
      console.log(output)
      Promise.reject(output)
    })
}

export function propStartsWith(prop, char) {
  return prop ? prop.toLowerCase().startsWith(char) : false
}

export function getRect(target) {
  target = typeof target === 'string' ? document.getElementById(target) : target
  return target.getBoundingClientRect()
}

export function safeTranslate(adjustments) {
  const is3D = adjustments.split(',').length > 2
  const vars = `${adjustments}${sharedFlags.isChrome || is3D ? '' : ', 0'}`
  const translateType = `translate${!sharedFlags.isChrome || is3D ? '3d' : ''}`
  return `${translateType}(${vars})`
}
