import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateAgentData } from "@/types/agent";

interface PersonalizationTabProps {
  formData: CreateAgentData;
  handleInputChange: (field: keyof CreateAgentData, value: any) => void;
}

export const PersonalizationTab: React.FC<PersonalizationTabProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalization</CardTitle>
        <CardDescription>
          Personalize the chatbot experience using a LinkedIn profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
          <Input
            id="linkedin_url"
            value={formData.linkedin_url || ''}
            onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
          />
        </div>
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
      </CardContent>
    </Card>
  );
};