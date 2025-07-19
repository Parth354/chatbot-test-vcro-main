import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgentService } from "@/services/agentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { validateAgentData } from "@/schemas/agentValidation";
import type { CreateAgentData, UpdateAgentData } from "@/types/agent";

export const useAgentCustomizeSave = (formData: CreateAgentData, setValidationErrors: (errors: { field: string, message: string }[]) => void, setCurrentTab: (tab: string) => void, agentId: string | undefined, setHasUnsavedChanges: (hasChanges: boolean) => void, loadAgent: () => Promise<void>) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log("AgentCustomize: handleSave called.");
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate form data
    const validation = validateAgentData(formData);
    console.log("AgentCustomize: Validation result:", validation);

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

      // Find which tab contains the first error and switch to it
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
        description: "You must be logged in to save agents.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      console.log("AgentCustomize: Saving agent data:", formData);

      if (agentId) {
        console.log("Updating existing agent:", agentId);
        await AgentService.updateAgent(agentId, formData as UpdateAgentData);
        console.log("Agent updated successfully.");
        toast({
          title: "Success",
          description: "Agent updated successfully!",
        });
        setHasUnsavedChanges(false);
        await loadAgent(); // Reload to get updated data
      }
    } catch (error) {
      console.error('AgentCustomize: Failed to save agent. Raw error object:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred. Check the console for details.`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      console.log("Saving process finished. Saving state:", saving);
    }
  };

  return { saving, handleSave };
};