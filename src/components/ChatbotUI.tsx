import React from "react";
import { ChatAuthProvider } from "@/hooks/useChatAuth";
import { Button } from "./ui/button";
import { Mic, Paperclip, Send, Copy, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import LeadCollectionForm from "@/components/LeadCollectionForm";
import ChatbotLoginModal from "./ChatbotLoginModal";
import { Input } from "./ui/input";
import { useChatbotLogic } from "../hooks/useChatbotLogic";

interface ChatbotUIProps {
  chatbotData: any;
  previewMode?: "collapsed" | "expanded";
  isLivePreview?: boolean;
  loadingChatbotData: boolean; // Add this prop
}

const ChatbotUI: React.FC<ChatbotUIProps> = ({ chatbotData, previewMode, isLivePreview, loadingChatbotData: propLoadingChatbotData }) => {
  return (
    <ChatAuthProvider>
      <ChatbotUIContent
        chatbotData={chatbotData}
        previewMode={previewMode}
        isLivePreview={isLivePreview}
        loadingChatbotData={propLoadingChatbotData}
      />
    </ChatAuthProvider>
  );
};

const ChatbotUIContent: React.FC<ChatbotUIProps> = ({ chatbotData, previewMode, isLivePreview, loadingChatbotData: propLoadingChatbotData }) => {
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
  } = useChatbotLogic({ chatbotData, previewMode });

  // Use the prop for loading state
  const isLoading = propLoadingChatbotData || !internalChatbotData;

  // Generic profile SVG for fallback
  const genericProfileSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

  if (isLoading) {
    console.log("ChatbotUI: Displaying loading spinner because isLoading is true.");
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const displayMessages = messages || [];
  const displayPrompts = suggestedPrompts || [];
  const displayChatHistory = chatHistory || [];

  const botName = internalChatbotData?.name || "AI Assistant";
  const botDescription = internalChatbotData?.description || "Your AI helper";
  const botAvatar = internalChatbotData?.avatar_url || genericProfileSvg;
  const welcomeMessage = internalChatbotData?.welcome_message || "Hello! How can I help you today?";
  const ctaButtons = internalChatbotData?.cta_buttons || [];
  const colors = internalChatbotData?.colors || {
    primary: "#3B82F6",
    bubble: "#F3F4F6",
    text: "#1F2937"
  };

  const currentMessage = (internalChatbotData?.rotating_messages && internalChatbotData.rotating_messages.length > 0)
    ? internalChatbotData.rotating_messages[currentMessageIndex % internalChatbotData.rotating_messages.length]
    : (displayMessages && displayMessages.length > 0
      ? displayMessages[currentMessageIndex] || displayMessages[0]
      : "👋 Hi there! Need help?");

  const getAvatarSrc = (originalSrc: string) => {
    if (!originalSrc) {
      return genericProfileSvg;
    }
    return originalSrc;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = genericProfileSvg;
  };

  const renderExpandedContent = () => {
    return (
      <>
        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Greeting - only show when no chat history */}
          {!displayChatHistory.length && (
            <div className="text-center">
              <p className="text-lg text-widget-text-primary font-medium">
                {welcomeMessage}
              </p>
            </div>
          )}

          {/* Suggested Prompts - only show when no chat history */}
          {!displayChatHistory.length && displayPrompts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">Quick suggestions:</p>
              <div className="space-y-2">
                {displayPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="w-full text-left p-3 rounded-xl bg-widget-gray hover:bg-gray-100 transition-colors text-sm text-widget-text-primary animate-pulse-subtle"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat History - Fixed: Use displayChatHistory instead of chatHistory */}
          {displayChatHistory.map((chatMessage) => (
            <div key={chatMessage.id} className={`flex flex-col ${chatMessage.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`${chatMessage.sender === 'user' ? 'max-w-[98%]' : 'max-w-[90%]'} rounded-xl p-3 ${
                chatMessage.sender === 'user' 
                  ? 'bg-widget-primary text-white' 
                  : 'bg-gray-50'
              }`}>
                {chatMessage.sender === 'bot' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-widget-bubble rounded-full border border-widget-ring overflow-hidden flex-shrink-0">
                      <img 
                        src={getAvatarSrc(botAvatar)}
                        alt={`${botName} - AI Clone`} 
                        className="w-full h-full object-cover rounded-full"
                        onError={handleImageError}
                      />
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                      {chatMessage.text}
                    </div>
                  </div>
                )}
                {chatMessage.sender === 'user' && (
                  <div className="text-sm leading-relaxed">
                    {chatMessage.text}
                  </div>
                )}
              </div>
              
              {/* Bot Message Actions */}
              {chatMessage.sender === 'bot' && (
                <div className="flex items-center gap-1 mt-2 ml-11">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCopyMessage(chatMessage.text)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                        >
                          <Copy size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy & Share</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleFeedback('up', chatMessage.id)}
                          className={`p-1.5 transition-colors rounded ${chatMessage.feedback_type === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                        >
                          <ThumbsUp size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share your feedback</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleFeedback('down', chatMessage.id)}
                          className={`p-1.5 transition-colors rounded ${chatMessage.feedback_type === 'down' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share your feedback</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          ))}

          {/* Lead Collection Form */}
          {showLeadForm && internalChatbotData?.lead_form_fields && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <LeadCollectionForm
                fields={internalChatbotData.lead_form_fields}
                submitText={internalChatbotData.lead_submit_text || "Submit"}
                onSubmit={handleLeadFormSubmit}
                onCancel={handleLeadFormCancel}
              />
            </div>
          )}

          {/* Bot Typing Indicator */}
          {isBotTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-widget-bubble rounded-full border border-widget-ring overflow-hidden flex-shrink-0">
                    <img 
                      src={getAvatarSrc(botAvatar)}
                      alt={`${botName} - AI Clone`} 
                      className="w-full h-full object-cover rounded-full"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Typing</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Prompt */}
          {showLinkedInPrompt && !leadFormSubmitted && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
              <p className="text-sm text-blue-800 font-medium">Would you like to share your LinkedIn profile?</p>
              <Input
                type="url"
                placeholder="Enter your LinkedIn URL"
                value={linkedinUrlInput}
                onChange={(e) => setLinkedinUrlInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleLinkedInSubmit} size="sm" className="flex-1">Submit</Button>
                <Button 
                  onClick={() => handleLinkedInSubmit()} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  No Thanks
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Input Area */}
        <div className="p-6 border-t border-gray-100 space-y-4">
          {/* Message Input */}
          <div className="relative bg-widget-gray rounded-2xl border border-gray-200 focus-within:border-widget-ring transition-colors">
            {/* Smart Suggestions */}
            {suggestions && suggestions.length > 0 && (
              <div className="absolute -top-14 left-0 right-0 flex gap-2 mb-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(suggestion)}
                    className="w-full text-left p-3 rounded-xl bg-widget-gray hover:bg-gray-100 transition-colors text-sm text-widget-text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="Type your message..."
              className="w-full p-4 pr-20 bg-transparent resize-none rounded-2xl text-sm text-widget-text-primary placeholder-gray-500 focus:outline-none min-h-[50px] max-h-[120px]"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <button
                onClick={handleAttachment}
                className="p-2 text-gray-400 hover:text-widget-primary transition-colors rounded-full hover:bg-gray-100"
              >
                <Paperclip size={18} />
              </button>
              <button
                onClick={handleVoiceNote}
                className="p-2 text-gray-400 hover:text-widget-primary transition-colors rounded-full hover:bg-gray-100"
              >
                <Mic size={18} />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message?.trim() || isBotTyping}
                className="p-2 bg-widget-primary text-white rounded-full hover:bg-widget-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          {ctaButtons && ctaButtons.length > 0 && (
            <div className="flex gap-3">
              {ctaButtons.map((button, index) => (
                <Button
                  key={index}
                  onClick={() => window.open(button.url, '_blank')}
                  className={`flex-1 font-semibold py-3 rounded-full transition-all duration-200 hover:shadow-lg ${
                    index === 0 
                      ? 'bg-widget-primary hover:bg-widget-primary/90 text-white' 
                      : 'border-2 border-widget-accent text-widget-text-primary hover:bg-widget-accent hover:text-widget-text-primary'
                  }`}
                  variant={index === 0 ? "default" : "outline"}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderMainChatbotUI = () => {
    if (isExpanded) {
      const containerClasses = isLivePreview
        ? "w-full h-full flex flex-col"
        : "fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 font-inter";

      return (
        <div className={containerClasses}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] mx-auto transform transition-all duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3 relative">
                <div className="relative w-14 h-14 bg-widget-bubble rounded-full shadow-md border-2 border-widget-ring overflow-hidden">
                  <img
                    src={getAvatarSrc(botAvatar)}
                    alt={`${botName} - AI Agent`}
                    className="w-full h-full object-cover rounded-full"
                    onError={handleImageError}
                  />
                </div>
                {/* Online status indicator - positioned at bottom-right of avatar */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                <div>
                  <h2 className="text-lg font-semibold text-widget-text-primary">{botName}</h2>
                  <p className="text-sm text-gray-600">{botDescription}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isLoggedIn && (
                  <Button
                    onClick={handleLoginClick}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Login
                  </Button>
                )}
                {isLoggedIn && (
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                  >
                    Sign Out
                  </Button>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {renderExpandedContent()}
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full max-w-[400px] max-h-[150px] p-2 font-inter">
        {/* Text bubble */}
        <div className="mb-2">
          <div
            onClick={handleBubbleClick}
            className="bg-widget-bubble rounded-lg shadow-lg px-3 py-2 relative max-w-[320px] cursor-pointer hover:shadow-xl transition-shadow duration-200"
          >
            <div className={`text-xs font-medium text-widget-text transition-opacity duration-300 whitespace-nowrap ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              {currentMessage}
            </div>
            {/* Speech triangle pointing down */}
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-widget-bubble"></div>
          </div>
        </div>

        {/* Profile bubble with animations */}
        <div className="relative flex-shrink-0">
          {/* Animation rings */}
          <div className="absolute inset-0 rounded-full bg-widget-ring animate-ping-slow opacity-20"></div>
          <div className="absolute inset-0 rounded-full bg-widget-ring animate-pulse-slow opacity-30 animation-delay-500"></div>
          <div className="absolute inset-0 rounded-full bg-widget-ring animate-ping-slow opacity-10 animation-delay-1000"></div>

          {/* Profile picture container */}
          <div
            onClick={handleBubbleClick}
            className="relative w-12 h-12 bg-widget-bubble rounded-full shadow-lg border-2 border-widget-ring overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-200 hover:scale-105 transform"
          >
            <img
              src={getAvatarSrc(botAvatar)}
              alt={`${botName} - AI Agent`}
              className="w-full h-full object-cover rounded-full"
              onError={handleImageError}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderMainChatbotUI()}

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-60">
          {feedbackMessage}
        </div>
      )}

      {/* Login Modal */}
      <ChatbotLoginModal
        isOpen={showLoginModal}
        onClose={handleLoginClick}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default ChatbotUI;
