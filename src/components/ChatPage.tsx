
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, StopCircle, ArrowRight, Copy, Info, Check, MessageSquare, Loader2, Paperclip, Image as ImageIcon, X, FileText } from 'lucide-react';
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
  const [attachment, setAttachment] = useState<{ data: string, mimeType: string } | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const data = base64Data.split(',')[1];
        setAttachment({ data, mimeType: file.type });
        setAttachmentPreview(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachment) return;

    // Add User Message
    const userMsg: ChatMessage = { 
        role: 'user', 
        text: textToSend,
        image: attachmentPreview || undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachment = attachment;
    removeAttachment();
    setIsLoading(true);

    const response = await sendMessageToHistoryTutor(messages, textToSend, currentAttachment || undefined);

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
                <Sparkles size={18} /> AI Tổng quát (LLM)
            </button>
            <button 
                onClick={() => setActiveTab('chatbase')}
                className={`pb-3 px-2 text-sm md:text-base font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'chatbase' ? 'border-[#c9923b] text-[#c9923b]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Bot size={18} /> AI Chuyên sâu (NarrowLM)
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
                        {msg.image && (
                            <div className="mb-3">
                                <img src={msg.image} alt="Attached" className="max-w-full rounded-lg shadow-sm border border-white/20" />
                            </div>
                        )}
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
                    
                    <div className="h-32"></div>
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

            {/* Input Area - Floating Bar */}
            <div className="absolute bottom-6 left-0 right-0 z-30 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Attachment Preview */}
                    {attachmentPreview && (
                        <div className="mb-2 ml-4 animate-slide-up">
                            <div className="relative inline-block group">
                                {attachment?.mimeType.startsWith('image/') ? (
                                    <img src={attachmentPreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-md" />
                                ) : (
                                    <div className="h-20 w-20 bg-white rounded-xl border-2 border-white shadow-md flex flex-col items-center justify-center text-gray-500">
                                        <FileText size={24} />
                                        <span className="text-[10px] mt-1 font-bold">DOCUMENT</span>
                                    </div>
                                )}
                                <button 
                                    onClick={removeAttachment}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2rem] p-2 shadow-2xl flex items-center gap-2 relative ring-1 ring-black/5">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/*,application/pdf,.doc,.docx,.txt"
                        />
                        
                        <button 
                            onClick={handleClearChat}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Xóa đoạn chat"
                        >
                            <Trash2 size={20} />
                        </button>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-history-red hover:bg-red-50 rounded-full transition-all"
                            title="Đính kèm ảnh/tài liệu"
                        >
                            <Paperclip size={20} />
                        </button>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Hỏi thầy bất cứ điều gì về lịch sử..."
                            className="flex-1 bg-transparent text-gray-800 px-4 py-3 focus:outline-none text-sm md:text-base"
                            disabled={isLoading}
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || (!input.trim() && !attachment)}
                            className={`
                                p-3 rounded-full text-white transition-all
                                ${isLoading || (!input.trim() && !attachment) ? 'bg-gray-200 cursor-not-allowed' : 'bg-history-dark hover:bg-black shadow-lg hover:scale-105 active:scale-90'}
                            `}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
          </>
      )}

      {/* --- CHATBASE TAB CONTENT --- */}
      {activeTab === 'chatbase' && (
          <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-40 bg-[#f4ece1] bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]">
              <div className="max-w-3xl mx-auto flex flex-col items-center">
                  
                  {/* Logo & Header Section */}
                  <div className="text-center mb-8 animate-fade-in">
                      <div className="inline-flex items-center justify-center w-16 h-20 mb-6 relative">
                          <div className="absolute inset-0 border-2 border-[#b08d57] rounded-lg rotate-45"></div>
                          <span className="text-2xl font-serif font-bold text-[#b08d57] relative z-10">IS</span>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#8a6d3b] mb-2 leading-tight">
                          Chatbot Lịch sử Việt Nam<br />& Thế giới (1911–2015)
                      </h1>
                      <p className="text-[#5a4325] font-medium">
                          Trợ lý ảo chuyên sâu — trả lời theo mốc thời gian, nhân vật
                      </p>
                  </div>

                  {/* Main Guide Card */}
                  <div className="w-full bg-[#fdf6e3]/80 backdrop-blur-sm rounded-[32px] border-2 border-[#d4bc8d] shadow-xl p-8 md:p-10 mb-10 animate-slide-up">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#b08d57] flex items-center justify-center text-white">
                              <Info size={18} fill="currentColor" className="text-[#fdf6e3]" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#3a2713]">
                              Cách đặt câu hỏi hiệu quả
                          </h2>
                      </div>

                      <div className="space-y-6 text-[#5a4325]">
                          <div className="flex gap-3">
                              <span className="text-[#b08d57] mt-1.5 shrink-0">•</span>
                              <div>
                                  <p className="font-bold text-base md:text-lg">Hỏi theo năm/giai đoạn:</p>
                                  <p className="text-sm md:text-base opacity-90">Năm 1911 có sự kiện gì quan trọng?</p>
                                  <p className="text-sm md:text-base opacity-90">Vai trò của Hồ Chí Minh đoạn 1911–1931?</p>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <span className="text-[#b08d57] mt-1.5 shrink-0">•</span>
                              <div>
                                  <p className="font-bold text-base md:text-lg">Hỏi theo nhân vật:</p>
                                  <p className="text-sm md:text-base opacity-90">Sự vai trò của Hồ Chí Minh giai đoạn 1911–1930?</p>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <span className="text-[#b08d57] mt-1.5 shrink-0">•</span>
                              <div>
                                  <p className="font-bold text-base md:text-lg">Hỏi theo chủ đề:</p>
                                  <p className="text-sm md:text-base opacity-90">Từ 1945 đến 1954: những diễn biến chính ở Việt Nam Việt Nam?</p>
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#d4bc8d]/30">
                          <p className="text-sm italic text-[#8a6d3b] font-medium">
                              *Lưu ý: Chatbot chỉ trả lời trong phạm vi 1911–2015.
                          </p>
                      </div>
                  </div>

                  {/* Examples Section */}
                  <div className="w-full text-center mb-12 animate-fade-in delay-150">
                      <h3 className="text-xl font-serif font-bold text-[#3a2713] mb-6">
                          Ví dụ câu hỏi (Nhấn để sao chép)
                      </h3>
                      <div className="flex flex-col items-center gap-4">
                          {CHATBASE_SAMPLES.map((sample, idx) => (
                              <button 
                                key={idx}
                                onClick={() => copyToClipboard(sample)}
                                className="w-full max-w-xl px-8 py-3.5 bg-[#fdf6e3] border border-[#d4bc8d] rounded-full text-[#5a4325] font-medium shadow-md hover:shadow-lg hover:bg-white hover:border-[#b08d57] transition-all active:scale-[0.98] group flex items-center justify-center relative overflow-hidden"
                              >
                                  <span className="relative z-10">{sample}</span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Chatbase Iframe Container */}
                  <div className="w-full h-[700px] md:h-[850px] rounded-[32px] overflow-hidden shadow-2xl border-4 border-[#d4bc8d] bg-white animate-slide-up relative">
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 -z-10">
                          <Loader2 className="animate-spin text-[#b08d57]" size={40} />
                      </div>
                      <iframe
                        src="https://www.chatbase.co/chatbot-iframe/-70OphLjZ5mycfNguvvlT"
                        width="100%"
                        style={{ height: '100%', minHeight: '100%' }}
                        frameBorder="0"
                        title="Chatbase Bot"
                        className="w-full h-full"
                      ></iframe>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatPage;
