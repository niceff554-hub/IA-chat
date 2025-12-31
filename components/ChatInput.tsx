import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  onCameraRequest: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onCameraRequest, disabled }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
            const base64String = (event.target.result as string).split(',')[1];
            setAttachments(prev => [...prev, {
                type: 'image',
                mimeType: file.type,
                data: base64String
            }]);
        }
      };
      
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = '';
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' }); 
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            onSend("ส่งข้อความเสียง", [{
                type: 'audio',
                mimeType: 'audio/webm',
                data: base64data
            }]);
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic error:", err);
        alert("ไม่สามารถเข้าถึงไมโครโฟนได้");
      }
    }
  };

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 w-full z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto px-2">
              {attachments.map((att, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 group flex-shrink-0 shadow-sm">
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        className="w-full h-full object-cover" 
                        alt="attachment" 
                      />
                      <button 
                        onClick={() => removeAttachment(i)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      </button>
                  </div>
              ))}
          </div>
      )}

      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200">
        {/* File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
        />
        
        {/* Action Buttons */}
        <div className="flex gap-1">
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="แนบรูปภาพ"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>
            <button 
                onClick={onCameraRequest}
                disabled={disabled}
                className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="ถ่ายรูป"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>

        {/* Text Area */}
        <div className="flex-1 bg-transparent">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 text-gray-800 placeholder-gray-400 disabled:opacity-50"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Mic & Send Buttons */}
        <div className="flex gap-2">
            {input.trim() || attachments.length > 0 ? (
                <button
                    onClick={() => handleSubmit()}
                    disabled={disabled}
                    className="p-3 rounded-full bg-green-600 text-white hover:bg-green-500 shadow-md transform hover:scale-105 active:scale-95 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                </button>
            ) : (
                <button
                    onClick={toggleRecording}
                    disabled={disabled}
                    className={`p-3 rounded-full transition-all duration-300 ${
                        isRecording 
                        ? 'bg-red-500 text-white shadow-red-200 shadow-lg animate-pulse' 
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;