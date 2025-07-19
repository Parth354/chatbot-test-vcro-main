import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye, Palette } from "lucide-react";
import ChatbotUI from "@/components/ChatbotUI";

// Import the new modularized components
import { BasicInfoTab } from "@/components/agent-customize/BasicInfoTab";
import { RotatingMessagesTab } from "@/components/agent-customize/RotatingMessagesTab";
import { LeadCollectionTab } from "@/components/agent-customize/LeadCollectionTab";
import { StyleCustomizationTab } from "@/components/agent-customize/StyleCustomizationTab";
import { AiSettingsTab } from "@/components/agent-customize/AiSettingsTab";

// Import custom hooks
import { useAgentCustomizeForm } from "@/hooks/useAgentCustomizeForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AgentService } from "@/services/agentService";
import { validateAgentData } from "@/schemas/agentValidation";

const AgentCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    description: '',
    avatar_url: '',
    welcome_message: 'Hello! How can I help you today?',
    cta_buttons: [],
    rotating_messages: [],
    colors: {
      primary: "#3B82F6",
      bubble: "#F3F4F6",
      text: "#1F2937"
    },
    status: 'active',
    lead_collection_enabled: false,
    lead_form_triggers: [],
    lead_backup_trigger: { enabled: false, message_count: 5 },
    lead_form_fields: [],
    lead_submit_text: 'Submit',
    lead_success_message: 'Thank you! We will get back to you soon.',
    linkedin_url: '',
    linkedin_prompt_message_count: 0,
    ai_model_config: { model_name: "gpt-3.5-turbo" },
    ai_mode: 'chat_completion',
    openai_assistant_id: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ field: string, message: string }[]>([]);
  const [currentTab, setCurrentTab] = useState("basic");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    newMessage,
    setNewMessage,
    newCtaButton,
    setNewCtaButton,
    newTriggerKeywords,
    setNewTriggerKeywords,
    newFormField,
    setNewFormField,
    handleInputChange,
    handleColorChange,
    addCtaButton,
    removeCtaButton,
    addLeadFormTrigger,
    removeLeadFormTrigger,
    addLeadFormField,
    removeLeadFormField,
    handleResetAppearance,
  } = useAgentCustomizeForm({ formData, setFormData, hasUnsavedChanges, setHasUnsavedChanges });

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(error => error.field === fieldName || error.field.startsWith(fieldName))?.message;
  };

  const handleSave = async () => {
    setValidationErrors([]);
    const validation = validateAgentData(formData);

    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast({ title: "Validation Error", description: "Please fix the errors before saving.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create an agent.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const newAgent = await AgentService.createAgent({ ...formData, user_id: user.id });
      toast({ title: "Success", description: "Agent created successfully!" });
      navigate(`/admin/agent/${newAgent.id}/customize`);
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast({ title: "Error", description: "Failed to create agent. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create New Agent</h1>
                <p className="text-muted-foreground mt-1">
                  Configure your AI chatbot's appearance and behavior
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="prompts">Rotating Messages</TabsTrigger>
                <TabsTrigger value="leadcollection">Lead Collection</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="ai">AI Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <BasicInfoTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  getFieldError={getFieldError}
                  userId={user?.id || ''}
                />
              </TabsContent>

              <TabsContent value="prompts" className="space-y-6">
                <RotatingMessagesTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                />
              </TabsContent>

              <TabsContent value="leadcollection" className="space-y-6">
                <LeadCollectionTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  newCtaButton={newCtaButton}
                  setNewCtaButton={setNewCtaButton}
                  newTriggerKeywords={newTriggerKeywords}
                  setNewTriggerKeywords={setNewTriggerKeywords}
                  newFormField={newFormField}
                  setNewFormField={setNewFormField}
                  addCtaButton={addCtaButton}
                  removeCtaButton={removeCtaButton}
                  addLeadFormTrigger={addLeadFormTrigger}
                  removeLeadFormTrigger={removeLeadFormTrigger}
                  addLeadFormField={addLeadFormField}
                  removeLeadFormField={removeLeadFormField}
                />
              </TabsContent>

              <TabsContent value="style" className="space-y-6">
                <StyleCustomizationTab
                  formData={formData}
                  handleColorChange={handleColorChange}
                  getFieldError={getFieldError}
                />
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <AiSettingsTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview with Two Tabs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your chatbot will appear to visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bubble" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bubble">Bubble View</TabsTrigger>
                    <TabsTrigger value="chat">Chat View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bubble" className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                      <ChatbotUI chatbotData={formData} previewMode="collapsed" isLivePreview={false} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      This is how the chatbot appears when collapsed on your website
                    </p>
                  </TabsContent>

                  <TabsContent value="chat" className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                      <ChatbotUI chatbotData={formData} previewMode="expanded" isLivePreview={true} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      This is how the chatbot appears when users click to start chatting
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleResetAppearance}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            Reset Appearance
          </Button>

          <div className="flex gap-2 items-center">
            {hasUnsavedChanges && (
              <Badge variant="secondary">Unsaved changes</Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed buttons */}
      <div className="h-20"></div>
    </div>
  );
};

export default AgentCreate;