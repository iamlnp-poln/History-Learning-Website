
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, StopCircle, ArrowRight, Copy, Info, Check, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToHistoryTutor } from '../services/geminiService';
import SimpleMarkdown from './SimpleMarkdown';

const SUGGESTED_QUESTIONS = [
  "Nguyên nhân thắng lợi của Cách mạng tháng Tám?",
  "Ý nghĩa lịch sử chiến thắng Điện Biên Phủ 1954?",
  "So sánh phong trào Cần Vương và khởi nghĩa Yên Thế?",
  "Vai trò của Nguyễn Ái Quốc từ 1911 đến 1930?",
  "Nội dung cơ bản của Luận cương chính trị 10/1930?"
];

// Dữ liệu mẫu cho Chatbase User Guide
const CHATBASE_SAMPLES = [
    "Năm 1911 có sự kiện gì quan trọng?",
    "Vai trò của Hồ Chí Minh giai đoạn 1911–1930?",
    "Sự kiện liên quan Hoàng Sa năm 1974",
    "Từ 1945 đến 1954: những diễn biến chính ở Việt Nam"
];

const ChatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'chatbase'>('gemini');
  
  // --- GEMINI STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Chào em! Thầy là AI Sử Học (Gemini). Em đang thắc mắc về giai đoạn lịch sử hay sự kiện nào? Hãy hỏi thầy nhé!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestAiMessageRef = useRef<HTMLDivElement>(null);

  // --- GEMINI EFFECTS ---
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model') {
       latestAiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (activeTab === 'gemini') {
        inputRef.current?.focus();
    }
  }, [activeTab]);

  // --- GEMINI HANDLERS ---
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await sendMessageToHistoryTutor(messages, textToSend);

    // Add AI Response
    const aiMsg: ChatMessage = { role: 'model', text: response };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleClearChat = () => {
    if (confirm("Em có chắc muốn xóa toàn bộ cuộc trò chuyện không?")) {
      setMessages([{ role: 'model', text: 'Chào em! Thầy là AI Sử Học (Gemini). Em muốn tìm hiểu gì hôm nay?' }]);
    }
  };

  // --- CHATBASE HANDLERS ---
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          alert("Đã sao chép câu hỏi mẫu!");
      });
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-history-paper flex flex-col animate-fade-in relative">
      
      {/* Tab Switching Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm shrink-0 px-4 pt-4 pb-0">
        <div className="max-w-4xl mx-auto flex items-end gap-6">
            <button 
                onClick={() => setActiveTab('gemini')}
                className={`pb-3 px-2 text-sm md:text-base font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'gemini' ? 'border-history-red text-history-red' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Sparkles size={18} /> AI Tổng Quát (Gemini)
            </button>
            <button 
                onClick={() => setActiveTab('chatbase')}
                className={`pb-3 px-2 text-sm md:text-base font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'chatbase' ? 'border-[#c9923b] text-[#c9923b]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Bot size={18} /> Trợ Lý Chuyên Sâu (Local)
            </button>
        </div>
      </div>

      {/* --- GEMINI TAB CONTENT --- */}
      {activeTab === 'gemini' && (
          <>
            <div className="flex-1 overflow-y-auto w-full px-4 py-6 space-y-6 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        ref={idx === messages.length - 1 && msg.role === 'model' ? latestAiMessageRef : null}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-history-red text-white'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm text-sm md:text-base leading-relaxed ${
                        msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}>
                        {msg.role === 'user' ? (
                            msg.text
                        ) : (
                            <SimpleMarkdown text={msg.text} />
                        )}
                        </div>
                    </div>
                    ))}

                    {isLoading && (
                    <div className="flex gap-4 animate-fade-in">
                        <div className="w-8 h-8 bg-history-red rounded-full flex items-center justify-center text-white shrink-0 mt-2">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                    )}
                    
                    <div className="h-20"></div>
                </div>
            </div>

            {/* Suggestions */}
            {messages.length < 3 && !isLoading && (
                <div className="absolute bottom-20 left-0 right-0 max-w-4xl mx-auto w-full px-4 mb-4 z-20 pointer-events-none">
                <div className="pointer-events-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 ml-2 flex items-center gap-1"><Sparkles size={12}/> Gợi ý câu hỏi</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(q)}
                            className="text-xs md:text-sm bg-white/90 backdrop-blur hover:bg-history-gold hover:text-history-dark border border-gray-200 text-gray-600 px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 text-left"
                        >
                            {q}
                        </button>
                        ))}
                    </div>
                </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-30">
                <div className="max-w-4xl mx-auto flex gap-2 relative">
                <button 
                    onClick={handleClearChat}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all mr-1"
                    title="Xóa đoạn chat"
                >
                    <Trash2 size={20} />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder="Hỏi thầy bất cứ điều gì về lịch sử..."
                    className="flex-1 bg-gray-50 text-gray-800 rounded-full pl-6 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-history-gold transition-shadow shadow-inner"
                    disabled={isLoading}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className={`
                    absolute right-2 top-1.5 p-1.5 rounded-full text-white transition-all
                    ${isLoading || !input.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-history-dark hover:bg-black shadow-lg hover:scale-105 active:scale-90'}
                    `}
                >
                    {isLoading ? <StopCircle size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
                </div>
            </div>
          </>
      )}

      {/* --- CHATBASE TAB CONTENT --- */}
      {activeTab === 'chatbase' && (
          <div className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-40 bg-[#fffaf0]">
              <div className="max-w-5xl mx-auto h-full flex flex-col">
                  
                  {/* User Guide Card (Styled based on provided HTML) */}
                  <div className="bg-[#f3e4b5] rounded-[14px] border border-[#c9923b]/30 shadow-sm overflow-hidden mb-6 shrink-0 animate-fade-in">
                      {/* Header */}
                      <div className="flex items-center gap-4 px-6 py-5 border-b border-[#c9923b]/20 bg-gradient-to-r from-[#c9923b]/10 to-transparent">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c9923b] to-[#8a5b21] flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                              LS
                          </div>
                          <div className="flex-1">
                              <h2 className="text-lg font-bold text-[#3a2713] leading-tight">Chatbot Lịch sử Việt Nam & Thế giới (1911–2015)</h2>
                              <p className="text-xs text-[#5a4325] mt-1">Trợ lý ảo chuyên sâu — trả lời theo mốc thời gian, nhân vật</p>
                          </div>
                          <div className="hidden sm:block bg-white/60 px-3 py-1.5 rounded-lg text-xs font-bold text-[#8a5b21] border border-black/5">
                              Phạm vi: 1911–2015
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left: Tips */}
                          <div className="bg-gradient-to-b from-white/70 to-white/50 rounded-xl p-4 border border-[#c9923b]/20">
                              <h3 className="text-[#3a2713] font-bold text-sm mb-3 flex items-center gap-2">
                                  <Info size={16}/> Cách đặt câu hỏi hiệu quả
                              </h3>
                              <ul className="list-disc pl-5 text-sm text-[#5a4325] space-y-2">
                                  <li><strong>Hỏi theo năm/giai đoạn:</strong> "Năm 1945 có sự kiện gì?"</li>
                                  <li><strong>Hỏi theo nhân vật:</strong> "Vai trò của Võ Nguyên Giáp?"</li>
                                  <li><strong>Hỏi theo chủ đề:</strong> "Sự kiện liên quan Hoàng Sa?"</li>
                              </ul>
                              <p className="mt-4 text-xs italic text-[#8a5b21] bg-[#fbf4df] p-2 rounded-lg">
                                  *Lưu ý: Chatbot chỉ trả lời trong phạm vi 1911–2015.
                              </p>
                          </div>

                          {/* Right: Examples */}
                          <div className="relative">
                              <h3 className="text-[#3a2713] font-bold text-sm mb-3 flex items-center gap-2">
                                  <MessageSquare size={16}/> Ví dụ câu hỏi (Nhấn để sao chép)
                              </h3>
                              <div className="flex flex-col gap-2">
                                  {CHATBASE_SAMPLES.map((sample, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => copyToClipboard(sample)}
                                        className="text-left px-3 py-2 bg-[#fffdf7] border border-black/5 rounded-lg text-xs text-[#5a4325] hover:bg-white hover:border-[#c9923b]/40 transition-all flex items-center justify-between group"
                                      >
                                          <span className="truncate pr-2">{sample}</span>
                                          <Copy size={12} className="opacity-0 group-hover:opacity-100 text-[#c9923b]" />
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Chatbase Iframe */}
                  <div className="flex-1 min-h-[500px] lg:min-h-[850px] relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white animate-slide-up">
                      <iframe
                        src="https://www.chatbase.co/chatbot-iframe/-70OphLjZ5mycfNguvvlT"
                        width="100%"
                        style={{ height: '100%', minHeight: '100%' }}
                        frameBorder="0"
                        title="Chatbase Bot"
                        className="absolute inset-0"
                      ></iframe>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatPage;
