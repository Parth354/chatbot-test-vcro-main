import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  BarChart3,
  MessageSquare,
  Users,
  ExternalLink,
  LogOut,
  LogIn
} from "lucide-react";
import { AgentService } from "@/services/agentService";
import type { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalMessages: 0,
    todayMessages: 0,
    yesterdayMessages: 0,
    leadsRequiringAttention: 0,
    averageResponseTime: "< 1 min",
    satisfactionRate: "N/A"
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, signInWithGoogleForAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      loadAgentsAndMetrics();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  const loadAgentsAndMetrics = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const agentsData = await AgentService.getAgents(user.id);
      setAgents(agentsData);

      let aggregatedMetrics = {
        totalSessions: 0,
        totalMessages: 0,
        todayMessages: 0,
        leadsRequiringAttention: 0,
        averageResponseTime: "N/A", // Placeholder
        satisfactionRate: "N/A" // Placeholder
      };

      let totalSatisfaction = 0;
      let agentsWithSatisfactionRate = 0;

      for (const agent of agentsData) {
        const agentMetrics = await AgentService.getAgentMetrics(agent.id);
        aggregatedMetrics.totalSessions += agentMetrics.totalSessions;
        aggregatedMetrics.totalMessages += agentMetrics.totalMessages;
        aggregatedMetrics.todayMessages += agentMetrics.todayMessages;
        aggregatedMetrics.yesterdayMessages += agentMetrics.yesterdayMessages; // Add this line
        aggregatedMetrics.leadsRequiringAttention += agentMetrics.leadsRequiringAttention;

        if (agentMetrics.satisfactionRate !== "N/A") {
          totalSatisfaction += parseInt(agentMetrics.satisfactionRate.replace("%", ""));
          agentsWithSatisfactionRate++;
        }
      }

      if (agentsWithSatisfactionRate > 0) {
        aggregatedMetrics.satisfactionRate = `${Math.round(totalSatisfaction / agentsWithSatisfactionRate)}%`;
      }

      const percentageChange = aggregatedMetrics.yesterdayMessages > 0
        ? Math.round(((aggregatedMetrics.todayMessages - aggregatedMetrics.yesterdayMessages) / aggregatedMetrics.yesterdayMessages) * 100)
        : aggregatedMetrics.todayMessages > 0 ? 100 : 0;

      setMetrics({ ...aggregatedMetrics, percentageChange });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agents or metrics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    navigate("/admin/agent/new/customize");
  };

  const handleManageAgent = (agentId: string) => {
    navigate(`/admin/agent/${agentId}/customize`);
  };

  const handleViewHistory = (agentId: string) => {
    navigate(`/admin/agent/${agentId}/history`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin Login</h1>
          <Button onClick={signInWithGoogleForAdmin} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome back, {user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateAgent} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Agent
              </Button>
              <Button variant="outline" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">
                {agents.filter(a => a.status === "active").length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Across all agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.todayMessages}</div>
              <p className="text-xs text-muted-foreground">{metrics.percentageChange >= 0 ? `+${metrics.percentageChange}%` : `${metrics.percentageChange}%`} from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.satisfactionRate}</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Agents</h2>

          {agents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first AI chatbot agent
                </p>
                <Button onClick={handleCreateAgent} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/admin/agent/${agent.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {agent.description && (
                      <CardDescription className="line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Messages</span>
                        <span className="font-medium">{agent.total_messages ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversations</span>
                        <span className="font-medium">{agent.total_conversations ?? 0}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageAgent(agent.id);
                          }}
                          className="flex-1 gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          Settings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHistory(agent.id);
                          }}
                          className="flex-1 gap-1"
                        >
                          <BarChart3 className="h-3 w-3" />
                          Chat History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
