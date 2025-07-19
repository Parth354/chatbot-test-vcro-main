import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ChatbotUI from '@/components/ChatbotUI';
import { AgentService } from "@/services/agentService";
import { supabase } from '@/integrations/supabase/client';
import type { Agent } from '@/types/agent';

const ChatbotPreviewPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const previewMode = (queryParams.get('mode') || 'expanded') as "collapsed" | "expanded";
  const [chatbotData, setChatbotData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId) {
        setError('Agent ID is missing.');
        setLoading(false);
        return;
      }

      try {
        // Fetch agent data using AgentService
        const data = await AgentService.getAgent(agentId, supabase);
        if (data) {
          setChatbotData(data);
        } else {
          setError('Agent not found.');
        }
      } catch (err) {
        
        setError('Failed to load chatbot preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-600">Loading chatbot preview...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-600">Error: {error}</div>;
  }

  if (!chatbotData) {
    return <div className="flex items-center justify-center h-screen text-gray-600">No chatbot data available.</div>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md h-[600px] bg-white shadow-lg rounded-lg overflow-hidden">
        <ChatbotUI chatbotData={chatbotData} previewMode={previewMode} isLivePreview={true} loadingChatbotData={loading} />
      </div>
    </div>
  );
};

export default ChatbotPreviewPage;
