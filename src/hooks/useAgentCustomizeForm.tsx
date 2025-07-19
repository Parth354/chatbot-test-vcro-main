import { useState, useEffect } from "react";
import type { CreateAgentData, CTAButton, LeadFormTrigger, LeadFormField } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

interface UseAgentCustomizeFormProps {
  formData: CreateAgentData;
  setFormData: React.Dispatch<React.SetStateAction<CreateAgentData>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useAgentCustomizeForm = ({ formData, setFormData, setHasUnsavedChanges }: UseAgentCustomizeFormProps) => {
  const { toast } = useToast();

  const [newMessage, setNewMessage] = useState('');
  const [newCtaButton, setNewCtaButton] = useState<CTAButton>({ label: '', url: '' });
  const [newTriggerKeywords, setNewTriggerKeywords] = useState('');
  const [newFormField, setNewFormField] = useState<LeadFormField>({
    type: 'text',
    label: '',
    placeholder: '',
    required: true,
    id: Date.now().toString(),
    order: 0
  });

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleInputChange = (field: keyof CreateAgentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (colorKey: keyof typeof formData.colors, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors!,
        [colorKey]: value
      }
    }));
  };

  const addCtaButton = () => {
    if (newCtaButton.label.trim() && newCtaButton.url.trim()) {
      setFormData(prev => ({
        ...prev,
        cta_buttons: [...(prev.cta_buttons || []), { ...newCtaButton }]
      }));
      setNewCtaButton({ label: '', url: '' });
    }
  };

  const removeCtaButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cta_buttons: prev.cta_buttons?.filter((_, i) => i !== index) || []
    }));
  };

  const addLeadFormTrigger = () => {
    if (newTriggerKeywords.trim()) {
      const keywords = newTriggerKeywords.split(',').map(k => k.trim()).filter(k => k);
      const newTrigger: LeadFormTrigger = {
        id: Date.now().toString(),
        keywords,
        enabled: true
      };
      setFormData(prev => ({
        ...prev,
        lead_form_triggers: [...(prev.lead_form_triggers || []), newTrigger]
      }));
      setNewTriggerKeywords('');
    }
  };

  const removeLeadFormTrigger = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lead_form_triggers: prev.lead_form_triggers?.filter((_, i) => i !== index) || []
    }));
  };

  const addLeadFormField = () => {
    if (newFormField.label.trim()) {
      const systemFields = formData.lead_form_fields?.filter(f => f.system_field) || [];
      const customFields = formData.lead_form_fields?.filter(f => !f.system_field) || [];

      const field: LeadFormField = {
        id: Date.now().toString(),
        type: newFormField.type,
        label: newFormField.label,
        placeholder: newFormField.placeholder,
        required: newFormField.required,
        order: systemFields.length + customFields.length + 1
      };

      handleInputChange('lead_form_fields', [...systemFields, ...customFields, field]);
      setNewFormField({ type: 'text', label: '', placeholder: '', required: true, id: Date.now().toString(), order: 0 });
    }
  };

  const removeLeadFormField = (index: number) => {
    const customFields = formData.lead_form_fields?.filter(f => !f.system_field) || [];
    const systemFields = formData.lead_form_fields?.filter(f => f.system_field) || [];
    const updatedCustomFields = customFields.filter((_, i) => i !== index);
    handleInputChange('lead_form_fields', [...systemFields, ...updatedCustomFields]);
  };

  const handleResetAppearance = () => {
    if (confirm('Are you sure you want to reset all appearance settings to default? This will reset colors, avatar, messages, and prompts.')) {
      setFormData(prev => ({
        ...prev,
        avatar_url: '',
        colors: {
          primary: "#3B82F6",
          bubble: "#F3F4F6",
          text: "#1F2937"
        },
        rotating_messages: [],
        cta_buttons: []
      }));
      toast({
        title: "Reset Complete",
        description: "All appearance settings have been reset to default values.",
      });
    }
  };

  return {
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
  };
};
