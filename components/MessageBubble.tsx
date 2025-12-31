import React, { useState } from 'react';
import { Message, Sender } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = 'th-TH';
        
        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(v => v.lang.includes('th'));
        if (thaiVoice) utterance.voice = thaiVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    }
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up group mb-2`}>
        {/* Avatar for AI */}
        {!isUser && (
            <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xl mr-3 self-start shadow-sm z-10 text-green-700">
                🤖
            </div>
        )}
        
      <div
        className={`max-w-[85%] md:max-w-[75%] lg:max-w-[60%] px-5 py-4 shadow-sm text-base leading-relaxed break-words relative ${
          isUser
            ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl rounded-tr-sm border border-green-500'
            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm shadow-md'
        }`}
      >
        {/* Decorative corner for User */}
        {isUser && <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 opacity-50 clip-path-triangle"></div>}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
                {message.attachments.map((att, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                        {att.type === 'image' && (
                            <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="attachment" 
                                className="max-w-full h-auto max-h-72 object-cover bg-gray-50"
                            />
                        )}
                        {att.type === 'audio' && (
                           <div className={`flex items-center gap-3 p-3 rounded-lg ${isUser ? 'bg-green-800/50' : 'bg-gray-100'}`}>
                                <div className={`p-2 rounded-full ${isUser ? 'bg-white text-green-600' : 'bg-green-600 text-white'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className={`text-sm font-bold opacity-90 uppercase tracking-wide ${isUser ? 'text-white' : 'text-gray-700'}`}>เสียงบันทึก</span>
                           </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* Text Content */}
        <div className="whitespace-pre-wrap font-medium">
            {message.text}
            {message.isStreaming && (
                <span className="inline-block w-2.5 h-4 ml-1 bg-green-500 animate-pulse align-middle skew-x-12"></span>
            )}
        </div>
        
        {/* Footer: Timestamp & Actions */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-transparent group-hover:border-gray-100/10">
            {/* Speak Button for AI */}
            {!isUser && !message.isStreaming && (
                <button 
                    onClick={handleSpeak}
                    className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${
                        isSpeaking 
                        ? 'bg-green-100 text-green-700 animate-pulse' 
                        : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                    }`}
                >
                    {isSpeaking ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            หยุด
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            ฟัง
                        </>
                    )}
                </button>
            )}
            
            {/* Spacer if no button */}
            {(isUser || message.isStreaming) && <div></div>}

            <div className={`text-[10px] font-mono tracking-wider ${isUser ? 'text-green-200' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;