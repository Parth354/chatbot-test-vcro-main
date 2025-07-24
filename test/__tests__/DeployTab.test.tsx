import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import DeployTab from '@/components/DeployTab';
import { useToast } from '@/hooks/use-toast';

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

describe('DeployTab', () => {
  const mockAgentId = 'test-agent-id';
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    // Mock window.location.origin for consistent base URL
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:8080',
      },
      writable: true,
    });
  });

  it('should render without crashing', () => {
    render(<DeployTab agentId={mockAgentId} />);
    expect(screen.getByText('Direct Link')).toBeInTheDocument();
    expect(screen.getByText('Add to a Website')).toBeInTheDocument();
    expect(screen.getByText('Display Inside Webpage')).toBeInTheDocument();
  });

  it('should display the correct direct link', () => {
    render(<DeployTab agentId={mockAgentId} />);
    const directLinkInput = screen.getByDisplayValue(`http://localhost:8080/embed/${mockAgentId}`);
    expect(directLinkInput).toBeInTheDocument();
  });

  it('should display the correct script code', () => {
    render(<DeployTab agentId={mockAgentId} />);
    const scriptCode = `<script defer src="http://localhost:8080/embed.js" data-bot-id="${mockAgentId}"></script>`;
    expect(screen.getByText(scriptCode)).toBeInTheDocument();
  });

  it('should display the correct iframe code with default dimensions', () => {
    render(<DeployTab agentId={mockAgentId} />);
    const iframeCode = `<iframe style="width: 400px; height: 600px; border: none;" src="http://localhost:8080/iframe/${mockAgentId}"></iframe>`;
    expect(screen.getByText(iframeCode)).toBeInTheDocument();
  });

  it('should update iframe width when input changes', () => {
    render(<DeployTab agentId={mockAgentId} />);
    const widthInput = screen.getByLabelText('Width (px)');
    fireEvent.change(widthInput, { target: { value: '500' } });
    const iframeCode = `<iframe style="width: 500px; height: 600px; border: none;" src="http://localhost:8080/iframe/${mockAgentId}"></iframe>`;
    expect(screen.getByText(iframeCode)).toBeInTheDocument();
  });

  it('should update iframe height when input changes', () => {
    render(<DeployTab agentId={mockAgentId} />);
    const heightInput = screen.getByLabelText('Height (px)');
    fireEvent.change(heightInput, { target: { value: '700' } });
    const iframeCode = `<iframe style="width: 400px; height: 700px; border: none;" src="http://localhost:8080/iframe/${mockAgentId}"></iframe>`;
    expect(screen.getByText(iframeCode)).toBeInTheDocument();
  });

  it('should copy direct link to clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    render(<DeployTab agentId={mockAgentId} />);
    const directLinkInput = screen.getByDisplayValue(`http://localhost:8080/embed/${mockAgentId}`);
    const copyButton = directLinkInput.closest('.flex.gap-2')?.querySelector('button:nth-of-type(1)');
    if (!copyButton) throw new Error('Direct link copy button not found');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`http://localhost:8080/embed/${mockAgentId}`);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copied!',
        description: 'Direct link copied to clipboard',
      });
    });
  });

  it('should open direct link in a new tab', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<DeployTab agentId={mockAgentId} />);
    const openButton = screen.getByRole('button', { name: /open/i });
    fireEvent.click(openButton);
    expect(windowOpenSpy).toHaveBeenCalledWith(`http://localhost:8080/embed/${mockAgentId}`, '_blank', 'noopener,noreferrer');
    windowOpenSpy.mockRestore();
  });
});
