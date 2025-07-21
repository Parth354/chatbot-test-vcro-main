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

    // Create container
    const container = document.createElement("div")
    container.id = "vcro-chatbot-widget"
    document.body.appendChild(container)

    // Get script tag and bot ID
    const scriptTag = document.querySelector('script[src*="embed.js"]')
    const botId = scriptTag ? scriptTag.getAttribute('data-bot-id') : null

    // Determine base URL
    const appUrl = scriptTag ? scriptTag.getAttribute('data-app-url') : null
    const baseUrl = appUrl || (scriptTag ? new URL(scriptTag.src).origin : window.location.origin)
    
    // Create iframe
    const iframe = document.createElement("iframe")
    iframe.src = baseUrl + (botId ? `/embed/${botId}` : "/embed")
    iframe.scrolling = "no"
    iframe.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 400px !important;
      height: 150px !important;
      border: none !important;
      z-index: 2147483647 !important;
      overflow: hidden !important;
      pointer-events: auto !important;
    `
    
    container.appendChild(iframe)
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot)
  } else {
    initializeChatbot()
  }
})()