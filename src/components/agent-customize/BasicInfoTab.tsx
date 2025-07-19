import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { FieldError } from "@/components/ui/field-error";
import type { CreateAgentData } from "@/types/agent";

interface BasicInfoTabProps {
  formData: CreateAgentData;
  handleInputChange: (field: keyof CreateAgentData, value: any) => void;
  getFieldError: (fieldName: string) => string | undefined;
  userId: string;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  handleInputChange,
  getFieldError,
  userId,
}) => {
  return (
    <>
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
              userId={userId}
              disabled={!userId}
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
      
    </>
  );
};
