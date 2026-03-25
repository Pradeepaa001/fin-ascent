"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    { 
      role: "bot", 
      content: "Hello! I am your FinAscent Context-Aware Financial Assistant. You can ask me about your current risks, what to prioritize, or any other financial decisions using your real data."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applyPersonalization, setApplyPersonalization] = useState(true);
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
            message: query,
            apply_personalization: applyPersonalization
         })
      });

      if (!res.ok) throw new Error("API failed");
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", content: data.reply, data_used: data.data_used }]);
    } catch (err) {
      console.log(err);
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "Sorry, I couldn't connect to the backend server to fulfill this request. Is your FastAPI server running on port 8000?" 
      }]);
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Context-Aware Financial Assistant</h1>
        <div className={styles.toggleWrapper}>
          <label className={styles.switch}>
            <input type="checkbox" checked={applyPersonalization} onChange={() => setApplyPersonalization(!applyPersonalization)} />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.toggleLabel}>Apply My Personalization Rules</span>
        </div>
      </header>
      
      <div className={styles.chatWindow}>
        <div className={styles.messageList}>
          {messages.map((msg, i) => (
             <div key={i} className={msg.role === "user" ? styles.userRow : styles.botRow}>
                <div className={msg.role === "user" ? styles.userBubble : styles.botBubble}>
                   <div className={styles.content}>{msg.content}</div>
                   {msg.data_used && (
                      <details className={styles.debugSection}>
                         <summary>🔍 View Data Used (Deterministic Context Engine)</summary>
                         <pre>{JSON.stringify(msg.data_used, null, 2)}</pre>
                      </details>
                   )}
                </div>
             </div>
          ))}
          {isLoading && (
            <div className={styles.botRow}>
              <div className={styles.botBubble}>Fetching real data & prioritizing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input 
             type="text" 
             value={inputMessage} 
             onChange={e => setInputMessage(e.target.value)} 
             placeholder="e.g. Am I at risk of running out of money if I pay Alpha Corp today?"
             disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !inputMessage.trim()}>Send Query</button>
        </form>
      </div>
    </div>
  );
}
