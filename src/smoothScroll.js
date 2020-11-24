/* eslint-disable @typescript-eslint/no-use-before-define */
const SmoothScroll = (target, speed, smooth) => {
  if (target === document)
    target = document.documentElement || document.body.parentNode || document.body // cross browser support for document scrolling

  let moving = false
  let pos = target.scrollLeft
  let beforePos = target.scrollLeft
  target.addEventListener('mousewheel', scrolled, false)
  /* target.addEventListener('DOMMouseScroll', scrolled, false) */

  function scrolled(e) {
    e.preventDefault() // disable default scrolling

    let delta = e.delta || e.wheelDelta
    if (delta === undefined) {
      //we are on firefox
      delta = -e.detail
    }
    delta = Math.max(-1, Math.min(1, delta)) // cap the delta to [-1,1] for cross browser consistency
    beforePos += -delta * speed
    if (beforePos >= 0 && beforePos <= 960) {
      pos += -delta * speed
      beforePos = pos
    } else {
      beforePos = target.scrollLeft
    }

    if (!moving) update()
  }

  function update() {
    moving = true
    let delta = (pos - target.scrollLeft) / smooth

    delta -= 1

    if (pos - target.scrollLeft === smooth * 2) delta = 0
    target.scrollLeft += delta

    if (Math.abs(delta) > 0.5) requestFrame(update)
    else moving = false
  }

  const requestFrame = (function() {
    // requestAnimationFrame cross browser
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(func) {
        window.setTimeout(func, 1000 / 50)
      }
    )
  })()
}

export default SmoothScroll