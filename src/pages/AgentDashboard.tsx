import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Settings, BarChart3, MessageSquare, Users, ExternalLink, Edit, Share } from "lucide-react"
import { AgentService } from "@/services/agentService"
import type { Agent } from "@/types/agent"
import { useToast } from "@/hooks/use-toast"
import DeployTab from "@/components/DeployTab"
import { QnATab } from "@/components/QnATab"
import { ConversationHistoryTab } from "@/components/ConversationHistoryTab"
import { FeedbackTab } from "@/components/FeedbackTab"

const AgentDashboard = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalMessages: 0,
    todayMessages: 0,
    leadsRequiringAttention: 0,
    averageResponseTime: "N/A",
    satisfactionRate: "N/A"
  })
  const [loading, setLoading] = useState(true)

  const location = useLocation();

  useEffect(() => {
    console.log("AgentDashboard - useEffect triggered. agentId:", agentId, "location.key:", location.key);
    const loadData = async () => {
      try {
        if (agentId && agentId !== 'new') {
          console.log("AgentDashboard - Starting data load for agentId:", agentId);
          setLoading(true);
          await loadAgent();
          await loadMetrics();
          console.log("AgentDashboard - Data load complete.");
        } else {
          console.log("AgentDashboard - Skipping data load, agentId is new or undefined.", agentId);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [agentId, location.key]);

  const loadAgent = async () => {
    if (!agentId || agentId === 'new') return
    console.log("Loading agent...");
    try {
      const agentData = await AgentService.getAgent(agentId)
      if (!agentData) {
        toast({
          title: "Agent not found",
          description: "The requested agent could not be found.",
          variant: "destructive"
        })
        navigate('/admin')
        return
      }
      setAgent(agentData)
      console.log("Agent loaded successfully.");
    } catch (error) {
      console.error('Failed to load agent:', error)
      toast({
        title: "Error",
        description: "Failed to load agent. Please try again.",
        variant: "destructive"
      })
      navigate('/admin')
    }
  }

  const loadMetrics = async () => {
    if (!agentId || agentId === 'new') return
    console.log("Loading metrics...");
    try {
      const metricsData = await AgentService.getAgentMetrics(agentId)
      setMetrics(metricsData)
      console.log("Metrics loaded successfully.");
    } catch (error) {
      console.error('Failed to load metrics:', error)
      toast({
        title: "Error",
        description: "Failed to load metrics. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBack = () => {
    navigate('/admin')
  }

  const handleCustomize = () => {
    navigate(`/admin/agent/${agentId}/customize`)
  }

  const handleViewHistory = () => {
    navigate(`/admin/agent/${agentId}/history`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Agent not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                {agent.avatar_url ? (
                  <img 
                    src={agent.avatar_url} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Users className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                  {agent.description && (
                    <p className="text-muted-foreground">{agent.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCustomize} className="gap-2">
                <Edit className="h-4 w-4" />
                Customize
              </Button>
              <Button onClick={handleViewHistory} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="qna">Q&A</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.todayMessages}</div>
                  <p className="text-xs text-muted-foreground">Messages today</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Unique conversations</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.averageResponseTime}</div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
            </div>

            {/* Agent Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>Current settings and customization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Welcome Message</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {agent.welcome_message}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Theme Colors</h4>
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: agent.colors.primary }}
                        title="Primary Color"
                      />
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: agent.colors.bubble }}
                        title="Bubble Color"
                      />
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: agent.colors.text }}
                        title="Text Color"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Q&A Pairs</h4>
                  <p className="text-sm text-muted-foreground">Manage prompts and responses in the Q&A tab</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">CTA Buttons</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.cta_buttons.length > 0 ? (
                      agent.cta_buttons.map((button, index) => (
                        <Badge key={index} variant="outline">
                          {button.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No CTA buttons configured</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Agent Settings</CardTitle>
                <CardDescription>Configure your agent's behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCustomize} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Open Customization Panel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qna">
            <QnATab agentId={agentId!} />
          </TabsContent>

          <TabsContent value="conversations">
            <ConversationHistoryTab agentId={agentId!} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab agentId={agentId!} />
          </TabsContent>

          <TabsContent value="deploy">
            <DeployTab agentId={agentId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AgentDashboard