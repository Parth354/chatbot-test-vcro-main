import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RotatingMessagesTab } from '@/components/agent-customize/RotatingMessagesTab';

describe('RotatingMessagesTab', () => {
  const mockFormData = {
    rotating_messages: ['Message 1', 'Message 2'],
  };

  const mockHandleInputChange = vi.fn();
  const mockSetNewMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing rotating messages', () => {
    render(
      <RotatingMessagesTab
        formData={mockFormData as any}
        handleInputChange={mockHandleInputChange}
        newMessage=""
        setNewMessage={mockSetNewMessage}
      />
    );

    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
  });

  it('adds a new rotating message', async () => {
    const user = userEvent.setup();
    render(
      <RotatingMessagesTab
        formData={mockFormData as any}
        handleInputChange={mockHandleInputChange}
        newMessage="New Message"
        setNewMessage={mockSetNewMessage}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add rotating message/i });
    await user.click(addButton);

    expect(mockHandleInputChange).toHaveBeenCalledWith(
      'rotating_messages',
      ['Message 1', 'Message 2', 'New Message']
    );
    expect(mockSetNewMessage).toHaveBeenCalledWith('');
  });

  it('removes a rotating message', async () => {
    const user = userEvent.setup();
    render(
      <RotatingMessagesTab
        formData={mockFormData as any}
        handleInputChange={mockHandleInputChange}
        newMessage=""
        setNewMessage={mockSetNewMessage}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove rotating message/i });
    await user.click(removeButtons[0]); // Click on the first remove button

    expect(mockHandleInputChange).toHaveBeenCalledWith(
      'rotating_messages',
      ['Message 2']
    );
  });
});
