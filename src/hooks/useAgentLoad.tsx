import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgentService } from "@/services/agentService";
import { useToast } from "@/hooks/use-toast";
import type { Agent, CreateAgentData } from "@/types/agent";

interface UseAgentLoadProps {
  agentId: string | undefined;
  setAgent: (agent: Agent | null) => void;
  setFormData: (data: CreateAgentData) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const useAgentLoad = ({ agentId, setAgent, setFormData, setHasUnsavedChanges }: UseAgentLoadProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const loadAgent = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const agentData = await AgentService.getAgent(agentId);
      if (!agentData) {
        toast({
          title: "Agent not found",
          description: "The requested agent could not be found.",
          variant: "destructive"
        });
        navigate('/admin');
        return;
      }
      setAgent(agentData);
      const newFormData = {
        name: agentData.name || '',
        description: agentData.description || '',
        avatar_url: agentData.avatar_url || '',
        welcome_message: agentData.welcome_message || 'Hello! How can I help you today?',
        cta_buttons: agentData.cta_buttons || [],
        rotating_messages: agentData.rotating_messages || [],
        colors: agentData.colors || { primary: "#3B82F6", bubble: "#F3F4F6", text: "#1F2937" },
        status: agentData.status || 'active',
        lead_collection_enabled: agentData.lead_collection_enabled || false,
        lead_form_triggers: agentData.lead_form_triggers || [],
        lead_backup_trigger: agentData.lead_backup_trigger || { enabled: false, message_count: 5 },
        lead_form_fields: agentData.lead_form_fields || [],
        lead_submit_text: agentData.lead_submit_text || 'Submit',
        lead_success_message: agentData.lead_success_message || 'Thank you! We will get back to you soon.',
        linkedin_url: agentData.linkedin_url || '',
        linkedin_prompt_message_count: agentData.linkedin_prompt_message_count || 0,
        ai_model_config: agentData.ai_model_config || { model_name: "gpt-3.5-turbo" },
        ai_mode: agentData.ai_mode || 'chat_completion',
        openai_assistant_id: agentData.openai_assistant_id || '',
        openai_api_key: agentData.openai_api_key || '',
      };
      setFormData(newFormData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load agent:', error);
      toast({
        title: "Error",
        description: "Failed to load agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, loadAgent };
};
