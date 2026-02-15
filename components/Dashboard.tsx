
import React, { useState, useRef, useEffect } from 'react';
import { User, Message, MessageRole, ChatSession } from '../types';
import { 
  LogOut, Send, Bot, User as UserIcon, Sparkles, AlertCircle, 
  FileText, CheckCircle2, Plus, MessageSquare, Trash2, Menu, X 
} from 'lucide-react';
import { analyzeRequirement } from '../services/geminiService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem(`chats_${user.email}`);
    if (savedChats) {
      const parsed = JSON.parse(savedChats).map((c: any) => ({
        ...c,
        updatedAt: new Date(c.updatedAt),
        messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      }));
      setChats(parsed);
      if (parsed.length > 0) {
        setActiveChatId(parsed[0].id);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Sync chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(`chats_${user.email}`, JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Requirement',
      messages: [
        {
          id: '1',
          role: MessageRole.AI,
          content: `Hello ${user.name}! I'm your AI Requirement Analyst. Paste your requirement here, and I'll help you detect ambiguities and generate a solid User Story.`,
          timestamp: new Date(),
          type: 'text'
        }
      ],
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsSidebarOpen(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    if (activeChatId === id) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || !activeChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: inputValue,
      timestamp: new Date(),
      type: 'text'
    };

    // Update active chat with user message and potentially update title if it's the first user message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstUserMsg = !chat.messages.some(m => m.role === MessageRole.USER);
        return {
          ...chat,
          title: isFirstUserMsg ? (inputValue.length > 30 ? inputValue.substring(0, 30) + '...' : inputValue) : chat.title,
          messages: [...chat.messages, userMessage],
          updatedAt: new Date()
        };
      }
      return chat;
    }));

    setInputValue('');
    setIsTyping(true);

    try {
      const history = activeChat!.messages.slice(-10).map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const result = await analyzeRequirement(inputValue, history);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.AI,
        content: result.isAmbiguous 
          ? result.clarifications.map((c, i) => `${i + 1}. ${c}`).join('\n')
          : result.userStory || "No ambiguity found, but I couldn't generate a story. Please elaborate.",
        timestamp: new Date(),
        type: result.isAmbiguous ? 'clarification' : 'story'
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiResponse],
            updatedAt: new Date()
          };
        }
        return chat;
      }));
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.AI,
        content: "Sorry, I encountered an error while analyzing. Please try again.",
        timestamp: new Date(),
        type: 'text'
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, errorMsg] };
        }
        return chat;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar: Chat Management */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">ReqAnalyzer</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all border border-indigo-100 font-semibold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">History</h3>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                setIsSidebarOpen(false);
              }}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all border
                ${activeChatId === chat.id 
                  ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'}
              `}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeChatId === chat.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="flex-1 overflow-hidden">
                <div className={`text-sm truncate font-medium ${activeChatId === chat.id ? 'text-slate-900' : 'text-slate-600'}`}>
                  {chat.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {chat.updatedAt.toLocaleDateString()}
                </div>
              </div>
              <button 
                onClick={(e) => deleteChat(chat.id, e)}
                className={`p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${activeChatId === chat.id ? 'opacity-100' : ''}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white h-16 flex items-center justify-between px-4 lg:px-6 z-20 shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-sm lg:text-base text-slate-900 truncate max-w-[150px] lg:max-w-md">
                {activeChat?.title || 'ReqAnalyzer'}
              </span>
              <span className="text-[10px] lg:text-xs text-indigo-600 font-medium uppercase tracking-tight">Active Analysis</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 gap-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Flash Engine Active</span>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full">
            {activeChat?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 lg:gap-4 max-w-[90%] lg:max-w-[85%] ${message.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm ${
                    message.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-white border border-slate-200'
                  }`}>
                    {message.role === MessageRole.USER ? <UserIcon className="w-4 h-4 lg:w-6 lg:h-6 text-white" /> : <Bot className="w-4 h-4 lg:w-6 lg:h-6 text-indigo-600" />}
                  </div>

                  <div className={`p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-sm border ${
                    message.role === MessageRole.USER 
                      ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500' 
                      : 'bg-white text-slate-700 rounded-tl-none border-slate-200'
                  }`}>
                    {message.type === 'clarification' && (
                      <div className="flex items-start gap-2 mb-2 text-amber-600">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="font-bold text-[10px] tracking-wide uppercase">Ambiguity Detected</span>
                      </div>
                    )}

                    {message.type === 'story' && (
                      <div className="flex items-start gap-2 mb-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="font-bold text-[10px] tracking-wide uppercase">Final User Story</span>
                      </div>
                    )}

                    <div className={`whitespace-pre-wrap text-[14px] lg:text-[15px] leading-relaxed ${message.type === 'story' ? 'font-mono bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-800' : ''}`}>
                      {message.content}
                    </div>

                    <div className={`mt-3 text-[9px] uppercase font-bold tracking-widest text-right ${message.role === MessageRole.USER ? 'text-indigo-100/60' : 'text-slate-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Bot className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-3xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 lg:p-6 bg-white/90 border-t border-slate-200 shadow-lg">
            <div className="max-w-4xl mx-auto relative group">
              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your requirement..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-4 lg:pl-6 pr-16 lg:pr-24 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all min-h-[48px] lg:min-h-[56px] shadow-sm text-sm lg:text-base"
              />
              <div className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 lg:p-2.5 rounded-lg lg:rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right Tips Sidebar - Desktop Only */}
      <aside className="fixed right-6 top-24 w-64 hidden 2xl:block space-y-4">
        <div className="bg-white/80 p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wide uppercase">Analyzer Tips</h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-3">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              Identify specific actors like "Project Lead" or "System Admin".
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              Quantify goals whenever possible for clearer metrics.
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              Define the "Why" to provide business value context.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
