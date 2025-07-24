// Ensure this script is loaded with type="module" in your HTML:
// <script type="module" src="..."></script>

import React from 'react';
import ReactDOM from 'react-dom/client';
import DirectChatbotEmbed from '../components/DirectChatbotEmbed';

(() => {
  const scriptTag = document.querySelector('script[src*="direct-embed.js"]');
  if (!scriptTag) {
    console.error("Direct embed script tag not found.");
    return;
  }

  const botId = scriptTag.getAttribute('data-bot-id');
  const targetId = scriptTag.getAttribute('data-target-id');
  const initialState = (scriptTag.getAttribute('data-initial-state') || 'collapsed');
  const align = scriptTag.getAttribute('data-align') || 'bottom-right';
  const expandedWidth = parseInt(scriptTag.getAttribute('data-expanded-width') || '320', 10);
  const expandedHeight = parseInt(scriptTag.getAttribute('data-expanded-height') || '600', 10);

  if (!botId) {
    console.error("data-bot-id attribute is missing from the direct embed script tag.");
    return;
  }

  if (!targetId) {
    console.error("data-target-id attribute is missing from the direct embed script tag. Please specify the ID of the div where the chatbot should be rendered.");
    return;
  }

  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    console.error(`Target element with ID '${targetId}' not found for direct chatbot embed.`);
    return;
  }

  // Create a root and render the React component
  const root = ReactDOM.createRoot(targetElement);
  root.render(
    <React.StrictMode>
      <DirectChatbotEmbed
        botId={botId}
        initialState={initialState}
        align={align}
        expandedWidth={expandedWidth}
        expandedHeight={expandedHeight}
      />
    </React.StrictMode>
  );
})();