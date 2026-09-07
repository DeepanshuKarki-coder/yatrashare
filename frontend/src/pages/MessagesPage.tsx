import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  MessageSquare,
  Users,
  Search,
  Check,
  CheckCheck
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/messages/conversations');
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const data = await api.get(`/api/messages/conversations/${convId}/messages`);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);

      const socket = getSocket();
      if (socket) {
        socket.emit('join_conversation', activeConvId);

        const handleNewMessage = (msg: any) => {
          if (msg.conversation_id === activeConvId || msg.conversationId === activeConvId) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
          }
        };

        const handleTyping = (data: any) => {
          setOtherUserTyping(data.isTyping);
          if (data.isTyping) {
            setTimeout(() => setOtherUserTyping(false), 3000);
          }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);

        return () => {
          socket.emit('leave_conversation', activeConvId);
          socket.off('new_message', handleNewMessage);
          socket.off('user_typing', handleTyping);
        };
      }
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConvId) return;

    const content = inputMessage.trim();
    setInputMessage('');

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId: activeConvId, content });
    } else {
      // REST fallback
      try {
        const msg = await api.post('/api/messages/messages', {
          conversationId: activeConvId,
          content,
        });
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        // Ignore
      }
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[75vh] flex">
        {/* Left: Conversations Sidebar */}
        <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-brand-600" />
              Direct Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active conversations yet. Book a ride or accept a passenger to start chatting.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConvId;
                const otherName = c.other_user_name || 'Travel Participant';
                const otherAvatar =
                  c.other_user_avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=0d9488&color=fff`;

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`p-3.5 flex items-center space-x-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img src={otherAvatar} alt={otherName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{otherName}</span>
                        {c.unread_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.last_message_content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Stream */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      activeConv.other_user_avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.other_user_name || 'User')}&background=0d9488&color=fff`
                    }
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{activeConv.other_user_name || 'Traveler'}</h3>
                    <span className="text-[10px] text-emerald-600 font-semibold block">Connected via YatraShare</span>
                  </div>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMine = m.sender_id === user?.id || m.senderId === user?.id;

                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                          isMine
                            ? 'bg-brand-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{m.content}</p>
                        <span
                          className={`text-[9px] mt-1 block text-right ${
                            isMine ? 'text-brand-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(m.created_at || m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing notice */}
              {otherUserTyping && (
                <div className="px-4 py-1 text-[11px] text-slate-400 italic">
                  {activeConv.other_user_name} is typing...
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 font-semibold shadow-sm disabled:opacity-40 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1" />
              <p className="text-xs">Select a conversation on the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
