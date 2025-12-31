import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { Message, Sender, Attachment } from "../types";

// Initialize lazily to prevent "process is not defined" errors during initial load
let aiInstance: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiInstance) {
    let apiKey = '';
    try {
      // Safely access process.env
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      console.warn("Environment variable access failed, using empty key.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Helper to convert internal Message type to Gemini Content type for history
const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages.filter(m => !m.isStreaming).map(m => ({
    role: m.sender === Sender.User ? 'user' : 'model',
    parts: [
      { text: m.text },
      ...(m.attachments || []).map(att => ({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      }))
    ]
  }));
};

/**
 * Creates a chat session, optionally restoring history.
 */
export const createChatSession = (previousHistory: Message[] = []): Chat => {
  const history = mapMessagesToHistory(previousHistory);
  
  return getAiClient().chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: "You are a helpful, polite, and knowledgeable AI assistant. You are conversing with a Thai user. Respond in Thai unless asked otherwise. You can see images and hear audio if provided. If asked who created you, answer: 'คุณไนซ์ ณัฐวรโชติ ประเสริฐศรี และ Ai Google ครับ'.",
    },
  });
};

/**
 * Prepares the message payload for sendMessageStream
 */
export const prepareMessagePayload = (text: string, attachments: Attachment[]): Part[] => {
  const parts: Part[] = [];
  
  if (text) {
    parts.push({ text });
  }

  attachments.forEach(att => {
    parts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.data
      }
    });
  });

  return parts;
};