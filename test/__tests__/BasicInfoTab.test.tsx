import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoTab } from '@/components/agent-customize/BasicInfoTab';

describe('BasicInfoTab', () => {
  const mockFormData = {
    name: 'Test Agent',
    description: 'A test agent',
    avatar_url: '',
    welcome_message: 'Hello!',
    status: 'active',
    linkedin_url: ''
  };

  const mockHandleInputChange = vi.fn();
  const mockGetFieldError = vi.fn((fieldName) => {
    if (fieldName === 'name' && mockFormData.name === '') return 'Agent name is required';
    return undefined;
  });
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic info fields correctly', () => {
    render(
      <BasicInfoTab
        formData={mockFormData}
        handleInputChange={mockHandleInputChange}
        getFieldError={mockGetFieldError}
        userId={mockUserId}
      />
    );

    expect(screen.getByLabelText(/Agent Name/i)).toHaveValue('Test Agent');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('A test agent');
    expect(screen.getByLabelText(/Welcome Message/i)).toHaveValue('Hello!');
    expect(screen.getByLabelText(/Active/i)).toBeChecked();
    
  });

  it('calls handleInputChange when input values change', async () => {
    const user = userEvent.setup();
    render(
      <BasicInfoTab
        formData={mockFormData}
        handleInputChange={mockHandleInputChange}
        getFieldError={mockGetFieldError}
        userId={mockUserId}
      />
    );

    const nameInput = screen.getByLabelText(/Agent Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Agent' } });
    expect(mockHandleInputChange).toHaveBeenCalledWith('name', 'Updated Agent');

    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
    expect(mockHandleInputChange).toHaveBeenCalledWith('description', 'Updated description');

    const welcomeInput = screen.getByLabelText(/Welcome Message/i);
    fireEvent.change(welcomeInput, { target: { value: 'Updated welcome' } });
    expect(mockHandleInputChange).toHaveBeenCalledWith('welcome_message', 'Updated welcome');

    
  });

  it('toggles status switch', async () => {
    const user = userEvent.setup();
    render(
      <BasicInfoTab
        formData={mockFormData}
        handleInputChange={mockHandleInputChange}
        getFieldError={mockGetFieldError}
        userId={mockUserId}
      />
    );

    const statusSwitch = screen.getByLabelText(/Active/i);
    await user.click(statusSwitch);
    expect(mockHandleInputChange).toHaveBeenCalledWith('status', 'inactive');
  });

  it('displays validation errors', () => {
    mockGetFieldError.mockImplementation((fieldName) => {
      if (fieldName === 'name') return 'Agent name is required';
      return undefined;
    });
    render(
      <BasicInfoTab
        formData={{ ...mockFormData, name: '' }}
        handleInputChange={mockHandleInputChange}
        getFieldError={mockGetFieldError}
        userId={mockUserId}
      />
    );
    expect(screen.getByText('Agent name is required')).toBeInTheDocument();
  });
});
