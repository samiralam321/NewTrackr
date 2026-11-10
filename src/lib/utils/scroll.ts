/**
 * Smoothly scrolls the main timeline feed (or current active main view / window) to the top,
 * matching the authentic Twitter/X interaction when clicking 'Home' or the active feed tab.
 */
export function scrollToFeedTop() {
  if (typeof window === 'undefined') return

  // 1. Primary: Scroll the central timeline container on dashboard
  const mainFeed = 
    document.getElementById('main-feed-container') || 
    document.querySelector('main.overflow-y-auto') ||
    document.querySelector('main')

  if (mainFeed) {
    mainFeed.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // 2. Also scroll window to top for mobile browsers or fallback layouts
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })

  // 3. Dispatch an event in case any feed component wants to hook into top-scroll
  window.dispatchEvent(new CustomEvent('feed:scroll-to-top'))
}
