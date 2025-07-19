import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadCollectionTab } from '@/components/agent-customize/LeadCollectionTab';

describe('LeadCollectionTab', () => {
  const mockFormData = {
    cta_buttons: [{ label: 'CTA 1', url: 'url1' }],
    lead_collection_enabled: false,
    lead_form_fields: [],
    lead_form_triggers: [],
    lead_backup_trigger: { enabled: false, message_count: 5 },
    lead_submit_text: 'Submit',
    lead_success_message: 'Success!',
    linkedin_prompt_message_count: 0,
  };

  const mockHandleInputChange = vi.fn();
  const mockSetNewCtaButton = vi.fn();
  const mockSetNewTriggerKeywords = vi.fn();
  const mockSetNewFormField = vi.fn();
  const mockAddCtaButton = vi.fn();
  const mockRemoveCtaButton = vi.fn();
  const mockAddLeadFormTrigger = vi.fn();
  const mockRemoveLeadFormTrigger = vi.fn();
  const mockAddLeadFormField = vi.fn();
  const mockRemoveLeadFormField = vi.fn();

  const defaultProps = {
    formData: mockFormData as any,
    handleInputChange: mockHandleInputChange,
    newCtaButton: { label: '', url: '' },
    setNewCtaButton: mockSetNewCtaButton,
    newTriggerKeywords: '',
    setNewTriggerKeywords: mockSetNewTriggerKeywords,
    newFormField: { type: 'text', label: '', placeholder: '', required: true } as any,
    setNewFormField: mockSetNewFormField,
    addCtaButton: mockAddCtaButton,
    removeCtaButton: mockRemoveCtaButton,
    addLeadFormTrigger: mockAddLeadFormTrigger,
    removeLeadFormTrigger: mockRemoveLeadFormTrigger,
    addLeadFormField: mockAddLeadFormField,
    removeLeadFormField: mockRemoveLeadFormField,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CTA buttons section', () => {
    render(<LeadCollectionTab {...defaultProps} />);
    expect(screen.getByText('CTA Buttons')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Button label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Button URL')).toBeInTheDocument();
    expect(screen.getByText('CTA 1')).toBeInTheDocument();
  });

  it('calls addCtaButton when Add CTA Button is clicked', async () => {
    const user = userEvent.setup();
    render(<LeadCollectionTab {...defaultProps} newCtaButton={{ label: 'New CTA', url: 'newurl' }} />);
    await user.click(screen.getByRole('button', { name: /Add CTA Button/i }));
    expect(mockAddCtaButton).toHaveBeenCalled();
  });

  it('calls removeCtaButton when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<LeadCollectionTab {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Remove CTA button/i }));
    expect(mockRemoveCtaButton).toHaveBeenCalledWith(0);
  });

  it('renders Lead Collection section', () => {
    render(<LeadCollectionTab {...defaultProps} />);
    expect(screen.getByText('Lead Collection')).toBeInTheDocument();
    expect(screen.getByLabelText(/Enable Lead Collection/i)).toBeInTheDocument();
  });

  it('shows lead collection options when enabled', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true }}
      />
    );
    expect(screen.getByText(/Keyword Triggers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/LinkedIn Prompt Message Count/i)).toBeInTheDocument();
  });

  it('calls addLeadFormTrigger when add button is clicked for keyword triggers', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true }}
        newTriggerKeywords="test"
      />
    );
    await user.click(screen.getByRole('button', { name: /Add keyword trigger/i }));
    expect(mockAddLeadFormTrigger).toHaveBeenCalled();
  });

  it('calls removeLeadFormTrigger when remove button is clicked for keyword triggers', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true, lead_form_triggers: [{ id: '1', keywords: ['test'], enabled: true }] }}
      />
    );
    await user.click(screen.getByRole('button', { name: /Remove keyword trigger/i }));
    expect(mockRemoveLeadFormTrigger).toHaveBeenCalledWith(0);
  });

  it('calls addLeadFormField when add button is clicked for custom form fields', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true }}
        newFormField={{ type: 'text', label: 'Custom Field', placeholder: '', required: true } as any}
      />
    );
    await user.click(screen.getByRole('button', { name: /Add custom form field/i }));
    expect(mockAddLeadFormField).toHaveBeenCalled();
  });

  it('calls removeLeadFormField when remove button is clicked for custom form fields', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true, lead_form_fields: [{ id: '1', type: 'text', label: 'Custom Field', placeholder: '', required: true }] }}
      />
    );
    await user.click(screen.getByRole('button', { name: /Remove custom form field/i }));
    expect(mockRemoveLeadFormField).toHaveBeenCalledWith(0);
  });

  it('updates linkedin_prompt_message_count', async () => {
    const user = userEvent.setup();
    render(
      <LeadCollectionTab
        {...defaultProps}
        formData={{ ...mockFormData, lead_collection_enabled: true }}
      />
    );
    const input = screen.getByLabelText(/LinkedIn Prompt Message Count/i);
    fireEvent.change(input, { target: { value: '10' } });
    expect(mockHandleInputChange).toHaveBeenCalledWith('linkedin_prompt_message_count', 10);
  });
});
