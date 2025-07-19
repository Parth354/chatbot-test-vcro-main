import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentService } from '@/services/agentService'
import { validateAgentData } from '@/schemas/agentValidation'
import type { CreateAgentData } from '@/types/agent'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', async () => {
  const actual = await vi.importActual('@/integrations/supabase/client')
  return {
    ...actual,
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  }
})

describe('Integration Tests - End-to-End Agent Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Agent Lifecycle', () => {
    it('should create, update, retrieve, and delete agent successfully', async () => {
      // Mock the complete lifecycle
      const createData: CreateAgentData = {
        name: 'Integration Test Agent',
        description: 'Test agent for integration testing',
        welcome_message: 'Hello from integration test!',
        colors: {
          primary: '#3B82F6',
          bubble: '#F3F4F6',
          text: '#1F2937'
        },
        
        rotating_messages: ['Welcome!', 'How can we assist you?'],
        cta_buttons: [{
          label: 'Contact Us',
          url: 'https://example.com/contact'
        }],
        lead_collection_enabled: true,
        lead_form_fields: [{
          id: 'email-field',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true,
          order: 0
        }]
      }

      // 1. Validate data before creation
      const validation = validateAgentData(createData)
      expect(validation.success).toBe(true)

      // 2. Mock successful creation
      const mockCreatedAgent = {
        id: 'agent-123',
        user_id: 'user-123',
        ...createData,
        status: 'active',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00.000Z'
          } 
        },
        error: null
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedAgent,
              error: null
            })
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedAgent,
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockCreatedAgent, name: 'Updated Agent Name' },
                error: null
              })
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any)

      // 3. Create agent
      const createdAgent = await AgentService.createAgent(createData)
      expect(createdAgent.id).toBe('agent-123')
      expect(createdAgent.name).toBe('Integration Test Agent')

      // 4. Retrieve agent
      const retrievedAgent = await AgentService.getAgent('agent-123')
      expect(retrievedAgent?.id).toBe('agent-123')
      expect(retrievedAgent?.name).toBe('Integration Test Agent')

      // 5. Update agent
      const updateData = { name: 'Updated Agent Name' }
      const updatedAgent = await AgentService.updateAgent('agent-123', updateData)
      expect(updatedAgent.name).toBe('Updated Agent Name')

      // 6. Delete agent
      await expect(AgentService.deleteAgent('agent-123')).resolves.not.toThrow()
    })
  })

  describe('Data Transformation and Parsing', () => {
    it('should handle JSON serialization and deserialization correctly', async () => {
      const complexData = {
        colors: { primary: '#FF0000', bubble: '#00FF00', text: '#0000FF' },
        cta_buttons: [
          { label: 'Buy Now', url: 'https://buy.example.com' },
          { label: 'Learn More', url: 'https://learn.example.com' }
        ],
        lead_form_fields: [
          { id: 'name', type: 'text' as const, label: 'Name', required: true, order: 0 },
          { id: 'email', type: 'email' as const, label: 'Email', required: true, order: 1 }
        ]
      }

      // Simulate database storage (JSON serialization)
      const serializedData = {
        colors: JSON.stringify(complexData.colors),
        cta_buttons: JSON.stringify(complexData.cta_buttons),
        lead_form_fields: JSON.stringify(complexData.lead_form_fields)
      }

      // Mock agent with serialized JSON data
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        ...serializedData
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

      // Retrieve and verify parsing
      const agent = await AgentService.getAgent('agent-123')
      
      expect(agent?.colors).toEqual(complexData.colors)
      expect(agent?.cta_buttons).toEqual(complexData.cta_buttons)
      expect(agent?.lead_form_fields).toEqual(complexData.lead_form_fields)
    })
  })

  describe('Validation Integration', () => {
    it('should integrate validation with service operations', async () => {
      const invalidData = {
        name: '', // Required field missing
        description: 'a'.repeat(501), // Too long
        colors: {
          primary: 'invalid-color', // Invalid hex
          bubble: '#F3F4F6',
          text: '#1F2937'
        },
        cta_buttons: [{
          label: 'Test',
          url: 'not-a-url' // Invalid URL
        }]
      }

      // Validate before service call
      const validation = validateAgentData(invalidData)
      expect(validation.success).toBe(false)
      expect(validation.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: 'Agent name is required' }),
        expect.objectContaining({ message: 'Description must be under 500 characters' }),
        expect.objectContaining({ message: 'Invalid color format (use #RRGGBB)' }),
        expect.objectContaining({ message: 'Invalid URL format' })
      ]))

      // Service should not be called with invalid data
      // In real implementation, this would be handled by the UI validation layer
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully across all operations', async () => {
      const dbError = { code: 'DB_CONNECTION_ERROR', message: 'Database connection failed' }

      // Mock database errors for all operations
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: dbError })
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: dbError })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: dbError })
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: dbError })
        })
      } as any)

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { 
          user: { 
            id: 'user-123',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00.000Z'
          } 
        },
        error: null
      } as any)

      const agentData = { name: 'Test Agent' }

      // All operations should throw meaningful errors
      await expect(AgentService.createAgent(agentData)).rejects.toThrow('Failed to create agent: Database connection failed')
      await expect(AgentService.getAgent('agent-123')).rejects.toThrow('Failed to fetch agent: Database connection failed')
      await expect(AgentService.updateAgent('agent-123', agentData)).rejects.toThrow('Failed to update agent: Database connection failed')
      await expect(AgentService.deleteAgent('agent-123')).rejects.toThrow('Failed to delete agent: Database connection failed')
    })
  })
})