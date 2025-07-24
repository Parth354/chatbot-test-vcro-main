import React, { useState, useEffect } from 'react';
import ChatbotUI from './ChatbotUI';
import { AgentService } from '@/services/agentService'; // Import AgentService
import { AuthProvider } from '@/hooks/useAuth'; // Import AuthProvider

interface DirectChatbotEmbedProps {
  botId: string;
  initialState?: 'collapsed' | 'expanded';
  align?: string;
  expandedWidth?: number;
  expandedHeight?: number;
}

const DirectChatbotEmbed: React.FC<DirectChatbotEmbedProps> = ({
  botId,
  initialState = 'collapsed',
  align = 'bottom-right',
  expandedWidth = 320,
  expandedHeight = 600,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialState === 'expanded');
  const [chatbotData, setChatbotData] = useState<any>(null); // State to hold fetched chatbot data
  const [loadingChatbotData, setLoadingChatbotData] = useState(true); // Loading state

  useEffect(() => {
    const fetchChatbotData = async () => {
      if (!botId) {
        setLoadingChatbotData(false);
        return;
      }
      try {
        setLoadingChatbotData(true);
        const data = await AgentService.getAgent(botId); // Fetch full agent data
        setChatbotData(data);
      } catch (error) {
        console.error("Failed to fetch chatbot data for direct embed:", error);
        setChatbotData(null);
      } finally {
        setLoadingChatbotData(false);
      }
    };

    fetchChatbotData();
  }, [botId]); // Re-fetch if botId changes

  const handleResizeRequest = (state: 'collapsed' | 'expanded') => {
    setIsExpanded(state === 'expanded');
  };

  // Dummy navigate function for AuthProvider
  const dummyNavigate = (path: string) => {
    // In a direct embed, you might not want to actually navigate the parent page.
    // You could, for example, open a new tab or handle it differently.
  };

  return (
    <div className={`vcro-direct-embed-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <AuthProvider navigate={dummyNavigate}>
        <ChatbotUI
          chatbotData={chatbotData} // Pass the fetched data
          previewMode={isExpanded ? 'expanded' : 'collapsed'}
          isLivePreview={false}
          loadingChatbotData={loadingChatbotData} // Pass loading state
          onResizeRequest={handleResizeRequest}
          align={align}
        />
      </AuthProvider>
    </div>
  );
};

export default DirectChatbotEmbed;
