import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/services/openAIService";
import type { CreateAgentData } from "@/types/agent";

interface AiSettingsTabProps {
  formData: CreateAgentData;
  handleInputChange: (field: keyof CreateAgentData, value: any) => void;
}

export const AiSettingsTab = ({ formData, handleInputChange }: AiSettingsTabProps) => {
  const { toast } = useToast();
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [availableAssistants, setAvailableAssistants] = useState<{ id: string; name: string }[]>([]);
  const [fetchingOpenAiResources, setFetchingOpenAiResources] = useState(false);
  const [selectedAssistantName, setSelectedAssistantName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (formData.openai_assistant_id && availableAssistants.length > 0) {
      const foundAssistant = availableAssistants.find(a => a.id === formData.openai_assistant_id);
      setSelectedAssistantName(foundAssistant?.name);
    } else {
      setSelectedAssistantName(undefined);
    }
  }, [formData.openai_assistant_id, availableAssistants]);

  const fetchOpenAIResources = async () => {
    const apiKey = formData.openai_api_key;
    if (!apiKey) {
      toast({
        title: "OpenAI API Key Required",
        description: "Please enter your OpenAI API key to fetch models and assistants.",
        variant: "destructive",
      });
      setAvailableModels([]);
      setAvailableAssistants([]);
      return;
    }

    setFetchingOpenAiResources(true);
    try {
      // Fetch models (for chat completion mode)
      const openAIServiceForModels = new OpenAIService({ apiKey, aiMode: 'chat_completion' });
      const models = await openAIServiceForModels.listModels();
      setAvailableModels(models.map(m => ({ id: m.id, name: m.id }))); // Assuming model ID is sufficient for name

      // Fetch assistants (for assistant mode)
      const openAIServiceForAssistants = new OpenAIService({ apiKey, aiMode: 'assistant', listOnly: true });
      const assistants = await openAIServiceForAssistants.listAssistants();
      setAvailableAssistants(assistants.map(a => ({ id: a.id, name: a.name || a.id })));

    } catch (error) {
      console.error("Failed to fetch OpenAI resources:", error);
      toast({
        title: "OpenAI Connection Error",
        description: "Could not fetch models or assistants. Check your API key and ensure it has the necessary permissions.",
        variant: "destructive",
      });
      setAvailableModels([]);
      setAvailableAssistants([]);
    } finally {
      setFetchingOpenAiResources(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Settings</CardTitle>
        <CardDescription>Configure the AI model for your chatbot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ai-mode">AI Mode</Label>
          <Select
            value={formData.ai_mode || 'chat_completion'}
            onValueChange={(value) => handleInputChange("ai_mode", value)}
          >
            <SelectTrigger id="ai-mode">
              <SelectValue placeholder="Select AI Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat_completion">Chat Completion</SelectItem>
              <SelectItem value="assistant">OpenAI Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="openai-api-key">OpenAI API Key</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="openai-api-key"
              type="password"
              value={formData.openai_api_key || ""}
              onChange={(e) => handleInputChange("openai_api_key", e.target.value)}
              placeholder={formData.openai_api_key ? "" : "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
            />
            <Button onClick={fetchOpenAIResources} disabled={fetchingOpenAiResources}>
              {fetchingOpenAiResources ? "Fetching..." : "Fetch Resources"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your OpenAI API key. This will be stored securely.
          </p>
        </div>

        {formData.ai_mode === 'chat_completion' && (
          <div>
            <Label htmlFor="ai-model">AI Model</Label>
            <Select
              value={formData.ai_model_config?.model_name || ""}
              onValueChange={(value) => handleInputChange("ai_model_config", { ...formData.ai_model_config, model_name: value })}
              disabled={fetchingOpenAiResources}
            >
              <SelectTrigger id="ai-model">
                <SelectValue placeholder={fetchingOpenAiResources ? "Loading models..." : "Select an AI model"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-models" disabled>No models available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.ai_mode === 'assistant' && (
          <div>
            <Label htmlFor="openai-assistant-id">OpenAI Assistant</Label>
            <Select
              value={formData.openai_assistant_id || ""}
              onValueChange={(value) => handleInputChange("openai_assistant_id", value)}
              disabled={fetchingOpenAiResources}
            >
              <SelectTrigger id="openai-assistant-id">
                <SelectValue placeholder={fetchingOpenAiResources ? "Loading assistants..." : (selectedAssistantName || "Select an OpenAI Assistant")} />
              </SelectTrigger>
              <SelectContent>
                {availableAssistants.length > 0 ? (
                  availableAssistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-assistants" disabled>No assistants available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedAssistantName && (
              <div>
                <Label htmlFor="selected-assistant-name">Selected Assistant Name</Label>
                <Input
                  id="selected-assistant-name"
                  type="text"
                  value={selectedAssistantName}
                  readOnly
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
