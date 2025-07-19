import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentService } from '@/services/agentService'
import { supabase } from '@/integrations/supabase/client'
import type { CreateAgentData, UpdateAgentData } from '@/types/agent'

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CRUD Operations', () => {
    it('should create agent with valid data', async () => {
      const mockUser = { 
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z'
      }
      const mockAgent = {
        id: 'agent-123',
        user_id: 'user-123',
        name: 'Test Agent',
        description: 'Test Description',
        status: 'active'
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any)

      const agentData: CreateAgentData = {
        name: 'Test Agent',
        description: 'Test Description'
      }

      const result = await AgentService.createAgent(agentData)
      expect(result.name).toBe('Test Agent')
    })

    it('should get agent by id', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: JSON.stringify({ primary: '#3B82F6' })
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any)

      const result = await AgentService.getAgent('agent-123')
      expect(result?.name).toBe('Test Agent')
    })

    it('should update agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Updated Agent'
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAgent,
                error: null
              })
            })
          })
        })
      } as any)

      const updateData: UpdateAgentData = {
        name: 'Updated Agent'
      }

      const result = await AgentService.updateAgent('agent-123', updateData)
      expect(result.name).toBe('Updated Agent')
    })

    it('should delete agent', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any)

      await expect(AgentService.deleteAgent('agent-123')).resolves.not.toThrow()
    })
  })

  describe('Data Parsing', () => {
    it('should parse JSON strings correctly', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: '{"primary": "#3B82F6", "bubble": "#F3F4F6"}',
        cta_buttons: '[{"label": "Test", "url": "https://test.com"}]'
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any)

      const result = await AgentService.getAgent('agent-123')
      expect(result?.colors).toEqual({ primary: "#3B82F6", bubble: "#F3F4F6" })
      expect(result?.cta_buttons).toEqual([{ label: "Test", url: "https://test.com" }])
    })
  })

  describe('Error Handling', () => {
    it('should handle agent not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          })
        })
      } as any)

      const result = await AgentService.getAgent('nonexistent')
      expect(result).toBeNull()
    })

    it('should throw error for database failures', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      } as any)

      await expect(AgentService.getAgent('agent-123')).rejects.toThrow('Failed to fetch agent: Database error')
    })
  })
})