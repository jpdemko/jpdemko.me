import { linearGradient } from 'polished'

let themes = {
  mono: {
    mainColor: '#333',
    altColor: '#e0e0e0',
  },
  blue: {
    mainColor: '#2196F3',
    altColor: '#21CBF3',
  },
  red: {
    mainColor: '#e10050',
    altColor: '#FF8E53',
  },
}

Object.keys(themes).forEach((key) => {
  themes[key].gradient = linearGradient({
    colorStops: [`${themes[key].mainColor} 30%`, `${themes[key].altColor} 85%`],
    toDirection: 'to top right',
    fallback: `${themes[key].mainColor}`,
  })
})

export const sharedCSS = {
  themes,
  media: { desktop: 768 },
}

export const sharedFlags = {
  // Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
  // This is a flag to disable 3D transforms in Chrome for Window components.
  isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
  isIE: !!window.navigator.userAgent.match(/(MSIE|Trident)/),
  debug: true,
}
