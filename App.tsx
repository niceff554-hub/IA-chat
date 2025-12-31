import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GenerateContentResponse, Chat } from "@google/genai";
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import CameraModal from './components/CameraModal';
import { createChatSession, prepareMessagePayload } from './services/geminiService';
import { Message, Sender, ChatSession, UserProfile, Attachment } from './types';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false); // New state for Voice Mode
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<Chat | null>(null);

  useEffect(() => {
    const activeSessionUser = localStorage.getItem('chat_active_user');
    if (activeSessionUser) {
      setUser(JSON.parse(activeSessionUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const userChatsKey = `chats_${user.username}`;
    const savedChats = localStorage.getItem(userChatsKey);
    
    if (savedChats) {
        try {
            const parsed: ChatSession[] = JSON.parse(savedChats).map((s: any) => ({
                ...s,
                updatedAt: new Date(s.updatedAt),
                messages: s.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)}))
            }));
            setSessions(parsed);
            if (parsed.length > 0) {
                const lastSession = parsed[0];
                setCurrentSessionId(lastSession.id);
                chatInstanceRef.current = createChatSession(lastSession.messages);
            } else {
                createNewChat(true);
            }
        } catch (e) {
            console.error("Failed to parse history", e);
            setSessions([]);
            createNewChat(true);
        }
    } else {
        setSessions([]);
        createNewChat(true);
    }
  }, [user]);

  // Persistent Storage Logic
  useEffect(() => {
      if(user) {
          try {
              localStorage.setItem(`chats_${user.username}`, JSON.stringify(sessions));
              setStorageError(null);
          } catch (e) {
              console.error("Local Storage Full", e);
              setStorageError("หน่วยความจำเต็ม! ประวัติการสนทนาบางส่วนอาจไม่ถูกบันทึก");
          }
      }
  }, [sessions, user]);

  const getCurrentMessages = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    return session ? session.messages : [];
  };

  const createNewChat = (switchToIt = true) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'การสนทนาใหม่',
      messages: [{
        id: 'welcome',
        text: `สวัสดีครับคุณ ${user?.name || ''}! IA Chat พร้อมให้บริการครับ มีอะไรให้ช่วยไหมครับ?`,
        sender: Sender.AI,
        timestamp: new Date()
      }],
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]); 
    
    if (switchToIt) {
      setCurrentSessionId(newSession.id);
      chatInstanceRef.current = createChatSession(); 
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
      if (id === currentSessionId) return;
      
      setCurrentSessionId(id);
      const session = sessions.find(s => s.id === id);
      if (session) {
          chatInstanceRef.current = createChatSession(session.messages);
      }
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('chat_active_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem('chat_active_user');
  };

  // TTS Helper Function
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH'; // Force Thai
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Select a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th'));
    if (thaiVoice) utterance.voice = thaiVoice;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId]);

  const handleSendMessage = useCallback(async (text: string, attachments: Attachment[]) => {
    if (!currentSessionId || !chatInstanceRef.current) return;

    // Stop speaking when user sends a new message
    window.speechSynthesis.cancel();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: Sender.User,
      timestamp: new Date(),
      attachments: attachments
    };

    setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
            let title = session.title;
            if (session.messages.length <= 1) {
                title = text.length > 30 ? text.substring(0, 30) + '...' : (text || (attachments.length ? 'ส่งรูปภาพ' : 'การสนทนา'));
            }
            return {
                ...session,
                title,
                messages: [...session.messages, userMessage],
                updatedAt: new Date()
            };
        }
        return session;
    }));

    setIsLoading(true);

    try {
      const aiMessageId = (Date.now() + 1).toString();
      
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: [...s.messages, {
              id: aiMessageId,
              text: '',
              sender: Sender.AI,
              timestamp: new Date(),
              isStreaming: true
          }]
      } : s));

      const payload = prepareMessagePayload(text, attachments);
      
      const result = await chatInstanceRef.current.sendMessageStream({ message: payload });
      
      let fullText = '';
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || '';
        fullText += chunkText;

        setSessions(prev => prev.map(s => {
            if (s.id !== currentSessionId) return s;
            return {
                ...s,
                messages: s.messages.map(m => m.id === aiMessageId ? { ...m, text: fullText } : m)
            };
        }));
      }
      
      setSessions(prev => prev.map(s => {
          if (s.id !== currentSessionId) return s;
          return {
              ...s,
              messages: s.messages.map(m => m.id === aiMessageId ? { ...m, isStreaming: false } : m)
          };
      }));

      // Auto Speak Logic
      if (isAutoSpeak) {
        speakText(fullText);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: [...s.messages, {
              id: Date.now().toString(),
              text: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ',
              sender: Sender.AI,
              timestamp: new Date()
          }]
      } : s));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, isAutoSpeak]);

  const handleCameraCapture = (base64: string) => {
      const attachment: Attachment = {
          type: 'image',
          mimeType: 'image/jpeg',
          data: base64
      };
      
      handleSendMessage("ส่งรูปภาพ", [attachment]);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const currentMessages = getCurrentMessages();
  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-kanit">
      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={() => createNewChat(true)}
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full bg-gray-50">
        {/* Header - Clean Light Style */}
        <header className="bg-white shadow-sm p-3 border-b border-gray-200 flex items-center justify-between z-20">
          <div className="flex items-center">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md relative overflow-hidden ${user.username === 'Nice222' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-100' : 'bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-100'}`}>
                    <span className="text-xl relative z-10">{user.username === 'Nice222' ? '👑' : '👤'}</span>
                </div>
                <div>
                    <h1 className="text-lg font-black italic leading-none mb-0.5 uppercase tracking-wide text-gray-800">
                        IA <span className="text-green-600">CHAT</span>
                    </h1>
                    <p className={`text-[10px] font-mono tracking-wider uppercase truncate max-w-[150px] ${user.username === 'Nice222' ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                        {currentSessionId ? currentSession?.title : 'พร้อมใช้งาน'}
                    </p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
              {/* Voice Mode Toggle */}
              <button 
                onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
                    isAutoSpeak 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
                title="โหมดอ่านออกเสียงอัตโนมัติ"
              >
                 {isAutoSpeak ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>เปิดเสียง</span>
                    </>
                 ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                        <span>ปิดเสียง</span>
                    </>
                 )}
              </button>

              <button 
                onClick={handleLogout}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded border border-red-200 transition-colors uppercase tracking-wider hidden md:block"
              >
                  ออกจากระบบ
              </button>
          </div>
        </header>

        {/* Warning Banner for Storage */}
        {storageError && (
             <div className="bg-red-500 text-white text-center text-xs py-1 px-2 absolute top-16 left-0 right-0 z-30 shadow-md">
                ⚠️ {storageError} - กรุณาลบประวัติเก่าออกบ้าง
             </div>
        )}

        {/* Chat Area - Clean White Background */}
        <div className="flex-1 overflow-y-auto px-2 md:px-4 py-6 scroll-smooth bg-gray-50 relative">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            {currentMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput 
            onSend={handleSendMessage} 
            disabled={isLoading} 
            onCameraRequest={() => setShowCamera(true)}
        />
        
        {/* Camera Modal */}
        {showCamera && (
            <CameraModal 
                onCapture={handleCameraCapture} 
                onClose={() => setShowCamera(false)} 
            />
        )}
      </div>
    </div>
  );
}

export default App;