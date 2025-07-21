import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgentService } from "@/services/agentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { validateAgentData } from "@/schemas/agentValidation";
import type { CreateAgentData } from "@/types/agent";

export const useAgentSave = (formData: CreateAgentData, setValidationErrors: (errors: { field: string, message: string }[]) => void, setCurrentTab: (tab: string) => void) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setValidationErrors([]);

    const validation = validateAgentData(formData);

    if (!validation.success) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      setValidationErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{
              `Please fix the following errors:\n${errorMessages}`
            }</code>
          </pre>
        ),
        variant: "destructive"
      });

      const firstError = validation.errors[0];
      if (firstError.field.includes('name') || firstError.field.includes('description') ||
          firstError.field.includes('avatar') || firstError.field.includes('welcome')) {
        setCurrentTab("basic");
      } else if (firstError.field.includes('prompt') || firstError.field.includes('dynamic') ||
                 firstError.field.includes('rotating')) {
        setCurrentTab("prompts");
      } else if (firstError.field.includes('lead')) {
        setCurrentTab("leadcollection");
      } else if (firstError.field.includes('color')) {
        setCurrentTab("style");
      }
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create agents.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const newAgent = await AgentService.createAgent(formData);
      toast({
        title: "Success",
        description: "Agent created successfully!",
      });
      navigate(`/admin/agent/${newAgent.id}/customize`);
    } catch (error) {
      toast({
        title: "Error",
        description: `An unexpected error occurred. Check the console for details.`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleSave };
};