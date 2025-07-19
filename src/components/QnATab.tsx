import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit } from "lucide-react";
import { PromptResponseService, type PromptResponse } from "@/services/promptResponseService";
import { useToast } from "@/hooks/use-toast";

interface QnATabProps {
  agentId: string;
}

export function QnATab({ agentId }: QnATabProps) {
  const [promptResponses, setPromptResponses] = useState<PromptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptResponse | null>(null);
  const [formData, setFormData] = useState({
    prompt: "",
    response: "",
    is_dynamic: false,
    keywords: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    loadPromptResponses();
  }, [agentId]);

  const loadPromptResponses = async () => {
    try {
      setLoading(true);
      const data = await PromptResponseService.getPromptResponses(agentId);
      setPromptResponses(data);
    } catch (error) {
      console.error('Error loading prompt responses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load Q&A pairs"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt.trim() || !formData.response.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Both prompt and response are required"
      });
      return;
    }

    try {
      const promptData = {
        agent_id: agentId,
        prompt: formData.prompt.trim(),
        response: formData.response.trim(),
        is_dynamic: formData.is_dynamic,
        keywords: formData.is_dynamic ? formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : undefined
      };

      if (editingPrompt) {
        await PromptResponseService.updatePromptResponse(editingPrompt.id, promptData);
        toast({
          title: "Success",
          description: "Q&A pair updated successfully"
        });
      } else {
        await PromptResponseService.createPromptResponse(promptData);
        toast({
          title: "Success",
          description: "Q&A pair created successfully"
        });
      }

      await loadPromptResponses();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving prompt response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save Q&A pair"
      });
    }
  };

  const handleEdit = (prompt: PromptResponse) => {
    setEditingPrompt(prompt);
    setFormData({
      prompt: prompt.prompt,
      response: prompt.response,
      is_dynamic: prompt.is_dynamic,
      keywords: prompt.keywords?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await PromptResponseService.deletePromptResponse(id);
      await loadPromptResponses();
      toast({
        title: "Success",
        description: "Q&A pair deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting prompt response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete Q&A pair"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      prompt: "",
      response: "",
      is_dynamic: false,
      keywords: ""
    });
    setEditingPrompt(null);
  };

  const suggestedPrompts = promptResponses.filter(p => !p.is_dynamic);
  const dynamicPrompts = promptResponses.filter(p => p.is_dynamic);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading Q&A pairs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Q&A Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage suggested prompts and dynamic responses for your chatbot
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Q&A Pair
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? 'Edit Q&A Pair' : 'Add New Q&A Pair'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Input
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter the user prompt or question"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">Response</Label>
                <Textarea
                  id="response"
                  value={formData.response}
                  onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
                  placeholder="Enter the bot's response"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_dynamic"
                  checked={formData.is_dynamic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_dynamic: checked }))}
                />
                <Label htmlFor="is_dynamic">Dynamic prompt (keyword-based matching)</Label>
              </div>

              {formData.is_dynamic && (
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="pricing, cost, how much, payment"
                  />
                  <p className="text-xs text-muted-foreground">
                    The response will trigger when user message contains any of these keywords
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPrompt ? 'Update' : 'Create'} Q&A Pair
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="suggested" className="w-full">
        <TabsList>
          <TabsTrigger value="suggested">
            Suggested Prompts ({suggestedPrompts.length})
          </TabsTrigger>
          <TabsTrigger value="dynamic">
            Dynamic Prompts ({dynamicPrompts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Suggested prompts appear as clickable buttons in the chat interface
          </div>
          
          {suggestedPrompts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No suggested prompts yet. Create your first Q&A pair above.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {suggestedPrompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{prompt.prompt}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(prompt)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(prompt.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{prompt.response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Dynamic prompts trigger automatically when users type matching keywords
          </div>
          
          {dynamicPrompts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No dynamic prompts yet. Create keyword-based responses above.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dynamicPrompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{prompt.prompt}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prompt.keywords?.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(prompt)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(prompt.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{prompt.response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}