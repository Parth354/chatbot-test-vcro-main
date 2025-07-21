import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LeadCollectionForm from '@/components/LeadCollectionForm';
import { LeadFormField } from '@/types/agent';

describe('LeadCollectionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultSubmitText = 'Submit';

  it('should render text input field', () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('should render email input field', () => {
    const fields: LeadFormField[] = [
      { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('should render phone input field', () => {
    const fields: LeadFormField[] = [
      { id: 'phone', type: 'phone', label: 'Phone', placeholder: 'Enter your phone', required: false, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone')).toBeInTheDocument();
  });

  it('should render textarea field', () => {
    const fields: LeadFormField[] = [
      { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Your message', required: false, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your message')).toBeInTheDocument();
  });

  it('should render select field', () => {
    const fields: LeadFormField[] = [
      { id: 'country', type: 'select', label: 'Country', options: ['USA', 'Canada'], required: false, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render checkbox field', () => {
    const fields: LeadFormField[] = [
      { id: 'terms', type: 'checkbox', label: 'Agree to terms', required: false, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Agree to terms/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should display required indicator for required fields', () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
      { id: 'email', type: 'email', label: 'Email', required: false, order: 1 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Full Name/i).nextSibling).toHaveTextContent('*');
    expect(screen.getByLabelText(/Email/i).nextSibling).not.toHaveTextContent('*');
  });

  it('should update formData state on input change', async () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
      { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com');

    fireEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  it('should display validation errors for empty required fields', async () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(screen.getByText('Full Name is required')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should display validation errors for invalid email', async () => {
    const fields: LeadFormField[] = [
      { id: 'email', type: 'email', label: 'Email', required: true, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Email/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should display validation errors for invalid LinkedIn URL', async () => {
    const fields: LeadFormField[] = [
      { id: 'linkedin_profile', type: 'text', label: 'LinkedIn Profile', required: false, order: 0, system_field: 'linkedin_profile' },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/LinkedIn Profile/i), 'not-a-linkedin-url');
    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid LinkedIn profile URL')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with correct formData when valid', async () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
      { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
      { id: 'terms', type: 'checkbox', label: 'Agree to terms', required: true, order: 2 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await userEvent.click(screen.getByLabelText(/Agree to terms/i));
    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        terms: true,
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const fields: LeadFormField[] = [
      { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
    ];
    render(
      <LeadCollectionForm
        fields={fields}
        submitText={defaultSubmitText}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
