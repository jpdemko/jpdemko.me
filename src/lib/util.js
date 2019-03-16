const Util = {
  getStyleProperty: function(ele, prop, parseValue = false) {
    const styleProp = window.getComputedStyle(ele).getPropertyValue(prop)
    return parseValue ? parseInt(styleProp, 10) : styleProp
  },
  simplerFetch: function(url, action) {
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
}

export default Util
