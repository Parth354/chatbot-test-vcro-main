import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import LeadCollectionForm from '@/components/LeadCollectionForm';

const defaultFields = [
  { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name', order: 1 },
  { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter your email', order: 2 },
  { id: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: 'Enter your phone', order: 3 },
  { id: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'Your message', order: 4 },
  { id: 'country', label: 'Country', type: 'select', required: false, options: ['USA', 'Canada'], order: 5 },
  { id: 'terms', label: 'Agree to terms', type: 'checkbox', required: true, placeholder: 'Agree to terms', order: 6 },
  { id: 'linkedin_profile', label: 'LinkedIn Profile', type: 'text', required: false, system_field: 'linkedin_profile', placeholder: 'Enter your LinkedIn profile URL', order: 7 },
];

const defaultSubmitText = 'Submit';
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('LeadCollectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render text input field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name', order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('should render email input field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter your email', order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('should render phone input field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: 'Enter your phone', order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone')).toBeInTheDocument();
  });

  it('should render textarea field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'Your message', order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your message')).toBeInTheDocument();
  });

  it('should render select field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'country', label: 'Country', type: 'select', required: false, options: ['USA', 'Canada'], order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render checkbox field', () => {
    render(
      <LeadCollectionForm
        fields={[{ id: 'terms', label: 'Agree to terms', type: 'checkbox', required: true, placeholder: 'Agree to terms', order: 1 }]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByRole('checkbox', { name: /Agree to terms/i })).toBeInTheDocument();
  });

  it('should display required indicator for required fields', () => {
    render(
      <LeadCollectionForm
        fields={[
          { id: 'name', label: 'Full Name', type: 'text', required: true, order: 1 },
          { id: 'email', label: 'Email', type: 'email', required: false, order: 2 },
        ]} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Full Name')).toContainHTML('<span class="text-red-500 ml-1">*</span>');
    expect(screen.getByLabelText(/Email/i)).not.toHaveTextContent('*');
  });

  it('should update formData state on input change', async () => {
    render(
      <LeadCollectionForm
        fields={defaultFields.filter(f => f.id === 'name' || f.id === 'email')} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com');

    fireEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  it('should display validation errors for empty required fields', async () => {
    render(
      <LeadCollectionForm
        fields={defaultFields.filter(f => f.id === 'name' || f.id === 'email')} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(screen.getByText('Full Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should display validation errors for invalid email', async () => {
    render(
      <LeadCollectionForm
        fields={defaultFields.filter(f => f.id === 'email')} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Email/i), 'invalid-email');
      await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));
    });

    await waitFor(async () => {
      expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should display validation errors for invalid LinkedIn URL', async () => {
    render(
      <LeadCollectionForm
        fields={defaultFields.filter(f => f.id === 'linkedin_profile')} 
        submitText={defaultSubmitText} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/LinkedIn Profile/i), 'invalid-url');
    await userEvent.click(screen.getByRole('button', { name: defaultSubmitText }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid LinkedIn profile URL')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with correct formData when valid', async () => {
    render(
      <LeadCollectionForm
        fields={defaultFields.filter(f => f.id === 'name' || f.id === 'email' || f.id === 'terms')} 
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
    render(
      <LeadCollectionForm
        fields={[]} 
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
