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
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* User Profile Header */}
        <div className={`p-5 border-b-2 border-slate-800 ${user.username === 'Nice222' ? 'bg-slate-900' : 'bg-slate-900'}`}>
            <div className={`flex items-center gap-4 p-3 rounded-lg border shadow-inner ${user.username === 'Nice222' ? 'bg-slate-800 border-yellow-600/50' : 'bg-slate-800 border-slate-700'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-[0_0_10px_rgba(0,0,0,0.5)] ${user.username === 'Nice222' ? 'bg-yellow-500 border-2 border-white' : 'bg-slate-700 border-2 border-green-500'}`}>
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black uppercase italic tracking-wide truncate ${user.username === 'Nice222' ? 'text-yellow-400' : 'text-white'}`}>{user.name}</p>
                    <p className="text-xs text-slate-400 truncate font-mono">@{user.username}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_5px] ${user.username === 'Nice222' ? 'bg-yellow-500 shadow-yellow-500' : 'bg-green-500 shadow-green-500'}`}></span>
                        <span className={`text-[10px] font-bold uppercase ${user.username === 'Nice222' ? 'text-yellow-500' : 'text-green-500'}`}>ออนไลน์</span>
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
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-500 transition-all shadow-lg active:translate-y-0.5 border-b-4 border-green-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="font-bold uppercase tracking-wider">แชทใหม่</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          <div className="px-2 py-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>ประวัติการสนทนา</span>
            <div className="h-[1px] bg-slate-700 flex-1"></div>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm flex flex-col items-center opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                ยังไม่มีประวัติ
            </div>
          ) : (
            sessions.slice().reverse().map(session => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 group border-l-4 ${
                  currentSessionId === session.id
                    ? 'bg-slate-800 border-green-500 text-white shadow-md'
                    : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded bg-slate-700 ${currentSessionId === session.id ? 'text-green-400' : 'text-slate-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                </div>
                <span className="truncate font-medium">{session.title}</span>
              </button>
            ))
          )}
        </div>

        {/* Owner Admin Tools */}
        {user.username === 'Nice222' && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button 
              onClick={handleFactoryReset}
              className="w-full text-xs flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded transition-colors uppercase font-bold tracking-wider"
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