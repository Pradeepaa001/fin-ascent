"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { createClient } from "@supabase/supabase-js";
import { backendUrl } from "@/lib/apiBase";

// Ensure Supabase URL and Key are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PersonalizationPage() {
  const [activeTab, setActiveTab] = useState("guided");
  const [user, setUser] = useState(null);
  
  // Weights State
  const [weights, setWeights] = useState({
    penalty_weight: 1.0,
    relationship_weight: 1.0,
    flexibility_weight: 1.0,
    priority_entities: []
  });

  // Decision State
  const [applyPersonalization, setApplyPersonalization] = useState(false);
  const [baseDecisions, setBaseDecisions] = useState([]);
  const [personalizedDecisions, setPersonalizedDecisions] = useState([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  
  // UI States
  const [chatLog, setChatLog] = useState([{ sender: "bot", text: "How do you feel about generic bank loans compared to late payments?" }]);
  const [freeText, setFreeText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchDecisions(user.id);
      } else {
        // Fallback for demo if not logged in
        fetchDecisions("demo_user");
      }
    });
  }, []);

  const fetchDecisions = async (userId) => {
    setLoadingDecisions(true);
    try {
      const res = await fetch(backendUrl(`/api/decision/${userId}`));
      const data = await res.json();
      setBaseDecisions(data.base || []);
      setPersonalizedDecisions(data.personalized || []);
    } catch (error) {
      console.log("Failed to fetch decisions", error);
      setErrorMessage("Could not connect to the Python backend to fetch decisions. Please start FastAPI on port 8000.");
    }
    setLoadingDecisions(false);
  };

  const handleParseText = async (text) => {
    setIsProcessing(true);
    try {
      const res = await fetch(backendUrl("/api/personalization/parse"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setWeights(data);
    } catch (error) {
      console.log(error);
      setErrorMessage("Could not connect to the Python backend to parse text. Please start FastAPI on port 8000.");
    }
    setIsProcessing(false);
  };

  const handleSaveProfile = async () => {
    setIsProcessing(true);
    const userId = user ? user.id : "demo_user";
    try {
      await fetch(backendUrl("/api/personalization/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...weights })
      });
      // Refresh decisions after updating weights
      await fetchDecisions(userId);
    } catch (err) {
      console.log(err);
      setErrorMessage("Could not connect to the Python backend to save profile. Please start FastAPI on port 8000.");
    }
    setIsProcessing(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWeights(prev => ({
      ...prev,
      [name]: name === "priority_entities" ? value.split(",").map(s => s.trim()) : parseFloat(value)
    }));
  };

  const currentDecisions = applyPersonalization ? personalizedDecisions : baseDecisions;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>FinAscent Personalization Engine</h1>
        <p>Adapt your financial decisions based on your unique behavior.</p>
        {errorMessage && (
          <div style={{ color: '#d32f2f', margin: '15px auto', padding: '12px', backgroundColor: '#ffebee', borderRadius: '6px', maxWidth: '600px', fontWeight: 'bold' }}>
            ⚠️ {errorMessage}
          </div>
        )}
      </header>

      <div className={styles.grid}>
        {/* LEFT COLUMN: Input Modes */}
        <div className={styles.inputSection}>
          <div className={styles.tabs}>
            <button className={activeTab === "guided" ? styles.activeTab : ""} onClick={() => setActiveTab("guided")}>Guided Chat</button>
            <button className={activeTab === "text" ? styles.activeTab : ""} onClick={() => setActiveTab("text")}>Free Text</button>
            <button className={activeTab === "form" ? styles.activeTab : ""} onClick={() => setActiveTab("form")}>Form</button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "guided" && (
              <div className={styles.chatMode}>
                <div className={styles.chatBox}>
                  {chatLog.map((log, i) => (
                    <div key={i} className={log.sender === "bot" ? styles.botBubble : styles.userBubble}>
                      {log.text}
                    </div>
                  ))}
                </div>
                <div className={styles.chatOptions}>
                  <button onClick={() => {
                    const ans = "Bank loans are top priority, avoid penalties.";
                    setChatLog([...chatLog, { sender: "user", text: ans }]);
                    handleParseText(ans);
                  }}>Bank loans top priority</button>
                  <button onClick={() => {
                    const ans = "I don't mind delaying banks, but pay vendors first.";
                    setChatLog([...chatLog, { sender: "user", text: ans }]);
                    handleParseText(ans);
                  }}>Pay vendors first</button>
                </div>
              </div>
            )}

            {activeTab === "text" && (
              <div className={styles.textMode}>
                <textarea 
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="E.g. I hate penalties. Avoid them. Always pay my suppliers first."
                  rows={4}
                />
                <button onClick={() => handleParseText(freeText)} disabled={isProcessing} className={styles.actionBtn}>
                  {isProcessing ? "Processing (AI)..." : "Analyze Preferences"}
                </button>
              </div>
            )}

            {activeTab === "form" && (
              <div className={styles.formMode}>
                <label>
                  Penalty Sensitivity (Weight: {weights.penalty_weight})
                  <input type="range" min="0" max="2" step="0.1" name="penalty_weight" value={weights.penalty_weight} onChange={handleFormChange} />
                </label>
                <label>
                  Relationship Priority (Weight: {weights.relationship_weight})
                  <input type="range" min="0" max="2" step="0.1" name="relationship_weight" value={weights.relationship_weight} onChange={handleFormChange} />
                </label>
                <label>
                  Flexibility (Weight: {weights.flexibility_weight})
                  <input type="range" min="0" max="2" step="0.1" name="flexibility_weight" value={weights.flexibility_weight} onChange={handleFormChange} />
                </label>
                <label>
                  Priority Entities (comma separated)
                  <input type="text" name="priority_entities" value={weights.priority_entities.join(", ")} onChange={handleFormChange} />
                </label>
              </div>
            )}
          </div>

          {/* Understood Preferences Summary */}
          <div className={styles.summaryBox}>
            <h3>AI Preference Summary</h3>
            <pre>{JSON.stringify(weights, null, 2)}</pre>
            <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Output & Comparison */}
        <div className={styles.decisionSection}>
          <div className={styles.toggleHeader}>
            <label className={styles.switch}>
              <input type="checkbox" checked={applyPersonalization} onChange={() => setApplyPersonalization(!applyPersonalization)} />
              <span className={styles.slider}></span>
            </label>
            <h2>{applyPersonalization ? "Personalized Mode ON" : "Default Mode"}</h2>
          </div>

          <p className={styles.infoText}>
            Comparing scores {applyPersonalization ? "WITH" : "WITHOUT"} personalization applied.
          </p>

          <div className={styles.cardsContainer}>
            {loadingDecisions ? <p>Loading decisions...</p> : currentDecisions.map((decision, idx) => {
              const baseD = baseDecisions.find(b => b.id === decision.id) || decision;
              const persD = personalizedDecisions.find(p => p.id === decision.id) || decision;
              
              const isDifferent = baseD.score !== persD.score;

              return (
                <div key={decision.id} className={`${styles.decisionCard} ${applyPersonalization && isDifferent ? styles.highlightedCard : ''}`}>
                  <div className={styles.cardHeader}>
                    <h4>{decision.entity_name}</h4>
                    <span className={styles.scoreBadge}>Score: {decision.score}</span>
                  </div>
                  <p className={styles.amount}>Amount: ${decision.amount}</p>
                  <p className={styles.reasoning}>{decision.reasoning}</p>
                  
                  {applyPersonalization && isDifferent && (
                    <div className={styles.comparisonNote}>
                      Base Score was {baseD.score}. Changed by user weights!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
