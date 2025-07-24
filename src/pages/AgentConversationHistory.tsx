import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, ArrowLeft, Search } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { ConversationService } from "@/services/conversationService";
import type { ChatSession, ChatMessage as ChatMessageType } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

const AgentConversationHistory = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopyMessageNoOp = (messageText: string) => {
    console.log("Copy message (no-op in history):", messageText);
  };

  const handleFeedbackNoOp = async (type: 'up' | 'down', messageId: string) => {
    console.log("Feedback (no-op in history):", type, messageId);
  };

  useEffect(() => {
    if (agentId) {
      loadSessions(agentId);
    }
  }, [agentId]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
    } else {
      setMessages([]);
    }
  }, [selectedSession]);

  const loadMessages = async (sessionId: string) => {
    try {
      const fetchedMessages = await ConversationService.getConversationDetails(sessionId);
      setMessages(fetchedMessages);
      // Update session status to 'read' if it's not already
      if (selectedSession && selectedSession.status === 'unread') {
        await ConversationService.updateChatSessionStatus(sessionId, 'read');
        // Optimistically update the UI state
        setSessions(prevSessions =>
          prevSessions.map(s =>
            s.id === sessionId ? { ...s, status: 'read' } : s
          )
        );
        setSelectedSession(prev => prev ? { ...prev, status: 'read' } : null);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages for this session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadSessions = async (id: string) => {
    try {
      setLoading(true);
      const fetchedSessions = await ConversationService.getChatSessions(id);
      setSessions(fetchedSessions);
      if (fetchedSessions.length > 0) {
        setSelectedSession(fetchedSessions[0]);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (session: ChatSession) => {
    const isAnonymous = session.user_id === null;
    const confirmMessage = isAnonymous
      ? "Are you sure you want to permanently delete this anonymous session and all its messages? This cannot be undone."
      : "Are you sure you want to soft-delete this session? It will be hidden from this view but can be recovered by an admin.";

    if (confirm(confirmMessage)) {
      try {
        if (isAnonymous) {
          await ConversationService.hardDeleteChatSession(session.id);
          toast({
            title: "Session Permanently Deleted",
            description: "The anonymous session and its messages have been permanently deleted.",
            variant: "success",
          });
        } else {
          await ConversationService.softDeleteChatSession(session.id);
          toast({
            title: "Session Soft-Deleted",
            description: "The session has been soft-deleted and is hidden from view.",
            variant: "success",
          });
        }
        setSelectedSession(null);
        loadSessions(agentId!); // Reload sessions after deletion
      } catch (error) {
        console.error("Failed to delete session:", error);
        toast({
          title: "Error",
          description: `Failed to delete session: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAllSessions = async () => {
    if (confirm("Are you sure you want to delete ALL sessions for this agent? Anonymous sessions will be permanently deleted, and authenticated sessions will be soft-deleted.")) {
      console.log("[handleDeleteAllSessions] Confirmed deletion, proceeding to service call.");
      try {
        const allSessions = await ConversationService.getChatSessions(agentId!, {}, true);
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
            console.error(`[handleDeleteAllSessions] Failed to delete session ${session.id}:`, innerError);
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
        setSelectedSession(null);
        setSessions([]); // Clear sessions immediately
        loadSessions(agentId!); // Reload to confirm empty or updated list
      } catch (error) {
        console.error("Failed to delete all sessions:", error);
        toast({
          title: "Error",
          description: `Failed to delete all sessions: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for Sessions */}
      <div className="w-1/4 border-r bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">Conversations</h2>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteAllSessions()}
            disabled={sessions.length === 0}
          >
            Delete All
          </Button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredSessions.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">No sessions found.</p>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border-b cursor-pointer hover:bg-accent ${
                  selectedSession?.id === session.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <p className="font-medium">
                  {session.user_name || session.user_email || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last message: {new Date(session.last_message_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Main Content for Messages */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedSession
                ? `Conversation with ${selectedSession.user_name || selectedSession.user_email || `Session ${selectedSession.id.substring(0, 8)}`}`
                : "Select a conversation"}
            </h2>
            {selectedSession && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSession(selectedSession)}
              >
                Delete Session
              </Button>
            )}
          </div>
          {selectedSession && (
            <p className="text-sm text-muted-foreground">
              Session ID: {selectedSession.id} | Status: {selectedSession.status}
            </p>
          )}
        </div>
        <ScrollArea className="flex-1 p-4">
          {selectedSession ? (
            messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages in this session.</p>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={{
                    id: message.id,
                    sender: message.sender,
                    text: message.content,
                    feedback_type: message.feedback_type,
                  }}
                  botAvatar=""
                  botName=""
                  isLivePreview={true}
                  handleCopyMessage={handleCopyMessageNoOp}
                  handleFeedback={handleFeedbackNoOp}
                />
              ))
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-16 w-16 mb-4" />
              <p className="text-lg">Select a session from the left to view messages.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AgentConversationHistory;