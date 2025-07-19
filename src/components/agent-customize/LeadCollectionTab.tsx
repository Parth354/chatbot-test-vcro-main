import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import type { CreateAgentData, CTAButton, LeadFormTrigger, LeadFormField } from "@/types/agent";

interface LeadCollectionTabProps {
  formData: CreateAgentData;
  handleInputChange: (field: keyof CreateAgentData, value: any) => void;
  newCtaButton: CTAButton;
  setNewCtaButton: React.Dispatch<React.SetStateAction<CTAButton>>;
  newTriggerKeywords: string;
  setNewTriggerKeywords: React.Dispatch<React.SetStateAction<string>>;
  newFormField: LeadFormField;
  setNewFormField: React.Dispatch<React.SetStateAction<LeadFormField>>;
  addCtaButton: () => void;
  removeCtaButton: (index: number) => void;
  addLeadFormTrigger: () => void;
  removeLeadFormTrigger: (index: number) => void;
  addLeadFormField: () => void;
  removeLeadFormField: (index: number) => void;
}

export const LeadCollectionTab: React.FC<LeadCollectionTabProps> = ({
  formData,
  handleInputChange,
  newCtaButton,
  setNewCtaButton,
  newTriggerKeywords,
  setNewTriggerKeywords,
  newFormField,
  setNewFormField,
  addCtaButton,
  removeCtaButton,
  addLeadFormTrigger,
  removeLeadFormTrigger,
  addLeadFormField,
  removeLeadFormField,
}) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>CTA Buttons</CardTitle>
          <CardDescription>
            Call-to-action buttons displayed in the chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  aria-label="Remove CTA button"
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
                  <Label htmlFor="linkedin_prompt_message_count">LinkedIn Prompt Message Count</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Number of messages after which to prompt for LinkedIn URL (0 to disable)
                  </p>
                  <Input
                    id="linkedin_prompt_message_count"
                    type="number"
                    value={formData.linkedin_prompt_message_count || 0}
                    onChange={(e) => handleInputChange('linkedin_prompt_message_count', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-24"
                  />
                </div>
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
                                className="flex-1"
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
                          aria-label="Remove keyword trigger"
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
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
                    <Button onClick={addLeadFormField} size="sm" aria-label="Add custom form field">
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
                          aria-label="Remove custom form field"
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
    </>
  );
};
