import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
    MessageSquare, X, Send, Bot,
    Phone, FileText, ShieldAlert, Database, HelpCircle
} from 'lucide-react';

const socket = io('http://localhost:5000');

const ChatWidget = ({ userType, userName, userEmail }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            text: userType === 'admin'
                ? `Welcome, Administrator. I am **DIVA Intelligence**. I am ready to assist with technical auditing, tamper detection, and record management.`
                : `Hello ${userName}! I am **DIVA**, your AI guide for **Yuvakshetra College**. How can I assist you with admissions or verification today?`,
            sender: 'system'
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const theme = useMemo(() => {
        const isAdmin = userType === 'admin';
        return {
            primary: isAdmin ? '#6366f1' : '#f97316',
            primaryDark: isAdmin ? '#4338ca' : '#ea580c',
            bg: isAdmin ? '#f8fafc' : '#fff7ed',
            shadow: isAdmin ? 'rgba(99, 102, 241, 0.4)' : 'rgba(249, 115, 22, 0.3)',
            glass: 'rgba(255, 255, 255, 0.92)'
        };
    }, [userType]);

    // ✅ DYNAMIC QUICK ACTIONS: Switches automatically based on User Role
    const quickActions = useMemo(() => {
        if (userType === 'admin') {
            return [];
        }
        return [
            { l: "Courses", i: FileText, t: "What courses are there?" },
            { l: "Contact", i: Phone, t: "College contact info" }
        ];
    }, [userType]);

    useEffect(() => {
        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
            setIsTyping(false);
        });
        return () => socket.off('receive_message');
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = useCallback((textOverride = null) => {
        const textToSend = textOverride || inputText;
        if (!textToSend.trim()) return;

        setMessages((prev) => [...prev, { id: Date.now(), text: textToSend, sender: 'user' }]);
        setInputText("");
        setIsTyping(true);

        socket.emit('send_message', { message: textToSend, userType, userName, userEmail });
    }, [inputText, userType, userName, userEmail]);

    const renderMessage = (text) => {
        if (!text) return null;
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/### (.*?)(?:\n|$)/g, `<h3 style="margin: 12px 0 6px 0; font-size: 14px; color: ${theme.primaryDark}; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 900;">$1</h3>`);
        formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" target="_blank" style="color: ${theme.primary}; font-weight: 700; text-decoration: none; border-bottom: 2px solid ${theme.primary}22;">$1</a>`);
        formatted = formatted.replace(/- (.*?)(?:\n|$)/g, '<div style="margin-bottom: 6px; display: flex; gap: 8px; align-items: flex-start;"><span style="color:' + theme.primary + '">◈</span><span>$1</span></div>');
        formatted = formatted.replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {isOpen && (
                <div style={{
                    width: '380px', height: '620px',
                    background: theme.glass, borderRadius: '32px',
                    boxShadow: `0 30px 60px -12px ${theme.shadow}, inset 0 0 0 1px rgba(255,255,255,0.5)`,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    backdropFilter: 'blur(16px)', marginBottom: '20px',
                    animation: 'chatReveal 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                    border: '1px solid rgba(0,0,0,0.05)'
                }}>

                    {/* ✅ FIXED & ALIGNED HEADER */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                        padding: '24px 20px', // ✅ Adjusted padding for alignment
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center', // ✅ Centers items vertically
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 2 }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '15px' }}>
                                <Bot size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '900', fontSize: '17px', letterSpacing: '-0.5px' }}>DIVA Intelligence</div>
                                <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span className="pulse-dot"></span> {userType === 'admin' ? 'SECURE ADMIN CONSOLE' : 'OFFICIAL ASSISTANT'}
                                </div>
                            </div>
                        </div>

                        {/* ✅ ALIGNED CLOSE BUTTON */}
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                zIndex: 2,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', scrollbarWidth: 'none' }}>
                        {messages.map((msg, idx) => (
                            <div key={msg.id} style={{
                                display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                animation: `messageSlide 0.4s ease-out forwards`, opacity: 0
                            }}>
                                <div style={{
                                    maxWidth: '85%', padding: '14px 18px', borderRadius: '22px', fontSize: '14px', lineHeight: '1.6',
                                    background: msg.sender === 'user' ? theme.primary : 'white',
                                    color: msg.sender === 'user' ? 'white' : '#1e293b',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '22px',
                                    borderBottomLeftRadius: msg.sender === 'user' ? '22px' : '4px',
                                }}>
                                    {msg.sender === 'user' ? msg.text : renderMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="typing-indicator" style={{ color: theme.primary }}>Analyzing...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* DYNAMIC QUICK CHIPS */}
                    <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {quickActions.map((q, i) => (
                            <button key={i} onClick={() => handleSendMessage(q.t)} className="quick-chip" style={{
                                flex: '0 0 auto', padding: '10px 16px', borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.05)', background: 'white',
                                color: '#475569', fontSize: '11px', fontWeight: '800',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all 0.3s'
                            }}>
                                <q.i size={14} color={theme.primary} /> {q.l}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '20px', background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '12px' }}>
                        <input
                            type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={userType === 'admin' ? "Consult system data..." : "Ask DIVA anything..."}
                            style={{ flex: 1, border: 'none', background: '#f1f5f9', padding: '14px 20px', borderRadius: '15px', outline: 'none', fontSize: '13.5px', fontWeight: '600' }}
                        />
                        <button onClick={() => handleSendMessage()} disabled={!inputText.trim()} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '14px', width: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '70px', height: '70px', borderRadius: '24px',
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                    color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: isHovered ? `0 25px 40px ${theme.shadow}` : `0 15px 30px ${theme.shadow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'rotate(180deg) scale(0.9)' : (isHovered ? 'translateY(-12px) scale(1.1)' : 'translateY(0)'),
                }}
            >
                {isOpen ? <X size={32} /> : <MessageSquare size={32} fill="currentColor" />}
                {!isOpen && <div className="button-glow" style={{ background: theme.primary }}></div>}
            </button>

            <style>{`
                @keyframes chatReveal { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes messageSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .pulse-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; display: inline-block; animation: dotPulse 2s infinite; }
                @keyframes dotPulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
                .button-glow { position: absolute; width: 100%; height: 100%; border-radius: 24px; opacity: 0.4; z-index: -1; animation: glowPulse 3s infinite; }
                @keyframes glowPulse { 0% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
                .quick-chip:hover { transform: translateY(-3px); background: ${theme.primary} !important; color: white !important; }
                .typing-indicator { font-size: 11px; font-weight: 800; text-transform: uppercase; animation: blink 1.5s infinite; }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
};

export default ChatWidget;