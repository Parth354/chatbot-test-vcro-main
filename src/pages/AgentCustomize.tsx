import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Plus, X, Palette } from "lucide-react"
import { AgentService } from "@/services/agentService"
import ChatbotUI from "@/components/ChatbotUI";

import type { Agent, CreateAgentData, UpdateAgentData, CTAButton, LeadFormTrigger, LeadFormField } from "@/types/agent"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { ImageUpload } from "@/components/ui/image-upload"
import { validateAgentData } from "@/schemas/agentValidation"
import { FieldError } from "@/components/ui/field-error"
import { QnATab } from "@/components/QnATab"
import { AiSettingsTab } from "@/components/agent-customize/AiSettingsTab";
import { PersonalizationTab } from "@/components/agent-customize/PersonalizationTab";

const AgentCustomize = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isNew = agentId === 'new'
  
  const [agent, setAgent] = useState<Agent | null>(null)
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
    ai_model_config: { model_name: "gpt-3.5-turbo" },
    openai_api_key: '',
    ai_mode: 'chat_completion',
    openai_assistant_id: '',
  })
  
  const [newMessage, setNewMessage] = useState('')
  const [newCtaButton, setNewCtaButton] = useState({ label: '', url: '' })
  const [newTriggerKeywords, setNewTriggerKeywords] = useState('')
  const [newFormField, setNewFormField] = useState({ 
    type: 'text' as const, 
    label: '', 
    placeholder: '', 
    required: true 
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{field: string, message: string}[]>([])
  const [currentTab, setCurrentTab] = useState("basic")
  const [chatPreviewMode, setChatPreviewMode] = useState<"collapsed" | "expanded">("collapsed")

  // Helper function to get validation error for a field
  const getFieldError = (fieldName: string) => {
    return validationErrors.find(error => error.field === fieldName || error.field.startsWith(fieldName))?.message
  }

  useEffect(() => {
    if (!isNew && agentId) {
      loadAgent()
    }
  }, [agentId, isNew])

  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [formData])

  const loadAgent = async () => {
    if (!agentId || isNew) return
    
    try {
      setLoading(true)
      const agentData = await AgentService.getAgent(agentId)
      if (!agentData) {
        toast({
          title: "Agent not found",
          description: "The requested agent could not be found.",
          variant: "destructive"
        })
        navigate('/admin')
        return
      }
      setAgent(agentData)
      setFormData({
        name: agentData.name,
        description: agentData.description || '',
        avatar_url: agentData.avatar_url || '',
        welcome_message: agentData.welcome_message,
        cta_buttons: agentData.cta_buttons,
        rotating_messages: agentData.rotating_messages,
        colors: agentData.colors,
        status: agentData.status,
        lead_collection_enabled: agentData.lead_collection_enabled || false,
        lead_form_triggers: agentData.lead_form_triggers || [],
        lead_backup_trigger: agentData.lead_backup_trigger || { enabled: false, message_count: 5 },
        lead_form_fields: agentData.lead_form_fields || [],
        lead_submit_text: agentData.lead_submit_text || 'Submit',
        lead_success_message: agentData.lead_success_message || 'Thank you! We will get back to you soon.',
        ai_model_config: agentData.ai_model_config || { model_name: "gpt-3.5-turbo" },
        openai_api_key: agentData.openai_api_key || '',
        ai_mode: agentData.ai_mode || 'chat_completion',
        openai_assistant_id: agentData.openai_assistant_id || '',
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to load agent:', error)
      toast({
        title: "Error",
        description: "Failed to load agent. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    if (isNew) {
      navigate('/admin')
    } else {
      navigate(`/admin/agent/${agentId}`)
    }
  }

  const handleSave = async () => {
    // Clear previous validation errors
    setValidationErrors([])

    // Validate form data
    const validation = validateAgentData(formData)
    
    if (!validation.success) {
      setValidationErrors(validation.errors)
      toast({
        title: "Validation Error", 
        description: `Please fix the following errors: ${validation.errors.map(e => e.message).join(', ')}`,
        variant: "destructive"
      })
      
      // Find which tab contains the first error and switch to it
      const firstError = validation.errors[0]
      if (firstError.field.includes('name') || firstError.field.includes('description') || 
          firstError.field.includes('avatar') || firstError.field.includes('welcome')) {
        setCurrentTab("basic")
      } else if (firstError.field.includes('prompt') || firstError.field.includes('dynamic') || 
                 firstError.field.includes('rotating')) {
        setCurrentTab("prompts")
      } else if (firstError.field.includes('lead')) {
        setCurrentTab("leadcollection")
      } else if (firstError.field.includes('color')) {
        setCurrentTab("style")
      }
      return
    }

    try {
      setSaving(true)
      
      if (isNew) {
        const newAgent = await AgentService.createAgent(formData)
        toast({
          title: "Success",
          description: "Agent created successfully!",
        })
        navigate(`/admin/agent/${newAgent.id}`)
      } else if (agentId) {
        await AgentService.updateAgent(agentId, formData as UpdateAgentData)
        toast({
          title: "Success", 
          description: "Agent updated successfully!",
        })
        setHasUnsavedChanges(false)
        await loadAgent() // Reload to get updated data
      }
    } catch (error) {
      console.error('Failed to save agent:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save agent. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CreateAgentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleColorChange = (colorKey: keyof typeof formData.colors, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors!,
        [colorKey]: value
      }
    }))
  }


  const addRotatingMessage = () => {
    if (newMessage.trim()) {
      setFormData(prev => ({
        ...prev,
        rotating_messages: [...(prev.rotating_messages || []), newMessage.trim()]
      }))
      setNewMessage('')
    }
  }

  const removeRotatingMessage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rotating_messages: prev.rotating_messages?.filter((_, i) => i !== index) || []
    }))
  }

  const addCtaButton = () => {
    if (newCtaButton.label.trim() && newCtaButton.url.trim()) {
      setFormData(prev => ({
        ...prev,
        cta_buttons: [...(prev.cta_buttons || []), { ...newCtaButton }]
      }))
      setNewCtaButton({ label: '', url: '' })
    }
  }

  const removeCtaButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cta_buttons: prev.cta_buttons?.filter((_, i) => i !== index) || []
    }))
  }

  const addLeadFormTrigger = () => {
    if (newTriggerKeywords.trim()) {
      const keywords = newTriggerKeywords.split(',').map(k => k.trim()).filter(k => k)
      const newTrigger: LeadFormTrigger = {
        id: Date.now().toString(),
        keywords,
        enabled: true
      }
      setFormData(prev => ({
        ...prev,
        lead_form_triggers: [...(prev.lead_form_triggers || []), newTrigger]
      }))
      setNewTriggerKeywords('')
    }
  }

  const removeLeadFormTrigger = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lead_form_triggers: prev.lead_form_triggers?.filter((_, i) => i !== index) || []
    }))
  }

  const addLeadFormField = () => {
    if (newFormField.label.trim()) {
      const systemFields = formData.lead_form_fields?.filter(f => f.system_field) || []
      const customFields = formData.lead_form_fields?.filter(f => !f.system_field) || []
      
      const field: LeadFormField = {
        id: Date.now().toString(),
        type: newFormField.type,
        label: newFormField.label,
        placeholder: newFormField.placeholder,
        required: newFormField.required,
        order: systemFields.length + customFields.length + 1
      }
      
      handleInputChange('lead_form_fields', [...systemFields, ...customFields, field])
      setNewFormField({ type: 'text', label: '', placeholder: '', required: true })
    }
  }

  const removeLeadFormField = (index: number) => {
    const customFields = formData.lead_form_fields?.filter(f => !f.system_field) || []
    const systemFields = formData.lead_form_fields?.filter(f => f.system_field) || []
    const updatedCustomFields = customFields.filter((_, i) => i !== index)
    handleInputChange('lead_form_fields', [...systemFields, ...updatedCustomFields])
  }


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
      }))
      toast({
        title: "Reset Complete",
        description: "All appearance settings have been reset to default values.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    )
  }

  // Create a preview-ready agent object
  const previewAgent = {
    ...formData,
    id: agentId || 'preview',
    user_id: 'preview',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Agent

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isNew ? 'Create New Agent' : `Customize ${formData.name}`}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Configure your AI chatbot's appearance and behavior
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Actions moved to fixed bottom bar */}
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
              <TabsList className="flex flex-wrap justify-start gap-2">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="prompts">Rotating Messages</TabsTrigger>
                <TabsTrigger value="leadcollection">Lead Collection</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="ai">AI Settings</TabsTrigger>
                <TabsTrigger value="personalization">Personalization</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Configure your agent's basic details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Agent Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter agent name"
                        className={getFieldError('name') ? 'border-destructive' : ''}
                        maxLength={100}
                      />
                      <FieldError message={getFieldError('name')} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.name.length}/100 characters
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your agent's purpose" 
                        rows={3}
                        className={getFieldError('description') ? 'border-destructive' : ''}
                        maxLength={500}
                      />
                      <FieldError message={getFieldError('description')} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.description || '').length}/500 characters
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="avatar">Avatar Image</Label>
                      <ImageUpload
                        currentImage={formData.avatar_url}
                        onImageChange={(url) => handleInputChange('avatar_url', url || '')}
                        userId={user?.id || ''}
                        disabled={!user}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="welcome">Welcome Message *</Label>
                      <Textarea
                        id="welcome"
                        value={formData.welcome_message}
                        onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                        placeholder="Enter welcome message"
                        rows={3}
                        className={getFieldError('welcome_message') ? 'border-destructive' : ''}
                        maxLength={500}
                      />
                      <FieldError message={getFieldError('welcome_message')} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.welcome_message || '').length}/500 characters
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) => 
                          handleInputChange('status', checked ? 'active' : 'inactive')
                        }
                      />
                      <Label htmlFor="status">Active</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prompts" className="space-y-6" data-testid="prompts-tab-content">
                <Card>
                  <CardHeader>
                    <CardTitle>Rotating Messages</CardTitle>
                    <CardDescription>
                      Attention-grabbing messages that cycle in the widget when it's minimized
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Add a rotating message"
                        onKeyPress={(e) => e.key === 'Enter' && addRotatingMessage()}
                      />
                      <Button onClick={addRotatingMessage} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.rotating_messages?.map((message, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{message}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRotatingMessage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="leadcollection" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CTA Buttons</CardTitle>
                    <CardDescription>
                      Call-to-action buttons displayed in the chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newCtaButton.label}
                        onChange={(e) => setNewCtaButton(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Button label"
                      />
                      <Input
                        value={newCtaButton.url}
                        onChange={(e) => setNewCtaButton(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="Button URL"
                      />
                    </div>
                    <Button onClick={addCtaButton} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add CTA Button
                    </Button>
                    
                    <div className="space-y-2">
                      {formData.cta_buttons?.map((button, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="text-sm">
                            <div className="font-medium">{button.label}</div>
                            <div className="text-muted-foreground text-xs">{button.url}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCtaButton(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead Collection</CardTitle>
                    <CardDescription>
                      Configure forms to collect leads from users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lead-collection"
                        checked={formData.lead_collection_enabled}
                        onCheckedChange={(checked) => 
                          handleInputChange('lead_collection_enabled', checked)
                        }
                      />
                      <Label htmlFor="lead-collection">Enable Lead Collection</Label>
                    </div>

                     {/* Default Form Fields Section */}
                     {formData.lead_collection_enabled && (
                       <div className="space-y-4 border-t pt-6">
                         <h4 className="font-medium">Default Fields</h4>
                         
                         {/* LinkedIn Profile Field */}
                         <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                           <div className="flex items-center justify-between">
                             <div>
                               <Label className="font-medium">LinkedIn Profile Collection</Label>
                               <p className="text-sm text-muted-foreground">Ask visitors for their LinkedIn profile</p>
                             </div>
                             <Switch
                               checked={formData.lead_form_fields?.some(f => f.system_field === 'linkedin_profile' && f.default_enabled)}
                               onCheckedChange={(checked) => {
                                 const linkedInField = {
                                   id: 'linkedin_profile',
                                   type: 'text' as const,
                                   label: 'LinkedIn Profile',
                                   placeholder: 'LinkedIn Profile URL',
                                   required: true,
                                   order: 0,
                                   system_field: 'linkedin_profile',
                                   default_enabled: checked
                                 }
                                 
                                 const otherFields = formData.lead_form_fields?.filter(f => f.system_field !== 'linkedin_profile') || []
                                 const newFields = checked ? [linkedInField, ...otherFields] : otherFields
                                 handleInputChange('lead_form_fields', newFields)
                               }}
                             />
                           </div>
                           
                           {formData.lead_form_fields?.some(f => f.system_field === 'linkedin_profile' && f.default_enabled) && (
                             <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                               <div className="flex items-center space-x-2">
                                 <Switch
                                   checked={formData.lead_form_fields?.find(f => f.system_field === 'linkedin_profile')?.required}
                                   onCheckedChange={(checked) => {
                                     const updatedFields = formData.lead_form_fields?.map(f => 
                                       f.system_field === 'linkedin_profile' ? { ...f, required: checked } : f
                                     ) || []
                                     handleInputChange('lead_form_fields', updatedFields)
                                   }}
                                 />
                                 <Label className="text-sm">Required field</Label>
                               </div>
                               
                               <div>
                                 <Label className="text-sm">Question Text</Label>
                                 <Input
                                   value={formData.lead_form_fields?.find(f => f.system_field === 'linkedin_profile')?.label || 'LinkedIn Profile'}
                                   onChange={(e) => {
                                     const updatedFields = formData.lead_form_fields?.map(f => 
                                       f.system_field === 'linkedin_profile' ? { ...f, label: e.target.value } : f
                                     ) || []
                                     handleInputChange('lead_form_fields', updatedFields)
                                   }}
                                   placeholder="Do you want me to follow you on LinkedIn?"
                                   className="text-sm"
                                 />
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                     {formData.lead_collection_enabled && (
                      <>
                        <div className="space-y-4">
                          <div>
                            <Label>Keyword Triggers</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Show lead form when users mention these keywords (comma-separated)
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={newTriggerKeywords}
                                onChange={(e) => setNewTriggerKeywords(e.target.value)}
                                placeholder="linkedin, contact, follow"
                              />
                              <Button onClick={addLeadFormTrigger} size="sm" aria-label="Add keyword trigger">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 mt-2">
                              {formData.lead_form_triggers?.map((trigger, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">{trigger.keywords.join(', ')}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLeadFormTrigger(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="backup-trigger"
                                checked={formData.lead_backup_trigger?.enabled}
                                onCheckedChange={(checked) => 
                                  handleInputChange('lead_backup_trigger', {
                                    ...formData.lead_backup_trigger,
                                    enabled: checked
                                  })
                                }
                              />
                              <Label htmlFor="backup-trigger">Backup Trigger</Label>
                            </div>
                            {formData.lead_backup_trigger?.enabled && (
                              <div>
                                <Label>Show form after messages</Label>
                                <Input
                                  type="number"
                                  value={formData.lead_backup_trigger?.message_count}
                                  onChange={(e) => 
                                    handleInputChange('lead_backup_trigger', {
                                      ...formData.lead_backup_trigger,
                                      message_count: parseInt(e.target.value) || 5
                                    })
                                  }
                                  className="w-20"
                                  min="1"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>Custom Form Fields</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              <select
                                value={newFormField.type}
                                onChange={(e) => setNewFormField(prev => ({ ...prev, type: e.target.value as any }))}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="textarea">Textarea</option>
                              </select>
                              <Input
                                value={newFormField.label}
                                onChange={(e) => setNewFormField(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="Label"
                                className="text-sm"
                              />
                              <Input
                                value={newFormField.placeholder}
                                onChange={(e) => setNewFormField(prev => ({ ...prev, placeholder: e.target.value }))}
                                placeholder="Placeholder"
                                className="text-sm"
                              />
                              <Button onClick={addLeadFormField} size="sm" data-testid="add-custom-form-field-button">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 mt-2">
                              {formData.lead_form_fields?.filter(field => !field.system_field).map((field, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">{field.label}</span>
                                    <span className="text-muted-foreground ml-2">({field.type})</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLeadFormField(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Submit Button Text</Label>
                              <Input
                                value={formData.lead_submit_text}
                                onChange={(e) => handleInputChange('lead_submit_text', e.target.value)}
                                placeholder="Submit"
                              />
                            </div>
                            <div>
                              <Label>Success Message</Label>
                              <Input
                                value={formData.lead_success_message}
                                onChange={(e) => handleInputChange('lead_success_message', e.target.value)}
                                placeholder="Thank you! We will get back to you soon."
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="style" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Customization</CardTitle>
                    <CardDescription>
                      Customize your chatbot's appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <p className="text-xs text-muted-foreground mb-2">For buttons, accents, and UI elements</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="primary-color"
                            value={formData.colors?.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="w-12 h-10 rounded border"
                          />
                          <Input
                            value={formData.colors?.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            placeholder="#3B82F6"
                            className={getFieldError('colors.primary') ? 'border-destructive' : ''}
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                        <FieldError message={getFieldError('colors.primary')} />
                      </div>
                      
                      <div>
                        <Label htmlFor="bubble-color">Bubble Color</Label>
                        <p className="text-xs text-muted-foreground mb-2">For background elements</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="bubble-color"
                            value={formData.colors?.bubble}
                            onChange={(e) => handleColorChange('bubble', e.target.value)}
                            className="w-12 h-10 rounded border"
                          />
                          <Input
                            value={formData.colors?.bubble}
                            onChange={(e) => handleColorChange('bubble', e.target.value)}
                            placeholder="#F3F4F6"
                            className={getFieldError('colors.bubble') ? 'border-destructive' : ''}
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                        <FieldError message={getFieldError('colors.bubble')} />
                      </div>
                      
                      <div>
                        <Label htmlFor="text-color">Text Color</Label>
                        <p className="text-xs text-muted-foreground mb-2">For main text content (name, messages, prompts)</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="text-color"
                            value={formData.colors?.text}
                            onChange={(e) => handleColorChange('text', e.target.value)}
                            className="w-12 h-10 rounded border"
                          />
                          <Input
                            value={formData.colors?.text}
                            onChange={(e) => handleColorChange('text', e.target.value)}
                            placeholder="#1F2937"
                            className={getFieldError('colors.text') ? 'border-destructive' : ''}
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                        <FieldError message={getFieldError('colors.text')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <AiSettingsTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </TabsContent>

              <TabsContent value="personalization" className="space-y-6">
                <PersonalizationTab
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
                    <TabsTrigger value="bubble" onClick={() => setChatPreviewMode("collapsed")}>Bubble View</TabsTrigger>
                    <TabsTrigger value="chat" onClick={() => setChatPreviewMode("expanded")}>Chat View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bubble" className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                      <ChatbotUI chatbotData={previewAgent} previewMode="collapsed" isLivePreview={false} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      This is how the chatbot appears when collapsed on your website
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                      <ChatbotUI chatbotData={previewAgent} previewMode="expanded" isLivePreview={true} loadingChatbotData={loading} data-testid="chatbot-preview-expanded" />
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed buttons */}
      <div className="h-20"></div>
    </div>
  )
}

export default AgentCustomize