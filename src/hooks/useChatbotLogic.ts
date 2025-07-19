import { useState, useEffect, useRef, useCallback } from "react";
import { PromptResponseService } from "@/services/promptResponseService";
import { ConversationService } from "../services/conversationService";
import { FeedbackService } from "../services/feedbackService";
import { SessionManager } from "../utils/sessionManager";
import { OpenAIService } from "@/services/openAIService";
import { INAPPROPRIATE_WORDS } from "../lib/constants";
import { supabase } from "../integrations/supabase/client";
import { LeadService } from "../services/leadService";

import { isValidUUID, normalizeLinkedInUrl } from "../lib/utils";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
  persona_data?: any; // JSONB type
  linkedin_profile_url?: string;
}

interface UseChatbotLogicProps {
  chatbotData: any;
  previewMode?: "collapsed" | "expanded";
}

export const useChatbotLogic = ({ chatbotData, previewMode }: UseChatbotLogicProps) => {
  const initialPreviewMode = previewMode || "collapsed";

  // State from useChatbotState
  const [internalChatbotData, setInternalChatbotData] = useState<any>(chatbotData);
  const [messages, setMessages] = useState<string[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(initialPreviewMode === "expanded");

  useEffect(() => {
    setIsExpanded(previewMode === "expanded");
  }, [previewMode]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, text: string, sender: 'user' | 'bot', timestamp: Date, feedback_type?: 'up' | 'down'}>>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [messageCount, setMessageCount] = useState(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [linkedInPrompted, setLinkedInPrompted] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Data initialization effect (from ChatbotPreview)
  useEffect(() => {
    if (chatbotData) {
      setInternalChatbotData(chatbotData);
      setIsExpanded(previewMode === 'expanded');
      if (chatbotData?.rotating_messages && chatbotData.rotating_messages.length > 0) {
        setMessages(chatbotData.rotating_messages);
      } else {
        setMessages([
          "Hi there! Need help?",
          "Let's chat!",
          "AI Assistant here",
          "How can I help you?",
          "Ready to get started?"
        ]);
      }
    }
  }, [chatbotData, initialPreviewMode, previewMode]);

  // Helper function to convert hex to HSL (from ChatbotWidget)
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  // Inject dynamic colors into CSS custom properties (from ChatbotWidget)
  useEffect(() => {
    const colors = internalChatbotData?.colors || {
      primary: "#3B82F6",
      bubble: "#F3F4F6", 
      text: "#1F2937"
    };
    if (colors && typeof document !== 'undefined') {
      const primaryHsl = hexToHsl(colors.primary || '#3B82F6');
      const bubbleHsl = hexToHsl(colors.bubble || '#F3F4F6');
      const textHsl = hexToHsl(colors.text || '#1F2937');
      
      document.documentElement.style.setProperty('--widget-primary', primaryHsl);
      document.documentElement.style.setProperty('--widget-bubble', bubbleHsl);
      document.documentElement.style.setProperty('--widget-text', textHsl);
      document.documentElement.style.setProperty('--widget-text-primary', textHsl);
      document.documentElement.style.setProperty('--widget-ring', primaryHsl);
      document.documentElement.style.setProperty('--widget-accent', bubbleHsl);
      document.documentElement.style.setProperty('--widget-gray', bubbleHsl);
    }
  }, [internalChatbotData?.colors]);

  // Message cycling effect (from ChatbotWidget)
  useEffect(() => {
    if (isExpanded) return;
    if (!messages || messages.length === 0) return;
    
    const validMessages = messages.filter(msg => msg && typeof msg === 'string' && msg.trim().length > 0);
    if (validMessages.length === 0) return;
    
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % validMessages.length);
        setIsVisible(true);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [isExpanded, messages]);

  // Auto-scroll to bottom (from ChatbotWidget)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isBotTyping, hasChatHistory]);

  // Session initialization
  useEffect(() => {
    const initializeSession = async () => {
      if (!internalChatbotData?.id) { // Only proceed if agent ID is available
        console.log("Waiting for chatbotData.id to initialize session.");
        return;
      }

      try {
        let existingSessionCookie = SessionManager.getSessionCookie();
          
        if (existingSessionCookie && !SessionManager.isValidUUID(existingSessionCookie)) {
          existingSessionCookie = SessionManager.convertLegacySessionId(existingSessionCookie);
          SessionManager.setSessionCookie(existingSessionCookie);
        }
          
        let newSessionId;
        if (internalChatbotData?.id && isValidUUID(internalChatbotData.id)) {
          newSessionId = await ConversationService.createOrUpdateSession(
            internalChatbotData.id, 
            existingSessionCookie,
            undefined
          );
        } else {
          newSessionId = SessionManager.generateSessionId();
        }
        setSessionId(newSessionId);
        SessionManager.setSessionCookie(newSessionId);
        console.log("Session initialized with agent ID:", internalChatbotData.id, "Session ID:", newSessionId);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        // Fallback to a temporary session if agent ID is somehow invalid or service fails
        const fallbackSessionId = SessionManager.generateSessionId();
        setSessionId(fallbackSessionId);
        SessionManager.setSessionCookie(fallbackSessionId);
        console.log("Using fallback session due to error:", fallbackSessionId);
      }
    };
    initializeSession();
  }, [internalChatbotData?.id, supabase]);

  // Load suggested prompts from Q&A pairs (from ChatbotWidget)
  useEffect(() => {
    const loadSuggestedPrompts = async () => {
      if (internalChatbotData?.id && isValidUUID(internalChatbotData.id)) {
        try {
          const qnaPairs = await PromptResponseService.getPromptResponses(internalChatbotData.id);
          const suggestivePrompts = qnaPairs
            .filter(pair => !pair.is_dynamic)
            .slice(0, 3)
            .map(pair => pair.prompt);
          setSuggestedPrompts(suggestivePrompts);
        } catch (error) {
          console.log('No Q&A pairs found for auto-suggestions:', error);
          setSuggestedPrompts([]);
        }
      } else {
        setSuggestedPrompts([]);
      }
    };
    
    loadSuggestedPrompts();
  }, [internalChatbotData?.id]);

  // Fetch user profile on login or component mount if user is already logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching user profile:', error);
          return null;
        }

        if (profile) {
          return profile;
        } else {
          // Profile not found, create a new one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email, // Assuming email is always available
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
              role: 'user', // Default role for chatbot users
            })
            .select('*')
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          return newProfile;
        }

        if (profile) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          fetchUserProfile();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run once on mount and on auth state changes

  // Conditional LinkedIn Prompt display
  useEffect(() => {
    if (currentUser && !currentUser.linkedin_profile_url && !currentUser.persona_data && messageCount >= (internalChatbotData?.linkedin_prompt_message_count || 0) && (internalChatbotData?.linkedin_prompt_message_count || 0) > 0 && !linkedInPrompted) {
      setShowLinkedInPrompt(true);
      setLinkedInPrompted(true); // Ensure it only prompts once per session
    }
  }, [currentUser, messageCount, internalChatbotData?.linkedin_prompt_message_count, linkedInPrompted]);


  // Handlers (from useChatbotHandlers)
  const handleBubbleClick = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const getSmartSuggestions = useCallback(async (input: string): Promise<string[]> => {
    if (!input.trim() || input.length < 2 || !internalChatbotData?.id || !isValidUUID(internalChatbotData.id)) {
      return [];
    }

    try {
      const lowerInput = input.toLowerCase();
      const promptResponses = await PromptResponseService.getPromptResponses(internalChatbotData.id);
      const dynamicPrompts = promptResponses.filter(pr => pr.is_dynamic);

      const matches: string[] = [];
      dynamicPrompts.forEach(prompt => {
        if (prompt.keywords) {
          const keywordMatch = prompt.keywords.some(keyword =>
            lowerInput.includes(keyword.toLowerCase())
          );
          if (keywordMatch) {
            matches.push(prompt.prompt);
          }
        }
      });
      return [...new Set(matches)].slice(0, 3);
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
      return [];
    }
  }, [internalChatbotData?.id]);

  const handlePromptClick = useCallback((prompt: string) => {
    setMessage(prompt);
    setSuggestions([]);
    setIsTyping(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isBotTyping) {
      return;
    }

    const userMessage = message.trim();
    const isPreviewMode = !internalChatbotData?.id || !isValidUUID(internalChatbotData.id);

    const tempUserMessage = {
      id: crypto.randomUUID(),
      text: userMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, tempUserMessage]);
    setMessage("");
    setSuggestions([]);
    setIsTyping(false);
    setHasChatHistory(true);
    setIsBotTyping(true);

    let botResponse;
    let isQnAMatch = false;

    try {
      const lowerCaseMessage = userMessage.toLowerCase();
      const containsInappropriateWord = INAPPROPRIATE_WORDS.some(word => lowerCaseMessage.includes(word));

      if (containsInappropriateWord) {
        console.log("Inappropriate word detected.");
        botResponse = "I'm sorry, I cannot process messages containing inappropriate language.";
        isQnAMatch = true;
      } else if (!isPreviewMode) {
        console.log("Checking for Q&A match for agent ID:", internalChatbotData.id, "and message:", userMessage);
        const matchingResponse = await PromptResponseService.findMatchingResponse(
          internalChatbotData.id,
          userMessage
        );

        if (matchingResponse) {
          console.log("Matching Q&A response found:", matchingResponse);
          botResponse = matchingResponse;
          isQnAMatch = true;
        } else if (internalChatbotData?.lead_collection_enabled && internalChatbotData?.lead_form_triggers?.length > 0) {
          console.log("Lead form triggers:", internalChatbotData.lead_form_triggers);
          console.log("User message (lowercase):", lowerCaseMessage);
          const leadTriggerMatch = internalChatbotData.lead_form_triggers.some((trigger: any) =>
            trigger.keywords.some((keyword: string) => lowerCaseMessage.includes(keyword.toLowerCase()))
          );

          if (leadTriggerMatch) {
            console.log("Lead collection trigger keyword detected. Showing lead form.");
            setShowLeadForm(true);
            botResponse = ""; // No bot response, just show the form
            isQnAMatch = true; // Treat as a Q&A match to skip LLM
          } else {
            console.log("No matching Q&A response or lead trigger found.");
          }
        }
      }

      if (!isQnAMatch) {
        console.log("No Q&A match or lead trigger, calling OpenAI API.");
        const apiKey = internalChatbotData?.openai_api_key || import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
          throw new Error("No OpenAI API key configured");
        }

        const openAIService = new OpenAIService({
          apiKey: apiKey,
          model: internalChatbotData?.ai_model_config?.model_name,
          aiMode: internalChatbotData?.ai_mode || 'chat_completion',
          assistantId: internalChatbotData?.openai_assistant_id,
        });

        const aiResponse = await openAIService.getChatCompletion(userMessage, internalChatbotData?.agentPersona, threadId);
        botResponse = aiResponse.response;
        if (aiResponse.threadId) {
          setThreadId(aiResponse.threadId);
        }
      } else {
        console.log("Q&A match or lead trigger found, skipping OpenAI API call.");
      }

      if (!isPreviewMode) {
        console.log(`[useChatbotLogic] Adding user message to session: ${sessionId}`);
        await ConversationService.addMessage(sessionId, userMessage, 'user');
      }

    } catch (error) {
      console.error("Error processing message:", error);
      botResponse = "I'm sorry, I'm having technical difficulties. Please try again later.";
    } finally {
      setIsBotTyping(false);
      const botMessage = {
        id: crypto.randomUUID(),
        text: botResponse,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, botMessage]);
      
      if (!isPreviewMode) {
        console.log(`[useChatbotLogic] Adding bot message to session: ${sessionId}`);
        await ConversationService.addMessage(sessionId, botResponse, 'bot');
      }
      
      setMessageCount(prev => prev + 1);
    }
  }, [message, isBotTyping, internalChatbotData, sessionId, threadId]);

  const handleMessageChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim()) {
      setIsTyping(true);
      const smartSuggestions = await getSmartSuggestions(value);
      setSuggestions(smartSuggestions);
    } else {
      setIsTyping(false);
      setSuggestions([]);
    }
  }, [getSmartSuggestions]);

  const handleVoiceNote = useCallback(() => console.log("Voice note clicked"), []);
  const handleAttachment = useCallback(() => console.log("Attachment clicked"), []);

  const handleCopyMessage = useCallback((messageText: string) => {
    navigator.clipboard.writeText(messageText);
    setFeedbackMessage("Copied to clipboard!");
    setTimeout(() => setFeedbackMessage(""), 2000);
  }, []);

  const handleFeedback = useCallback(async (type: 'up' | 'down', messageId: string) => {
    await FeedbackService.createFeedback(sessionId, messageId, type);
    setChatHistory(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback_type: type } : msg
      )
    );
    setFeedbackMessage("Thank you for your feedback!");
    setTimeout(() => setFeedbackMessage(""), 2000);
  }, [sessionId]);

  const handleLoginClick = useCallback(() => setShowLoginModal(prev => !prev), []);

  const handleLoginSuccess = useCallback(async (user: any) => {
    // Fetch the full profile data after successful login
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile after login:", error);
      // Optionally handle this error, e.g., show a toast
      return;
    }

    if (profile) {
      setCurrentUser(profile as Profile);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      const newSessionId = await ConversationService.createOrUpdateSession(
        internalChatbotData.id,
        SessionManager.getSessionCookie(),
        user.id
      );
      setSessionId(newSessionId);
      SessionManager.setSessionCookie(newSessionId);
    } else {
      console.error("Profile not found after login for user:", user.id);
      // This case should ideally not happen if handle_new_user() works correctly
      // but handle it gracefully if it does.
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, [internalChatbotData?.id]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setChatHistory([]);
    setHasChatHistory(false);
    setThreadId(undefined);
    const newSessionId = await ConversationService.createOrUpdateSession(internalChatbotData.id, undefined, undefined);
    setSessionId(newSessionId);
    SessionManager.setSessionCookie(newSessionId);
  }, [internalChatbotData?.id]);

  const handleLinkedInSubmit = useCallback(async () => {
    if (linkedinUrlInput.trim() && currentUser?.user_id) {
      const normalizedUrl = normalizeLinkedInUrl(linkedinUrlInput);
      if (normalizedUrl) {
        await ConversationService.updateLinkedInProfile(currentUser.user_id, normalizedUrl);
        setFeedbackMessage("Thank you for sharing your LinkedIn profile!");
        setLinkedinUrlInput("");
        setShowLinkedInPrompt(false);
        // Update currentUser state to reflect the new LinkedIn URL
        setCurrentUser(prev => prev ? { ...prev, linkedin_profile_url: normalizedUrl } : null);
        setTimeout(() => setFeedbackMessage(""), 2000);
      } else {
        setFeedbackMessage("Please enter a valid LinkedIn profile URL or username.");
        setTimeout(() => setFeedbackMessage(""), 2000);
      }
    }
  }, [linkedinUrlInput, currentUser, setCurrentUser]);

  const handleLeadFormSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log("Lead form submitted:", formData);
    try {
      if (!internalChatbotData?.id || !sessionId) {
        console.error("Agent ID or Session ID is missing, cannot submit lead.");
        return;
      }
      await LeadService.submitLead(internalChatbotData.id, sessionId, formData);
      setLeadFormSubmitted(true);
      setShowLeadForm(false);
      const successMessage = internalChatbotData?.lead_success_message || "Thank you! We will get back to you soon.";
      const thankYouMessage = {
        id: crypto.randomUUID(),
        text: successMessage,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, thankYouMessage]);
    } catch (error) {
      console.error("Failed to submit lead:", error);
      const errorMessage = "Failed to submit your lead. Please try again.";
      const errorBotMessage = {
        id: crypto.randomUUID(),
        text: errorMessage,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorBotMessage]);
    }
  }, [internalChatbotData?.id, internalChatbotData?.lead_success_message, sessionId]);

  const handleLeadFormCancel = useCallback(() => setShowLeadForm(false), []);

  return {
    // State
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

    // Handlers
    handleBubbleClick,
    handleClose,
    getSmartSuggestions,
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
  };
};
