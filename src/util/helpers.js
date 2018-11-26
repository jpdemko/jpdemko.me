export function stringify(value) {
  if (typeof value === 'object') return JSON.stringify(value)
  return value + ''
}

export function simplerFetch(url, action) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw Error(`bad response --> code ${res.status}`)
      return res.json()
    })
    .catch(err => {
      let output = `${action} error: ${err.message}`
      console.log(output)
      Promise.reject(output)
    })
}
