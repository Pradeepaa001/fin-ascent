"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UnifiedAssistantPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    { 
      role: "bot", 
      content: "Hello! I am your FinAscent Financial Assistant. Ask me a question, or tell me your financial priorities (e.g. 'I want to avoid penalties at all costs' or 'Prioritize my vendor payments') and I'll adapt the decision engine automatically behind the scenes!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const query = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/query", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            user_id: user ? user.id : "demo_user",
            message: query
         })
      });

      if (!res.ok) throw new Error("API failed");
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", content: data.reply, data_used: data.data_used }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "Sorry, I couldn't connect to the backend server. Is your FastAPI server running on port 8000?" 
      }]);
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatPanel}>
         <header className={styles.chatHeader}>
         <h1>Assistant Conversation</h1>
         </header>
         
         <div className={styles.chatWindow}>
         <div className={styles.messageList}>
            {messages.map((msg, i) => (
               <div key={i} className={msg.role === "user" ? styles.userRow : styles.botRow}>
                  <div className={msg.role === "user" ? styles.userBubble : styles.botBubble}>
                     <div className={styles.content}>{msg.content}</div>
                     {msg.data_used && (
                        <details className={styles.debugSection}>
                           <summary>🔍 View Mathematical Context Evaluated</summary>
                           <pre>{JSON.stringify(msg.data_used, null, 2)}</pre>
                        </details>
                     )}
                  </div>
               </div>
            ))}
            {isLoading && (
               <div className={styles.botRow}>
               <div className={styles.botBubble}>Analyzing your request natively...</div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>
         
         <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <input 
               type="text" 
               value={inputMessage} 
               onChange={e => setInputMessage(e.target.value)} 
               placeholder="Ask for advice, e.g. What should I prioritize paying off?"
               disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>Send Query</button>
         </form>
         </div>
      </div>
    </div>
  );
}
