import { describe, it, expect } from 'vitest';
import { validateAgentData, validateAgentDataForTests } from '@/schemas/agentValidation';

describe('agentValidation', () => {
  const baseAgentData = {
    name: 'Test Agent',
    description: 'A test description',
    avatar_url: '',
    welcome_message: 'Hello!',
    colors: {
      primary: '#FFFFFF',
      bubble: '#000000',
      text: '#CCCCCC',
    },
    cta_buttons: [],
    rotating_messages: [],
    lead_form_fields: [],
    status: 'active',
    lead_collection_enabled: false,
    lead_form_triggers: [],
    lead_backup_trigger: { enabled: false, message_count: 5 },
    lead_submit_text: 'Submit',
    lead_success_message: 'Thank you!',
    linkedin_url: '',
    linkedin_prompt_message_count: 0,
    ai_model_config: { model_name: 'gpt-3.5-turbo' },
    openai_api_key: '',
    ai_mode: 'chat_completion',
    openai_assistant_id: '',
  };

  describe('validateAgentData', () => {
    it('should return success for valid agent data', () => {
      const result = validateAgentData(baseAgentData);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing name', () => {
      const data = { ...baseAgentData, name: '' };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'name', message: 'Agent name is required' },
      ]);
    });

    it('should return error for name exceeding max length', () => {
      const data = { ...baseAgentData, name: 'a'.repeat(101) };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'name', message: 'Name must be under 100 characters' },
      ]);
    });

    it('should return error for description exceeding max length', () => {
      const data = { ...baseAgentData, description: 'a'.repeat(501) };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'description', message: 'Description must be under 500 characters' },
      ]);
    });

    it('should return error for invalid avatar_url', () => {
      const data = { ...baseAgentData, avatar_url: 'invalid-url' };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'avatar_url', message: 'Invalid URL format' },
      ]);
    });

    it('should return error for missing welcome_message', () => {
      const data = { ...baseAgentData, welcome_message: '' };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'welcome_message', message: 'Welcome message is required' },
      ]);
    });

    it('should return error for welcome_message exceeding max length', () => {
      const data = { ...baseAgentData, welcome_message: 'a'.repeat(501) };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'welcome_message', message: 'Welcome message must be under 500 characters' },
      ]);
    });

    it('should return error for invalid color format', () => {
      const data = { ...baseAgentData, colors: { ...baseAgentData.colors, primary: '#GGGGGG' } };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'colors.primary', message: 'Invalid color format (use #RRGGBB)' },
      ]);
    });

    it('should return error for invalid cta_button url', () => {
      const data = { ...baseAgentData, cta_buttons: [{ label: 'Test', url: 'invalid-url' }] };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'cta_buttons.0.url', message: 'Invalid URL format' },
      ]);
    });

    it('should return error for invalid linkedin_url', () => {
      const data = { ...baseAgentData, linkedin_url: 'invalid-linkedin-url' };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        { field: 'linkedin_url', message: 'Invalid LinkedIn URL format' },
      ]);
    });

    it('should return multiple errors', () => {
      const data = { ...baseAgentData, name: '', welcome_message: 'a'.repeat(501), colors: { ...baseAgentData.colors, text: '#ZZZ' } };
      const result = validateAgentData(data);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toEqual(expect.arrayContaining([
        { field: 'name', message: 'Agent name is required' },
        { field: 'welcome_message', message: 'Welcome message must be under 500 characters' },
        { field: 'colors.text', message: 'Invalid color format (use #RRGGBB)' },
      ]));
    });
  });

  describe('validateAgentDataForTests', () => {
    it('should return success for valid agent data', () => {
      const result = validateAgentDataForTests(baseAgentData);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return simplified error messages for invalid data', () => {
      const data = { ...baseAgentData, name: '', description: 'a'.repeat(501), avatar_url: 'bad-url', colors: { ...baseAgentData.colors, primary: '#ABC' } };
      const result = validateAgentDataForTests(data);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toEqual(expect.arrayContaining([
        'Agent name is required',
        'Description must be 500 characters or less',
        'Avatar URL must be a valid URL',
        'Primary color must be a valid hex color',
      ]));
    });
  });
});
