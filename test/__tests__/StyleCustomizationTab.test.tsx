import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleCustomizationTab } from '@/components/agent-customize/StyleCustomizationTab';

describe('StyleCustomizationTab', () => {
  const mockFormData = {
    colors: {
      primary: "#123456",
      bubble: "#7890AB",
      text: "#CDEF01",
    },
  };

  const mockHandleColorChange = vi.fn();
  const mockGetFieldError = vi.fn(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders color inputs with current values', () => {
    render(
      <StyleCustomizationTab
        formData={mockFormData as any}
        handleColorChange={mockHandleColorChange}
        getFieldError={mockGetFieldError}
      />
    );

    expect(screen.getByLabelText(/Primary Color/i)).toHaveValue('#123456');
    expect(screen.getByLabelText(/Bubble Color/i)).toHaveValue('#7890ab'); // Hex values are often lowercased
    expect(screen.getByLabelText(/Text Color/i)).toHaveValue('#cdef01');
  });

  it('calls handleColorChange when primary color changes', async () => {
    const user = userEvent.setup();
    render(
      <StyleCustomizationTab
        formData={mockFormData as any}
        handleColorChange={mockHandleColorChange}
        getFieldError={mockGetFieldError}
      />
    );

    const primaryColorInput = screen.getByLabelText(/Primary Color/i);
    fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });
    expect(mockHandleColorChange).toHaveBeenCalledWith('primary', '#ff0000');
  });

  it('calls handleColorChange when bubble color changes', async () => {
    const user = userEvent.setup();
    render(
      <StyleCustomizationTab
        formData={mockFormData as any}
        handleColorChange={mockHandleColorChange}
        getFieldError={mockGetFieldError}
      />
    );

    const bubbleColorInput = screen.getByLabelText(/Bubble Color/i);
    fireEvent.change(bubbleColorInput, { target: { value: '#00FF00' } });
    expect(mockHandleColorChange).toHaveBeenCalledWith('bubble', '#00ff00');
  });

  it('calls handleColorChange when text color changes', async () => {
    const user = userEvent.setup();
    render(
      <StyleCustomizationTab
        formData={mockFormData as any}
        handleColorChange={mockHandleColorChange}
        getFieldError={mockGetFieldError}
      />
    );

    const textColorInput = screen.getByLabelText(/Text Color/i);
    fireEvent.change(textColorInput, { target: { value: '#0000FF' } });
    expect(mockHandleColorChange).toHaveBeenCalledWith('text', '#0000ff');
  });

  it('displays field errors', () => {
    mockGetFieldError.mockImplementation((fieldName) => {
      if (fieldName === 'colors.primary') return 'Invalid color format';
      return undefined;
    });
    render(
      <StyleCustomizationTab
        formData={mockFormData as any}
        handleColorChange={mockHandleColorChange}
        getFieldError={mockGetFieldError}
      />
    );
    expect(screen.getByText('Invalid color format')).toBeInTheDocument();
  });
});
