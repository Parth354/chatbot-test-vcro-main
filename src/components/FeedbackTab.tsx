import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThumbsUp, ThumbsDown, MessageCircle, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { FeedbackService, type MessageFeedback } from "@/services/feedbackService";
import { useToast } from "@/hooks/use-toast";

interface FeedbackTabProps {
  agentId: string;
}

export function FeedbackTab({ agentId }: FeedbackTabProps) {
  const [feedback, setFeedback] = useState<MessageFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackFilter, setFeedbackFilter] = useState<'up' | 'down' | 'all'>('all');
  const [stats, setStats] = useState({ positive: 0, negative: 0, total: 0 });

  const { toast } = useToast();

  useEffect(() => {
    loadFeedback().then(() => {
      loadStats();
    });
  }, [agentId, feedbackFilter]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await FeedbackService.getFeedbackForAgent(
        agentId, 
        feedbackFilter === 'all' ? undefined : feedbackFilter
      );
      setFeedback(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load feedback data"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await FeedbackService.getFeedbackStats(agentId);
      setStats(statsData);
    } catch (error) {
    }
  };

  const getFeedbackIcon = (type: 'up' | 'down') => {
    return type === 'up' ? (
      <ThumbsUp className="w-4 h-4 text-green-600" />
    ) : (
      <ThumbsDown className="w-4 h-4 text-red-600" />
    );
  };

  const getFeedbackBadge = (type: 'up' | 'down') => {
    return (
      <Badge variant={type === 'up' ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getFeedbackIcon(type)}
        {type === 'up' ? 'Positive' : 'Negative'}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getPositivePercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.positive / stats.total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading feedback data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Messages with feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
            <p className="text-xs text-muted-foreground">
              Thumbs up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
            <p className="text-xs text-muted-foreground">
              Thumbs down
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPositivePercentage()}%</div>
            <p className="text-xs text-muted-foreground">
              Positive feedback rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Type</label>
              <Select value={feedbackFilter} onValueChange={(value: 'up' | 'down' | 'all') => setFeedbackFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All feedback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All feedback</SelectItem>
                  <SelectItem value="up">Positive only</SelectItem>
                  <SelectItem value="down">Negative only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Feedback Messages ({feedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ThumbsUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No feedback yet</h4>
              <p className="text-muted-foreground">
                {feedbackFilter 
                  ? `No ${feedbackFilter === 'up' ? 'positive' : 'negative'} feedback found.`
                  : 'When users rate your bot responses, feedback will appear here.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.session?.user_name || 'Anonymous'}
                          </div>
                          {item.session?.user_email && (
                            <div className="text-xs text-muted-foreground">
                              {item.session.user_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">
                          {item.message?.content || 'Message not found'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          From: {item.message?.sender === 'bot' ? 'Bot' : 'User'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFeedbackBadge(item.feedback_type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.message?.sender === 'bot' ? 'Bot Response' : 'User Message'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getPositivePercentage() >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-800">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  <strong>Excellent performance!</strong>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Your chatbot has a {getPositivePercentage()}% positive feedback rate. Users are very satisfied with the responses.
                </p>
              </div>
            )}

            {getPositivePercentage() < 60 && stats.negative > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  <strong>Room for improvement</strong>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Consider reviewing negative feedback to improve your bot's responses. 
                  Update Q&A pairs or refine dynamic prompts for better user satisfaction.
                </p>
              </div>
            )}

            {stats.total < 10 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <strong>Build feedback data</strong>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Encourage more user interactions to gather meaningful feedback data. 
                  Consider promoting your chatbot or improving response quality.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}