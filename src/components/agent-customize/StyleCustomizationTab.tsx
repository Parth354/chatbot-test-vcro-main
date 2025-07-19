import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import type { CreateAgentData } from "@/types/agent";

interface StyleCustomizationTabProps {
  formData: CreateAgentData;
  handleColorChange: (colorKey: keyof typeof formData.colors, value: string) => void;
  getFieldError: (fieldName: string) => string | undefined;
}

export const StyleCustomizationTab: React.FC<StyleCustomizationTabProps> = ({
  formData,
  handleColorChange,
  getFieldError,
}) => {
  return (
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
  );
};