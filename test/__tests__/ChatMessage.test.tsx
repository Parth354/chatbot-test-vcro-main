
import { render, screen } from '@testing-library/react';
import ChatMessage from '../../src/components/ChatMessage';

describe('ChatMessage', () => {
  const botAvatar = 'https://example.com/bot.png';
  const botName = 'Test Bot';

  it('renders a user message correctly', () => {
    const message = { id: '1', sender: 'user' as const, text: 'Hello, world!' };
    render(<ChatMessage message={message} botAvatar={botAvatar} botName={botName} />);

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.queryByAltText(`${botName} - AI Clone`)).not.toBeInTheDocument();
  });

  it('renders a bot message correctly', () => {
    const message = { id: '2', sender: 'bot' as const, text: 'Hi there! I am a bot.' };
    render(<ChatMessage message={message} botAvatar={botAvatar} botName={botName} />);

    expect(screen.getByText('Hi there! I am a bot.')).toBeInTheDocument();
    expect(screen.getByAltText(`${botName} - AI Clone`)).toBeInTheDocument();
  });

  it('renders a bot message with a code block', () => {
    const message = {
      id: '3',
      sender: 'bot' as const,
      text: 'Here is some code:\n```javascript\nconsole.log("Hello, world!");\n```',
    };
    render(<ChatMessage message={message} botAvatar={botAvatar} botName={botName} />);

    expect(screen.getByText('console.log("Hello, world!");')).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveStyle('background-color: #282a36');
  });

  it('uses a fallback avatar if the bot avatar fails to load', () => {
    const message = { id: '4', sender: 'bot' as const, text: 'Hi there!' };
    render(<ChatMessage message={message} botAvatar="" botName={botName} />);

    const avatar = screen.getByAltText(`${botName} - AI Clone`);
    expect(avatar).toHaveAttribute(
      'src',
      'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\'/\%3E%3Ccircle cx=\'12\' cy=\'7\' r=\'4\'/\%3E%3C%2Fsvg%3E'
    );
  });
});
