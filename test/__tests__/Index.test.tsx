import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import ChatbotUI from '@/components/ChatbotUI';

// Mock ChatbotUI
vi.mock('@/components/ChatbotUI', () => ({
  __esModule: true,
  default: vi.fn(({ previewMode, handleBubbleClick, handleClose }) => (
    <div data-testid="mock-chatbot-ui" data-preview-mode={previewMode}>
      Mock Chatbot UI
      <button data-testid="mock-bubble-click" onClick={handleBubbleClick}>Bubble Click</button>
      <button data-testid="mock-close-click" onClick={handleClose}>Close Click</button>
    </div>
  )),
}));

describe('Index Page', () => {
  const originalClipboard = { ...navigator.clipboard };
  const writeTextMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    });
  });

  const renderIndexPage = () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render the main page content', () => {
    renderIndexPage();
    expect(screen.getByText('VCRO Chatbot Widget')).toBeInTheDocument();
    expect(screen.getByText('Live Demo')).toBeInTheDocument();
    expect(screen.getByText('Integration Options')).toBeInTheDocument();
  });

  it('should render the ChatbotUI demo', () => {
    renderIndexPage();
    expect(screen.getByTestId('mock-chatbot-ui')).toBeInTheDocument();
    expect(ChatbotUI).toHaveBeenCalledWith(
      expect.objectContaining({
        previewMode: 'collapsed',
        isLivePreview: false,
        loadingChatbotData: false,
      }),
      {}
    );
  });

  it('should copy JavaScript embed code to clipboard', async () => {
    renderIndexPage();
    const copyButton = screen.getByRole('button', { name: /Copy JavaScript Code/i });
    await userEvent.click(copyButton);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('<script defer src='));
  });

  it('should copy iFrame embed code to clipboard', async () => {
    renderIndexPage();
    const copyButton = screen.getByRole('button', { name: /Copy iFrame Code/i });
    await userEvent.click(copyButton);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('<iframe'));
  });

  it('should navigate to admin panel', async () => {
    renderIndexPage();
    const adminPanelLink = screen.getByRole('link', { name: /Admin Panel/i });
    await userEvent.click(adminPanelLink);
    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });
  });

  it('should expand and collapse the chatbot demo', async () => {
    renderIndexPage();
    const chatbotDemo = screen.getByTestId('mock-chatbot-ui');
    const mockBubbleClickButton = screen.getByTestId('mock-bubble-click');
    const mockCloseClickButton = screen.getByTestId('mock-close-click');

    // Initially collapsed
    expect(chatbotDemo).toHaveAttribute('data-preview-mode', 'collapsed');

    // Click to expand
    await userEvent.click(mockBubbleClickButton);
    await waitFor(() => {
      expect(chatbotDemo).toHaveAttribute('data-preview-mode', 'expanded');
    });

    // Click to collapse
    await userEvent.click(mockCloseClickButton);
    await waitFor(() => {
      expect(chatbotDemo).toHaveAttribute('data-preview-mode', 'collapsed');
    });
  });
});
