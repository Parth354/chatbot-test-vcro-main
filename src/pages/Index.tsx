import ChatbotUI from "@/components/ChatbotUI"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import React, { useState } from "react";

const Index = () => {
  const embedCode = `<script src="${window.location.origin}/embed.js"></script>`
  const iframeCode = `<iframe 
  style="width: 400px; height: 150px; border: none;" 
  src="${window.location.origin}/iframe?align=center"
  scrolling="no">
</iframe>`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const [isExpanded, setIsExpanded] = useState(false);

  const handleBubbleClick = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">VCRO Chatbot Widget</h1>
              <p className="text-muted-foreground mt-2">Professional sales agent widget with animated profile and cycling messages</p>
            </div>
            <Button asChild>
              <Link to="/auth">Admin Panel</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Widget Demo */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Live Demo</h2>
              <div className="bg-card border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                <ChatbotUI 
                  chatbotData={{
                    id: null, // For demo purposes, no real agent ID
                    name: "Demo Agent",
                    description: "This is a demo chatbot.",
                    welcome_message: "Hello! I'm a demo chatbot. How can I help you today?",
                    rotating_messages: ["Hi there!", "How can I assist you?", "Ask me anything!"],
                    cta_buttons: [],
                    colors: {
                      primary: "#3B82F6",
                      bubble: "#F3F4F6",
                      text: "#1F2937"
                    },
                    lead_collection_enabled: false,
                    lead_form_triggers: [],
                    lead_backup_trigger: { enabled: false, message_count: 5 },
                    lead_form_fields: [],
                    lead_submit_text: "Submit",
                    lead_success_message: "Thank you! We will get back to you soon.",
                    ai_model_config: { model_name: "gpt-3.5-turbo" },
                    openai_api_key: "",
                    ai_mode: "chat_completion",
                    openai_assistant_id: "",
                    avatar_url: ""
                  }}
                  previewMode={isExpanded ? "expanded" : "collapsed"}
                  isLivePreview={false}
                  loadingChatbotData={false}
                />
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Widget Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Pulsating ring animations with multiple layers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Cycling text messages (English & Hindi)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Professional profile picture display</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Compact 400×150px responsive design</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Multiple embedding options</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration Options */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Integration Options</h2>
            
            {/* JavaScript Snippet */}
            <Card>
              <CardHeader>
                <CardTitle>Method 1: JavaScript Snippet</CardTitle>
                <CardDescription>Automatically centers the widget on your page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md font-mono text-sm mb-4">
                  {embedCode}
                </div>
                <Button onClick={() => copyToClipboard(embedCode)} variant="outline">
                  Copy JavaScript Code
                </Button>
              </CardContent>
            </Card>

            {/* iFrame Embed */}
            <Card>
              <CardHeader>
                <CardTitle>Method 2: Direct iFrame</CardTitle>
                <CardDescription>Full control over positioning and styling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md font-mono text-sm mb-4 whitespace-pre-wrap">
                  {iframeCode}
                </div>
                <Button onClick={() => copyToClipboard(iframeCode)} variant="outline">
                  Copy iFrame Code
                </Button>
              </CardContent>
            </Card>

            {/* Direct Links */}
            <Card>
              <CardHeader>
                <CardTitle>Direct Access</CardTitle>
                <CardDescription>Test the widget in different configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/embed" target="_blank" rel="noopener noreferrer">
                      View Embed Page
                    </a>
                  </Button>
                </div>
                <div>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/iframe?align=center" target="_blank" rel="noopener noreferrer">
                      View iFrame (Centered)
                    </a>
                  </Button>
                </div>
                <div>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href="/iframe?align=left" target="_blank" rel="noopener noreferrer">
                      View iFrame (Left Aligned)
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
