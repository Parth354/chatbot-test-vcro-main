import { z } from 'zod'

// Validation schema for agent forms
export const agentValidationSchema = z.object({
  name: z.string()
    .min(1, "Agent name is required")
    .max(100, "Name must be under 100 characters"),
  
  description: z.string()
    .max(500, "Description must be under 500 characters")
    .optional(),
  
  avatar_url: z.string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
  
  linkedin_url: z.string()
    .url("Invalid LinkedIn URL format")
    .optional()
    .or(z.literal("")),
  
  welcome_message: z.string()
    .min(1, "Welcome message is required")
    .max(500, "Welcome message must be under 500 characters"),
  
  colors: z.object({
    primary: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)"),
    bubble: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)"),
    text: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)")
  }),
  
  suggested_prompts: z.array(z.string())
    .optional(),
  
  rotating_messages: z.array(z.string())
    .optional(),
  
  
  cta_buttons: z.array(z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().url("Invalid URL format")
  })).optional(),
  
  lead_form_fields: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox']),
    label: z.string().min(1, "Label is required"),
    placeholder: z.string().optional(),
    required: z.boolean(),
    order: z.number(),
    system_field: z.string().optional(),
    default_enabled: z.boolean().optional(),
    options: z.array(z.string()).optional()
  })).optional(),
  
  status: z.enum(['active', 'inactive']).optional(),
  lead_collection_enabled: z.boolean().optional(),
  lead_form_triggers: z.array(z.any()).optional(),
  lead_backup_trigger: z.any().optional(),
  lead_submit_text: z.string().optional(),
  lead_success_message: z.string().optional(),
  ai_model_config: z.any().optional(), // Basic validation, can be refined
})

export type AgentValidationData = z.infer<typeof agentValidationSchema>

// Function to validate agent data
export const validateAgentData = (data: any) => {
  const result = agentValidationSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
    };
  } else {
    const errors = result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return {
      success: false,
      data: null,
      errors: errors,
    };
  }
};

