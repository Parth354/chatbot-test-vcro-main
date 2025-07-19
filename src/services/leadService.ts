import { supabase } from "@/integrations/supabase/client";
import { LeadSubmission } from "@/types/agent";

export class LeadService {
  static async submitLead(agentId: string, sessionId: string | null, formData: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('lead_submissions')
      .insert({
        agent_id: agentId,
        session_id: sessionId,
        form_data: formData,
      });

    if (error) {
      throw new Error(`Failed to submit lead: ${error.message}`);
    }
  }

  static async getLeadSubmissions(agentId: string): Promise<LeadSubmission[]> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('*')
      .eq('agent_id', agentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch lead submissions: ${error.message}`);
    }

    return (data || []) as LeadSubmission[];
  }

  static async getLeadSubmissionById(id: string): Promise<LeadSubmission | null> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lead submission: ${error.message}`);
    }

    return data as LeadSubmission | null;
  }
}