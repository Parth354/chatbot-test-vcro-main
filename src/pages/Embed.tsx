import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ChatbotUI from "@/components/ChatbotUI";
import { AgentService } from "@/services/agentService"
import { supabase } from "@/integrations/supabase/client";
import type { Agent } from "@/types/agent"
import { useChatbotLogic } from "@/hooks/useChatbotLogic";

const Embed = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    internalChatbotData,
    messages,
    suggestedPrompts,
    currentMessageIndex,
    isVisible,
    isExpanded,
    message,
    isTyping,
    suggestions,
    isBotTyping,
    hasChatHistory,
    chatHistory,
    feedbackMessage,
    showLoginModal,
    isLoggedIn,
    currentUser,
    sessionId,
    messageCount,
    showLeadForm,
    leadFormSubmitted,
    showLinkedInPrompt,
    linkedinUrlInput,
    linkedInPrompted,
    threadId,
    scrollContainerRef,
    handleBubbleClick,
    handleClose,
    handlePromptClick,
    handleSendMessage,
    handleMessageChange,
    handleVoiceNote,
    handleAttachment,
    handleCopyMessage,
    handleFeedback,
    handleLoginClick,
    handleLoginSuccess,
    handleSignOut,
    handleLinkedInSubmit,
    handleLeadFormSubmit,
    handleLeadFormCancel,
    setLinkedinUrlInput,
  } = useChatbotLogic({ chatbotData: agent, previewMode: "expanded" });

  useEffect(() => {
    if (!agentId) {
      setError("Agent ID is missing.");
      setLoading(false);
      return;
    }
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);
      const agentData = await AgentService.getAgent(agentId, supabase);
      if (agentData) {
        setAgent(agentData);
        
      } else {
        setError("Agent not found.");
      }
    } catch (error) {
      
      setError("Failed to load agent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-muted-foreground">Agent data not available.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center p-4">
      
      <ChatbotUI
        chatbotData={agent}
        previewMode="expanded"
        isLivePreview={false}
        loadingChatbotData={loading}
      />
    </div>
  )
}

export default Embed