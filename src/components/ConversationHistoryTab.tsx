import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Search, Download, Eye, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ConversationService } from "@/services/conversationService";
import type { ChatSession, ChatMessage, ConversationFilters } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

interface ConversationHistoryTabProps {
  agentId: string;
}

export function ConversationHistoryTab({ agentId }: ConversationHistoryTabProps) {
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ChatSession | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();

  useEffect(() => {
    console.log('ConversationHistoryTab - Agent ID:', agentId);
    loadConversations();
  }, [agentId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('ConversationHistoryTab - Loading conversations for agent:', agentId);
      const data = await ConversationService.getChatSessions(agentId, filters);
      console.log('ConversationHistoryTab - Loaded conversations:', data.length);
      setConversations(data);
    } catch (error) {
      console.error('ConversationHistoryTab - Error loading conversations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation history"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const newFilters: ConversationFilters = {
      ...filters,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      keyword: keyword.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter
    };
    setFilters(newFilters);
    
    // Reload with new filters
    loadConversationsWithFilters(newFilters);
  };

  const loadConversationsWithFilters = async (newFilters: ConversationFilters) => {
    try {
      setLoading(true);
      const data = await ConversationService.getChatSessions(agentId, newFilters, true);
      setConversations(data);
    } catch (error) {
      console.error('Error loading filtered conversations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load filtered conversations"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewConversation = async (conversation: ChatSession) => {
    try {
      setSelectedConversation(conversation);
      const messages = await ConversationService.getConversationDetails(conversation.id);
      setConversationMessages(messages);
      setIsDetailDialogOpen(true);

      // Update status to 'read' if it's currently 'unread'
      if (conversation.status === 'unread') {
        await ConversationService.updateChatSessionStatus(conversation.id, 'read');
        loadConversations(); // Reload conversations to reflect status change
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation details"
      });
    }
  };

  const handleExportConversations = () => {
    // Create CSV content
    const csvHeaders = [
      'Date',
      'User Name',
      'User Email',
      'LinkedIn Profile',
      'Messages Count',
      'Last Message',
      'CTA Button 1 Clicks',
      'CTA Button 2 Clicks',
      'Status'
    ];

    const csvRows = conversations.map(conv => [
      format(new Date(conv.created_at), 'yyyy-MM-dd HH:mm:ss'),
      conv.user_name || 'Anonymous',
      conv.user_email || 'N/A',
      conv.linkedin_profile || 'N/A',
      conv.message_count || 0,
      
      conv.cta_button_1_clicks || 0,
      conv.cta_button_2_clicks || 0,
      conv.status
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Conversation history exported successfully"
    });
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      try {
        await ConversationService.hardDeleteChatSession(sessionId);
        toast({
          title: "Success",
          description: "Conversation deleted successfully."
        });
        loadConversations(); // Reload the list
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete conversation."
        });
      }
    }
  };

  const handleDeleteAllConversations = async () => {
    if (confirm("Are you sure you want to delete ALL conversations for this agent? Anonymous sessions will be permanently deleted, and authenticated sessions will be soft-deleted.")) {
      try {
        const allSessions = await ConversationService.getChatSessions(agentId, { includeDeleted: true });
        let hardDeletedCount = 0;
        let softDeletedCount = 0;

        for (const session of allSessions) {
          try {
            if (session.user_id === null) {
              await ConversationService.hardDeleteChatSession(session.id);
              hardDeletedCount++;
            } else {
              await ConversationService.softDeleteChatSession(session.id);
              softDeletedCount++;
            }
          } catch (innerError) {
            toast({
              title: "Deletion Failed for a Session",
              description: `Could not delete session ${session.id}. See console for details.`, 
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Deletion Process Complete",
          description: `Attempted to delete ${allSessions.length} sessions. ${hardDeletedCount} anonymous sessions permanently deleted, ${softDeletedCount} authenticated sessions soft-deleted.`, 
          variant: "success",
        });
        setSelectedConversation(null);
        setConversations([]); // Clear sessions immediately
        loadConversations(); // Reload to confirm empty or updated list
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete all conversations."
        });
      }
    }
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setKeyword("");
    setStatusFilter("all");
    setFilters({});
    loadConversationsWithFilters({});
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      unread: "destructive"
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversation history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <Label>Keyword Search</Label>
              <Input
                placeholder="Search in messages..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleApplyFilters}>
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={handleExportConversations}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllConversations} disabled={conversations.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Conversation History ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No conversations yet</h4>
              <p className="text-muted-foreground">When users start chatting with your agent, their conversations will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last Chat</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>CTA Clicks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{formatDate(conversation.last_message_at || conversation.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {conversation.user_name || 'Anonymous'}
                          </div>
                          {conversation.user_email && (
                            <div className="text-xs text-muted-foreground">
                              {conversation.user_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {conversation.last_message_preview || 'No messages yet'}
                      </TableCell>
                      <TableCell>{conversation.message_count || 0}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          CTA1: {conversation.cta_button_1_clicks || 0} | 
                          CTA2: {conversation.cta_button_2_clicks || 0}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewConversation(conversation)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Conversation with {selectedConversation?.user_name || 'Anonymous'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto p-4">
              {/* Conversation Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <strong>Started:</strong> {formatDate(selectedConversation.created_at)}
                </div>
                <div>
                  <strong>Last Activity:</strong> {formatDate(selectedConversation.last_message_at || selectedConversation.created_at)}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusBadge(selectedConversation.status)}
                </div>
                <div>
                  <strong>Messages:</strong> {selectedConversation.message_count || 0}
                </div>
                {selectedConversation.user_email && (
                  <div>
                    <strong>Email:</strong> {selectedConversation.user_email}
                  </div>
                )}
                {selectedConversation.linkedin_profile && (
                  <div>
                    <strong>LinkedIn:</strong> {selectedConversation.linkedin_profile}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {conversationMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm">{message?.content || '[No Content]'}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (selectedConversation) {
                      await handleDeleteConversation(selectedConversation.id);
                      setIsDetailDialogOpen(false); // Close dialog after deletion
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Conversation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}