import { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router-dom"
import ChatbotUI from "@/components/ChatbotUI";
import { AgentService } from "@/services/agentService"
import type { Agent } from "@/types/agent"

const Iframe = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialState, setInitialState] = useState<"collapsed" | "expanded">((urlParams.get("initialState") as "collapsed" | "expanded") || "collapsed")
  const [align, setAlign] = useState<string>((urlParams.get("align") as string) || "bottom-right")

  const handleResizeRequest = (state: "collapsed" | "expanded") => {
    window.parent.postMessage({ type: 'chatbot-resize', state }, '*');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const mode = urlParams.get("initialState") as "collapsed" | "expanded"
    setInitialState(mode || "collapsed")

    const align = urlParams.get("align") || "bottom-right"
    
    if (!agentId) {
      setError("Agent ID is missing.");
      setLoading(false);
      return;
    }
    loadAgent()
  }, [agentId, location.search])

  const loadAgent = async () => {
    if (!agentId) return
    
    try {
      setLoading(true)
      setError(null)
      const agentData = await AgentService.getAgent(agentId)
      if (agentData) {
        setAgent(agentData)
      } else {
        setError("Agent not found.")
      }
    } catch (error) {
      console.error('Failed to load agent:', error)
      setError("Failed to load agent. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center">
        <div role="status" className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-red-500">Error: {String(error)}</p>
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
    <div role="main" className="w-full h-full min-h-screen bg-transparent flex">
      <ChatbotUI 
        chatbotData={agent} 
        previewMode={initialState} 
        isLivePreview={initialState === "expanded"} 
        loadingChatbotData={loading} 
        onResizeRequest={handleResizeRequest} 
        align={urlParams.get("align") || "bottom-right"}
      />
    </div>
  )
}

export default Iframe