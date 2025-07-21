import { useState, useEffect, useRef, useCallback } from "react";
import { PromptResponseService } from "@/services/promptResponseService";
import { ConversationService } from "../services/conversationService";
import { FeedbackService } from "../services/feedbackService";
import { SessionManager } from "../types/sessionManager";
import { OpenAIService } from "@/services/openAIService";
import { INAPPROPRIATE_WORDS } from "../lib/constants";
import { supabase } from "../integrations/supabase/client";
import { LeadService } from "../services/leadService";
import { AgentService } from "@/services/agentService";
import { useAuth } from "./useAuth";
import { Profile } from "@/types/profile"; // Import the new Profile type

import { isValidUUID, normalizeLinkedInUrl } from "../lib/utils";

interface UseChatbotLogicProps {
  chatbotData: any;
  previewMode?: "collapsed" | "expanded";
}

export const useChatbotLogic = ({ chatbotData, previewMode }: UseChatbotLogicProps) => {
  const { user: authUser, loading: authLoading } = useAuth(); // Use the auth context
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
  const [userPersona, setUserPersona] = useState<any | null>(null); // New state for persona data
  const MESSAGES_PER_LOAD = 10; // Define how many messages to load at once
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const sessionInitializedRef = useRef(false);

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

  // Load initial chat history and handle lazy loading
  // This useEffect is now primarily for initial load and will be simplified
  

  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || !hasMoreMessages) return;

    try {
      const oldScrollHeight = scrollContainerRef.current?.scrollHeight || 0;
      const newMessages = await ConversationService.getChatMessages(sessionId, MESSAGES_PER_LOAD, messagesOffset, true);
      const formattedMessages = newMessages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.created_at),
      }));
      
      setChatHistory(prev => [...formattedMessages, ...prev]);
      setMessagesOffset(prev => prev + formattedMessages.length);
      setHasMoreMessages(formattedMessages.length === MESSAGES_PER_LOAD);

      // Maintain scroll position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - oldScrollHeight;
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    }
  }, [sessionId, messagesOffset, hasMoreMessages]);

  // Scroll event listener for lazy loading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreMessages, hasMoreMessages]);

  // Auto-scroll to bottom (from ChatbotWidget)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isBotTyping, hasChatHistory]);

  const initializeSession = useCallback(async () => {
    if (authLoading || !internalChatbotData?.id) {
      console.log("Waiting for auth state or chatbotData.id to initialize session.");
      return;
    }

    try {
      let newSessionId: string;
      let initialMessages: any[] = [];
      let shouldClearHistory = false; // Flag to control history clearing

      if (authUser) {
        // Try to find an existing session for the logged-in user and agent
        const existingSession = await ConversationService.getLatestSessionForUserAndAgent(authUser.id, internalChatbotData.id, true);
        if (existingSession) {
          newSessionId = existingSession.id;
          initialMessages = await ConversationService.getChatMessages(newSessionId, MESSAGES_PER_LOAD, 0, true);
          console.log("Found existing session for user:", newSessionId);
          // If existing session found, don't clear history unless it's a new login after signout
          if (!sessionId || sessionId !== newSessionId) { // Check if session ID actually changed
            shouldClearHistory = true;
          }
        } else {
          // If no existing session, create a new one for the user
          newSessionId = await ConversationService.createOrUpdateSession(
            internalChatbotData.id,
            undefined, // No current session ID to pass, as we want a user-specific one
            authUser.id,
            true // forChatbotWidget
          );
          console.log("Created new session for user:", newSessionId);
          shouldClearHistory = true; // New session, so clear history
        }
      } else {
        // For anonymous users, use or create a session based on cookie
        const currentSessionId = SessionManager.getSessionCookie();
        newSessionId = await ConversationService.createOrUpdateSession(
          internalChatbotData.id,
          currentSessionId,
          undefined,
          true // forChatbotWidget
        );
        initialMessages = await ConversationService.getChatMessages(newSessionId, MESSAGES_PER_LOAD, 0, true);
        console.log("Initialized anonymous session:", newSessionId);
        // Only clear history if it's a new anonymous session (e.g., after logout)
        if (!sessionId || sessionId !== newSessionId) { // Check if session ID actually changed
          shouldClearHistory = true;
        }
      }

      setSessionId(newSessionId);
      SessionManager.setSessionCookie(newSessionId);
      setIsLoggedIn(!!authUser); // Update isLoggedIn state based on authUser presence

      if (shouldClearHistory) {
        setChatHistory([]); // Clear history only if a new session is genuinely started
      }

      const formattedMessages = initialMessages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.created_at),
      }));
      setChatHistory(formattedMessages);
      setMessagesOffset(formattedMessages.length);
      setHasMoreMessages(formattedMessages.length === MESSAGES_PER_LOAD);
      setHasChatHistory(formattedMessages.length > 0);

      console.log("Session initialized/updated with agent ID:", internalChatbotData.id, "Session ID:", newSessionId, "User ID:", authUser?.id);
      sessionInitializedRef.current = true; // Mark session as initialized

    } catch (error) {
      console.error("Failed to initialize session:", error);
      const fallbackSessionId = SessionManager.generateSessionId();
      setSessionId(fallbackSessionId);
      SessionManager.setSessionCookie(fallbackSessionId);
      setIsLoggedIn(false); // Ensure logged out state on error
      setChatHistory([]); // Clear history on error
      console.log("Using fallback session due to error:", fallbackSessionId);
      sessionInitializedRef.current = false; // Reset on error
    }
  }, [internalChatbotData?.id, authUser?.id, authLoading]);

  // Session initialization and user change handling
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Fetch user persona data when user logs in or persona_data flag changes
  useEffect(() => {
    const fetchAndSetPersona = async () => {
      if (authUser && currentUser?.persona_data) {
        try {
          const persona = await AgentService.getUserPerformanceData(authUser.id);
          setUserPersona(persona);
          console.log("Fetched and set user persona:", persona); // Log the fetched persona
        } catch (error) {
          console.error("Error fetching user persona on auth change:", error);
          setUserPersona(null);
        }
      } else {
        setUserPersona(null); // Clear persona if user logs out or has no persona
      }
    };
    fetchAndSetPersona();
  }, [authUser, currentUser?.persona_data]);

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
      if (authLoading) return; // Wait until authentication is resolved

      if (authUser) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          setCurrentUser(null);
          setIsLoggedIn(false);
          return;
        }

        if (profile) {
          setCurrentUser(profile as Profile);
          setIsLoggedIn(true);
        } else {
          console.warn("Profile not found for authenticated user:", authUser.id);
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    fetchUserProfile();
  }, [authUser, authLoading]);

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
    setIsBotTyping(true); // Start typing indicator immediately

    let botResponse;
    let isQnAMatch = false;
    let currentPersonaData = userPersona; // Use the state variable

    console.log("--- handleSendMessage Debug ---");
    console.log("currentUser:", currentUser);
    console.log("currentUser?.persona_data:", currentUser?.persona_data);
    console.log("userPersona (state):", userPersona);

    try {
      // --- Persona Data Fetching (Blocking if not already loaded) ---
      if (currentUser && currentUser.linkedin_profile_url && !currentPersonaData) {
        console.log("Condition met: currentUser exists, linkedin_profile_url is present, and currentPersonaData is null. Attempting to fetch persona...");
        try {
          currentPersonaData = await AgentService.getUserPerformanceDataByLinkedIn(currentUser.linkedin_profile_url);
          setUserPersona(currentPersonaData); // Update state for future messages
          console.log("Fetched persona data during send:", currentPersonaData);
          if (!currentPersonaData) {
            console.warn("No data found in user_performance table for user with LinkedIn URL:", currentUser.linkedin_profile_url);
          }
        } catch (personaError) {
          console.error("Error fetching persona data during message send:", personaError);
        }
      } else if (currentUser && currentUser.linkedin_profile_url && currentPersonaData) {
        console.log("Condition met: currentUser exists, linkedin_profile_url is present, and persona is already loaded.");
      } else if (currentUser && !currentUser.linkedin_profile_url) {
        console.log("Condition NOT met: currentUser exists, but linkedin_profile_url is FALSE.");
      } else {
        console.log("Condition NOT met: currentUser does not exist.");
      }
      // --- End Persona Data Fetching ---

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
        } else {
          const dynamicPrompts = await PromptResponseService.getDynamicPrompts(internalChatbotData.id);
          const exactMatch = dynamicPrompts.find(p => p.prompt.toLowerCase() === lowerCaseMessage);

          if (exactMatch) {
            console.log("Matching dynamic prompt found:", exactMatch);
            botResponse = exactMatch.response;
            isQnAMatch = true;
          } else if (internalChatbotData?.lead_collection_enabled && internalChatbotData?.lead_form_triggers?.length > 0) {
            console.log("Lead form triggers:", internalChatbotData.lead_form_triggers);
            console.log("User message (lowercase):", lowerCaseMessage);
            const leadTriggerMatch = internalChatbotData.lead_form_triggers.some((trigger: any) =>
              trigger.keywords.some((keyword: string) => lowerCaseMessage.includes(keyword.toLowerCase()))
            );

            if (leadTriggerMatch) {
              console.log("Lead collection trigger keyword detected. Showing lead form.");
              // Check for LinkedIn specific trigger and user status
              const linkedinKeywords = ["linkedin", "profile", "connect"]; // Define your LinkedIn trigger keywords
              const isLinkedInTrigger = linkedinKeywords.some(keyword => lowerCaseMessage.includes(keyword));

              if (isLinkedInTrigger && currentUser) {
                if (currentUser.linkedin_profile_url) {
                  botResponse = "We have your LinkedIn. We shall connect soon.";
                  isQnAMatch = true;
                } else {
                  setShowLeadForm(true);
                  botResponse = ""; // No bot response, just show the form
                  isQnAMatch = true; // Treat as a Q&A match to skip LLM
                }
              } else {
                setShowLeadForm(true);
                botResponse = ""; // No bot response, just show the form
                isQnAMatch = true; // Treat as a Q&A match to skip LLM
              }
            } else {
              console.log("No matching Q&A response or lead trigger found.");
            }
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

        let finalUserMessage = userMessage;

        // If persona data is available (either pre-loaded or just fetched), include it
        if (currentPersonaData) {
          console.log("Persona data is available. Constructing persona-infused prompt.");
          const personaPrompt = `The user's persona is: ${JSON.stringify(currentPersonaData)}. Based on this, respond to their query: "${userMessage}"`;
          finalUserMessage = personaPrompt;
          console.log("Sending persona-infused prompt to OpenAI:", finalUserMessage);
        } else {
          console.log("Persona data is NOT available. Sending original message to OpenAI.");
        }

        console.log("Full query sent to OpenAI:", finalUserMessage); // Added log
        const aiResponse = await openAIService.getChatCompletion(finalUserMessage, internalChatbotData?.agentPersona, threadId);
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
  }, [message, isBotTyping, internalChatbotData, sessionId, threadId, currentUser, userPersona]);

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

  const handleLoginClick = useCallback(() => {
    if (!authLoading) {
      setShowLoginModal(prev => !prev);
    }
  }, [authLoading]);

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
      setShowLoginModal(false); // Close modal only after successful profile fetch
    } else {
      console.error("Profile not found after login for user:", user.id);
      setIsLoggedIn(false);
      setCurrentUser(null);
      setShowLoginModal(false); // Close modal even if profile not found
    }
  }, [internalChatbotData?.id]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setChatHistory([]);
    setHasChatHistory(false);
    setThreadId(undefined);
    // Trigger re-initialization to create a new anonymous session
    // The useEffect for session initialization will now pick up the authUser change (to null)
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

        // Add a bot message to confirm the submission
        const botMessage = {
          id: crypto.randomUUID(),
          text: "Thanks for submitting your LinkedIn profile! I will analyze it and get back to you shortly.",
          sender: 'bot' as const,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, botMessage]);

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

      // If the user is logged in and submitted a linkedin profile, update their main profile
      if (currentUser && formData.linkedin_profile) {
        const normalizedUrl = normalizeLinkedInUrl(formData.linkedin_profile);
        if (normalizedUrl) {
          console.log(`[useChatbotLogic] Updating user ${currentUser.user_id} profile with LinkedIn URL: ${normalizedUrl}`);
          await ConversationService.updateLinkedInProfile(currentUser.user_id, normalizedUrl);
          // Update local state to prevent re-prompting
          setCurrentUser(prev => prev ? { ...prev, linkedin_profile_url: normalizedUrl, persona_data: true } : null);
        }
      }

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

  const handleCtaButtonClick = useCallback(async (buttonIndex: number, url: string) => {
    if (sessionId) {
      await ConversationService.incrementCtaButtonClick(sessionId, buttonIndex);
    }
    window.open(url, '_blank');
  }, [sessionId]);

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
    handleCtaButtonClick,
    authLoading,
  };
};
