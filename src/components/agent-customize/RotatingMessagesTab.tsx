import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { CreateAgentData } from "@/types/agent";

interface RotatingMessagesTabProps {
  formData: CreateAgentData;
  handleInputChange: (field: keyof CreateAgentData, value: any) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
}

export const RotatingMessagesTab: React.FC<RotatingMessagesTabProps> = ({
  formData,
  handleInputChange,
  newMessage,
  setNewMessage,
}) => {
  const addRotatingMessage = () => {
    if (newMessage.trim()) {
      handleInputChange('rotating_messages', [...(formData.rotating_messages || []), newMessage.trim()]);
      setNewMessage('');
    }
  };

  const removeRotatingMessage = (index: number) => {
    handleInputChange('rotating_messages', formData.rotating_messages?.filter((_, i) => i !== index) || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rotating Messages</CardTitle>
        <CardDescription>
          Attention-grabbing messages that cycle in the widget when it's minimized
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add a rotating message"
            onKeyPress={(e) => e.key === 'Enter' && addRotatingMessage()}
          />
          <Button onClick={addRotatingMessage} size="sm" aria-label="Add rotating message">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {formData.rotating_messages?.map((message, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm">{message}</span>
              <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRotatingMessage(index)}
                            aria-label="Remove rotating message"
                          >
                            <X className="h-4 w-4" />
                          </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
