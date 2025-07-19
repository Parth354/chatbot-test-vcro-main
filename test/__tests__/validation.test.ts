import { describe, it, expect } from 'vitest'
import { validateAgentDataForTests as validateAgentData } from '@/schemas/agentValidation'

const mockValidAgentData = {
  name: 'Test Agent',
  description: 'A test agent for validation.',
  avatar_url: 'https://example.com/default-avatar.jpg',
  linkedin_url: 'https://linkedin.com/in/testagent',
  welcome_message: 'Hello from Test Agent!',
  colors: {
    primary: '#123456',
    bubble: '#7890AB',
    text: '#CDEF01',
  },
  suggested_prompts: ['Prompt 1', 'Prompt 2'],
  rotating_messages: ['Message 1', 'Message 2'],
  cta_buttons: [{ label: 'Test CTA', url: 'https://test.com' }],
  lead_form_fields: [],
  status: 'active',
  lead_collection_enabled: false,
  lead_form_triggers: [],
  lead_backup_trigger: { enabled: false, message_count: 5 },
  lead_submit_text: 'Submit',
  lead_success_message: 'Thank you!',
  linkedin_prompt_message_count: 0,
  make_webhook_url: 'https://make.com/webhook'
}

describe('Agent Validation Tests', () => {
  // Test Case 4: Max Image Size Validation
  describe('Image Validation', () => {
    it('should validate avatar URL format', () => {
      const validData = {
        ...mockValidAgentData,
        avatar_url: 'https://example.com/avatar.jpg'
      }

      const result = validateAgentData(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL format', () => {
      const invalidData = {
        ...mockValidAgentData,
        avatar_url: 'not-a-valid-url'
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Avatar URL must be a valid URL')
    })
  })

  // Test Case 34: Color Input Validation
  describe('Color Validation', () => {
    it('should validate hex colors', () => {
      const validData = {
        ...mockValidAgentData,
        colors: {
          primary: '#3B82F6',
          bubble: '#F3F4F6',
          text: '#1F2937'
        }
      }

      const result = validateAgentData(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid hex colors', () => {
      const invalidData = {
        ...mockValidAgentData,
        colors: {
          primary: 'invalid-color',
          bubble: '#F3F4F6',
          text: '#1F2937'
        }
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Primary color must be a valid hex color')
    })
  })

  // Character Limit Validation Tests (Missing Test Coverage)
  describe('Character Limits', () => {
    it('should enforce 500 character limit on description', () => {
      const longDescription = 'a'.repeat(501)
      const invalidData = {
        ...mockValidAgentData,
        description: longDescription
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Description must be 500 characters or less')
    })

    it('should enforce 500 character limit on welcome message', () => {
      const longWelcomeMessage = 'a'.repeat(501)
      const invalidData = {
        ...mockValidAgentData,
        welcome_message: longWelcomeMessage
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Welcome message must be 500 characters or less')
    })
  })

  // URL Validation Tests (Missing Test Coverage)
  describe('CTA Button URL Validation', () => {
    it('should validate CTA button URLs', () => {
      const validData = {
        ...mockValidAgentData,
        cta_buttons: [{
          label: 'Contact Us',
          url: 'https://example.com/contact'
        }]
      }

      const result = validateAgentData(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid CTA button URLs', () => {
      const invalidData = {
        ...mockValidAgentData,
        cta_buttons: [{
          label: 'Contact Us',
          url: 'not-a-valid-url'
        }]
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('CTA button URL must be valid')
    })
  })

  // Required Fields Validation
  describe('Required Fields', () => {
    it('should require agent name', () => {
      const invalidData = {
        ...mockValidAgentData,
        name: '' // Empty name to trigger required error
      }

      const result = validateAgentData(invalidData)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Agent name is required')
    })

    it('should allow optional fields to be empty', () => {
      const validData = {
        ...mockValidAgentData,
        description: '',
        avatar_url: '',
        linkedin_url: '',
        suggested_prompts: [],
        rotating_messages: [],
        cta_buttons: [],
        lead_form_fields: [],
        lead_form_triggers: [],
        lead_backup_trigger: { enabled: false, message_count: 5 },
        lead_submit_text: '',
        lead_success_message: '',
        make_webhook_url: ''
      }

      const result = validateAgentData(validData)
      expect(result.success).toBe(true)
    })
  })

  // Array Validation
  describe('Array Fields', () => {
    it('should handle empty arrays gracefully', () => {
      const validData = {
        ...mockValidAgentData,
        suggested_prompts: [],
        rotating_messages: [],
        cta_buttons: [],
        lead_form_triggers: [],
        lead_form_fields: []
      }

      const result = validateAgentData(validData)
      expect(result.success).toBe(true)
    })
  })
})