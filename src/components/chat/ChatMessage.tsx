import type { ChatMessage as ChatMessageType } from '../../stores/chatStore';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-[var(--color-card)] text-gray-200 border border-[var(--color-border)] rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
