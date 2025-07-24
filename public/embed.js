;(() => {
  // Prevent multiple instances
  const isInIframe = window !== window.parent
  if (!isInIframe && window.VCROChatbotLoaded) return
  if (!isInIframe) window.VCROChatbotLoaded = true

  function initializeChatbot() {
    // Skip if already in iframe
    if (isInIframe) return

    // Wait for DOM if not ready
    if (!document.body) {
      setTimeout(initializeChatbot, 10)
      return
    }

    // Get script tag and bot ID
    const scriptTag = document.querySelector('script[src*="embed.js"]')
    const botId = scriptTag ? scriptTag.getAttribute('data-bot-id') : null
    const appUrl = scriptTag ? scriptTag.getAttribute('data-app-url') : null
    const position = scriptTag ? scriptTag.getAttribute('data-position') : 'bottom-right'
    const offsetX = scriptTag ? parseInt(scriptTag.getAttribute('data-offset-x') || '20', 10) : 20
    const offsetY = scriptTag ? parseInt(scriptTag.getAttribute('data-offset-y') || '20', 10) : 20
    const expandedWidth = scriptTag ? parseInt(scriptTag.getAttribute('data-expanded-width') || '400', 10) : 400
    const expandedHeight = scriptTag ? parseInt(scriptTag.getAttribute('data-expanded-height') || '600', 10) : 600
    const initialState = 'collapsed'

    const align = scriptTag ? scriptTag.getAttribute('data-align') : 'bottom-right'

    const baseUrl = appUrl || (scriptTag ? new URL(scriptTag.src).origin : window.location.origin)

    // Create container
    const container = document.createElement("div")
    container.id = "vcro-chatbot-widget"
    document.body.appendChild(container)

    // Create iframe
    const collapsedSize = { width: 60, height: 60 }
    const expandedSize = { width: expandedWidth, height: expandedHeight }

    // Apply initial positioning and size
    function applyPositionAndSize(state) {
      iframe.classList.remove('collapsed', 'expanded');
      iframe.classList.add(state);
      iframe.style.setProperty('--offset-x', `${offsetX}px`);
      iframe.style.setProperty('--offset-y', `${offsetY}px`);
    }

    const iframe = document.createElement("iframe")
    iframe.src = baseUrl + (botId ? `/iframe/${botId}?initialState=${initialState}&align=${align}&expandedWidth=${expandedWidth}&expandedHeight=${expandedHeight}` : `/iframe?initialState=${initialState}&align=${align}&expandedWidth=${expandedWidth}&expandedHeight=${expandedHeight}`)
    iframe.scrolling = "no"
    iframe.classList.add('vcro-chatbot-iframe', position, initialState)

    container.appendChild(iframe)

    // Initial state
    applyPositionAndSize(initialState)

    // Listen for resize messages from iframe
    window.addEventListener('message', (event) => {
      if (event.origin !== baseUrl) { // Ensure message is from our iframe
        return
      }
      if (event.data && event.data.type === 'chatbot-resize') {
        const { state } = event.data
        if (state === 'expanded') {
          applyPositionAndSize('expanded')
        } else {
          applyPositionAndSize('collapsed')
        }
      }
    })
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot)
  } else {
    initializeChatbot()
  }
})()
