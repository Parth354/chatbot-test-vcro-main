import { Copy, ThumbsDown, ThumbsUp, Link, Mail, Phone } from "lucide-react";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';

interface ChatMessageProps {
  message: {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    feedback_type?: 'up' | 'down' | null;

  };
  botAvatar: string;
  botName: string;
  
  isLivePreview?: boolean;
  
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, botAvatar, botName,  isLivePreview, handleCopyMessage, handleFeedback }) => {
  const getAvatarSrc = (originalSrc: string) => {
    if (!originalSrc) {
      return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\'/\%3E%3Ccircle cx=\'12\' cy=\'7\' r=\'4\'/\%3E%3C/svg%3E';
    }
    return originalSrc;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = getAvatarSrc('');
  };

  return (
    <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`${message.sender === 'user' ? 'max-w-[85%]' : 'max-w-[85%]'} rounded-xl p-3 ${
          message.sender === 'user' ? 'bg-widget-primary text-white rounded-br-none' : 'bg-gray-100 rounded-bl-none'
        }`}>
        {message.sender === 'bot' ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-widget-bubble rounded-full border border-widget-ring overflow-hidden flex-shrink-0">
              <img
                src={getAvatarSrc(botAvatar)}
                alt={`${botName} - AI Clone`}
                className="w-full h-full object-cover rounded-full"
                onError={handleImageError}
              />
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter style={dracula} language={match[1]} PreTag="div" {...props}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Custom renderer for text to detect and format links, emails, and phone numbers
                  a: ({ node, ...props }) => {
                    const href = props.href || '';
                    if (href.startsWith('mailto:')) {
                      return <a {...props} className="text-blue-500 underline"><Mail size={14} className="inline-block mr-1" />{props.children}</a>;
                    } else if (href.startsWith('tel:')) {
                      return <a {...props} className="text-blue-500 underline"><Phone size={14} className="inline-block mr-1" />{props.children}</a>;
                    } else {
                      return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline"><Link size={14} className="inline-block mr-1" />{props.children}</a>;
                    }
                  },
                  }}>
                {message.text}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed">{message.text}</div>
        )}
         
      </div>
      {message.sender === 'bot' && (
              <div className="flex items-center gap-1 mt-2 ml-12"><TooltipProvider>
                  <Tooltip><TooltipTrigger asChild><button onClick={() => handleCopyMessage(message.text)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"><Copy size={14} /></button></TooltipTrigger><TooltipContent><p>Copy & Share</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><button onClick={() => handleFeedback('up', message.id)} disabled={isLivePreview} className={`p-1.5 transition-colors rounded ${message.feedback_type === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}><ThumbsUp size={14} /></button></TooltipTrigger><TooltipContent><p>Share your feedback</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><button onClick={() => handleFeedback('down', message.id)} disabled={isLivePreview} className={`p-1.5 transition-colors rounded ${message.feedback_type === 'down' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}><ThumbsDown size={14} /></button></TooltipTrigger><TooltipContent><p>Share your feedback</p></TooltipContent></Tooltip>
              </TooltipProvider></div>
            )}
    </div>
  );
};

export default ChatMessage;
