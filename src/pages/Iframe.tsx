import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ChatbotUI from "@/components/ChatbotUI";
import { AgentService } from "@/services/agentService"
import type { Agent } from "@/types/agent"

const Iframe = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [alignment, setAlignment] = useState<string>("center")
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"collapsed" | "expanded" | undefined>(undefined)
  const [isLivePreview, setIsLivePreview] = useState<boolean>(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const align = urlParams.get("align") || "center"
    const mode = urlParams.get("mode") as "collapsed" | "expanded" | undefined

    setAlignment(align)
    setPreviewMode(mode)
    setIsLivePreview(mode === "expanded") // Set isLivePreview based on mode
    
    if (!agentId) {
      setError("Agent ID is missing.");
      setLoading(false);
      return;
    }
    loadAgent()
  }, [agentId, window.location.search])

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

  const getAlignmentClasses = () => {
    switch (alignment) {
      case "left":
        return "justify-start items-center"
      case "right":
        return "justify-end items-center"
      case "top":
        return "justify-center items-start"
      case "bottom":
        return "justify-center items-end"
      default:
        return "justify-center items-center"
    }
  }

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
    <div className={`w-full h-full min-h-screen bg-transparent flex p-4 ${getAlignmentClasses()}`}>
      <ChatbotUI chatbotData={agent} previewMode={previewMode} isLivePreview={isLivePreview} loadingChatbotData={loading} />
    </div>
  )
}

export default Iframe