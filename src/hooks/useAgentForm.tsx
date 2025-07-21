import { useState } from "react";
import type { CreateAgentData, CTAButton, LeadFormTrigger, LeadFormField } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

export const useAgentForm = () => {
  const { toast } = useToast();

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
    formData,
    setFormData,
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
