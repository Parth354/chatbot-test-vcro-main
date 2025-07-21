import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from '@/services/leadService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        then: vi.fn(),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn(),
          })),
          maybeSingle: vi.fn(),
        })),
        order: vi.fn(),
      })),
    })),
  },
}));

describe('LeadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitLead', () => {
    it('should submit lead data successfully', async () => {
      const mockAgentId = 'agent-123';
      const mockSessionId = 'session-456';
      const mockFormData = { name: 'John Doe', email: 'john@example.com' };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      } as any);

      await LeadService.submitLead(mockAgentId, mockSessionId, mockFormData);

      expect(supabase.from).toHaveBeenCalledWith('lead_submissions');
      expect(supabase.from('lead_submissions').insert).toHaveBeenCalledWith({
        agent_id: mockAgentId,
        session_id: mockSessionId,
        form_data: mockFormData,
      });
    });

    it('should handle error when submitting lead data fails', async () => {
      const mockError = new Error('Submission failed');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(LeadService.submitLead('agent-123', 'session-456', {})).rejects.toThrow('Submission failed');
    });
  });

  describe('getLeadSubmissions', () => {
    it('should fetch lead submissions for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockSubmissions = [
        { id: 'l1', agent_id: mockAgentId, form_data: { name: 'Jane' }, submitted_at: new Date().toISOString() },
        { id: 'l2', agent_id: mockAgentId, form_data: { name: 'Doe' }, submitted_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockSubmissions, error: null }),
        }),
      } as any);

      const result = await LeadService.getLeadSubmissions(mockAgentId);

      expect(result).toEqual(mockSubmissions);
      expect(supabase.from).toHaveBeenCalledWith('lead_submissions');
      expect(supabase.from('lead_submissions').select().eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(supabase.from('lead_submissions').select().eq().order).toHaveBeenCalledWith('submitted_at', { ascending: false });
    });

    it('should return empty array if no submissions found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any);

      const result = await LeadService.getLeadSubmissions('agent-123');
      expect(result).toEqual([]);
    });

    it('should handle error when fetching lead submissions fails', async () => {
      const mockError = new Error('Fetch failed');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(LeadService.getLeadSubmissions('agent-123')).rejects.toThrow('Fetch failed');
    });
  });

  describe('getLeadSubmissionById', () => {
    it('should fetch a single lead submission by ID', async () => {
      const mockId = 'lead-789';
      const mockSubmission = { id: mockId, agent_id: 'agent-123', form_data: { name: 'Test' }, submitted_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockSubmission, error: null }),
        }),
      } as any);

      const result = await LeadService.getLeadSubmissionById(mockId);

      expect(result).toEqual(mockSubmission);
      expect(supabase.from).toHaveBeenCalledWith('lead_submissions');
      expect(supabase.from('lead_submissions').select().eq).toHaveBeenCalledWith('id', mockId);
      expect(supabase.from('lead_submissions').select().eq().maybeSingle).toHaveBeenCalled();
    });

    it('should return null if lead submission not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      const result = await LeadService.getLeadSubmissionById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle error when fetching lead submission by ID fails', async () => {
      const mockError = new Error('Fetch by ID failed');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(LeadService.getLeadSubmissionById('lead-789')).rejects.toThrow('Fetch by ID failed');
    });
  });
});
