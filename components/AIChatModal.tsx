
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { askHistoryTutor } from '../services/geminiService';
import SimpleMarkdown from './SimpleMarkdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIChatModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
  existingMessages?: Message[];
  onUpdateMessages: (messages: Message[]) => void;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ event, onClose, existingMessages, onUpdateMessages }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (event) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [event]);

  useEffect(() => {
    if (event) {
      if (existingMessages && existingMessages.length > 0) {
        setMessages(existingMessages);
      } else {
        const initialMsg: Message = {
          role: 'model',
          content: `Xin chào! Thầy là AI Sử Học. Em muốn tìm hiểu thêm gì về sự kiện "${event.title}" (${event.year}) không?`
        };
        setMessages([initialMsg]);
        onUpdateMessages([initialMsg]);
      }
    }
  }, [event]); // Removed existingMessages dependency to prevent loops, sync handled via local state & onUpdate

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !event) return;

    const userMsg = input;
    setInput('');
    
    const newMessagesUser: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessagesUser);
    onUpdateMessages(newMessagesUser);
    
    setIsLoading(true);

    const context = `Sự kiện: ${event.title}, Năm: ${event.year}, Nội dung: ${event.description}`;
    const response = await askHistoryTutor(userMsg, context);

    const newMessagesAI: Message[] = [...newMessagesUser, { role: 'model', content: response }];
    setMessages(newMessagesAI);
    onUpdateMessages(newMessagesAI);
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!event || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col h-[600px] overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="bg-history-red text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-history-gold" />
            <div>
              <h3 className="font-bold text-lg">AI Trợ Lý Sử Học</h3>
              <p className="text-xs text-red-100 opacity-80">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-red-800 p-1 rounded-lg transition-colors active:scale-95">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-history-paper">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.role === 'user' ? (
                    msg.content
                ) : (
                    <SimpleMarkdown text={msg.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-3xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-history-gold" />
                <span className="text-xs text-gray-500">Thầy đang suy nghĩ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi cho AI..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 bg-gray-50 focus:outline-none focus:border-history-gold focus:ring-1 focus:ring-history-gold"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-history-gold text-history-dark p-2 rounded-full hover:bg-yellow-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AIChatModal;
