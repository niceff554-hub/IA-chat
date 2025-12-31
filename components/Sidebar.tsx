import React from 'react';
import { ChatSession, UserProfile } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  user,
  isOpen,
  onClose
}) => {
  const handleFactoryReset = () => {
    if (confirm('คำเตือน: การลบข้อมูลถาวร! ประวัติการแชททั้งหมดจะหายไป คุณแน่ใจหรือไม่?')) {
       localStorage.removeItem(`chats_${user.username}`);
       window.location.reload();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* User Profile Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm bg-white ${user.username === 'Nice222' ? 'border-yellow-200' : 'border-gray-100'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${user.username === 'Nice222' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300' : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-100'}`}>
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold uppercase tracking-wide truncate ${user.username === 'Nice222' ? 'text-yellow-700' : 'text-gray-800'}`}>{user.name}</p>
                    <p className="text-xs text-gray-500 truncate font-mono">@{user.username}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${user.username === 'Nice222' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        <span className={`text-[10px] font-bold uppercase ${user.username === 'Nice222' ? 'text-yellow-600' : 'text-green-600'}`}>ออนไลน์</span>
                    </div>
                </div>
            </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="font-bold uppercase tracking-wider text-sm">แชทใหม่</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>ประวัติการสนทนา</span>
            <div className="h-[1px] bg-gray-100 flex-1"></div>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center opacity-70">
                <div className="bg-gray-50 p-3 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                เริ่มการสนทนาใหม่ได้เลย
            </div>
          ) : (
            sessions.slice().reverse().map(session => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group border-l-[3px] ${
                  currentSessionId === session.id
                    ? 'bg-green-50 border-green-500 text-green-700 font-medium'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                 {currentSessionId === session.id ? (
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                 ) : (
                     <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-400"></div>
                 )}
                <span className="truncate">{session.title}</span>
              </button>
            ))
          )}
        </div>

        {/* Owner Admin Tools */}
        {user.username === 'Nice222' && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={handleFactoryReset}
              className="w-full text-xs flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-lg transition-colors uppercase font-bold tracking-wider border border-transparent hover:border-red-100"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
               ล้างข้อมูลถาวร
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;