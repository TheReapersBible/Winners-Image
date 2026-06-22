import { useState, useEffect, useRef } from "react";
import posthog from "./analytics";

/* ========================
   STARFIELD
======================== */
function StarField() {
  const starsRef = useRef([]);
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: 120 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random()
    }));
  }
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      {starsRef.current.map((s, i) => (
        <div key={i} style={{
          position: "absolute", top: s.top + "%", left: s.left + "%",
          width: s.size, height: s.size, background: "white",
          borderRadius: "50%", opacity: s.opacity
        }} />
      ))}
    </div>
  );
}

/* ========================
   FUTURE SELF ONBOARDING
======================== */
function FutureSelfOnboarding({ onComplete }) {
  const questions = [
    { field: "becoming", question: "Who are you becoming?", placeholder: "Describe the person you're evolving into..." },
    { field: "beliefs", question: "What does that person believe about themselves?", placeholder: "Their core beliefs..." },
    { field: "habits", question: "What habits do they live by daily?", placeholder: "The non-negotiables..." },
    { field: "building", question: "What are they building or working toward?", placeholder: "Their mission..." },
    { field: "pain", question: "What pain or version of yourself are you leaving behind?", placeholder: "What you're walking away from..." },
    { field: "affirmations", question: "Give me 3 affirmations for this person. Say them like they're already true.", placeholder: "I am... I have... I create..." }
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");

  function handleNext() {
    if (!value.trim()) return;
    const updated = { ...answers, [questions[step].field]: value };
    setAnswers(updated);
    setValue("");
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      onComplete(updated);
    }
  }

  const q = questions[step];
  const progress = ((step) / questions.length) * 100;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
      color: "white", padding: "24px 20px", position: "relative", overflow: "hidden",
      fontFamily: "system-ui, sans-serif"
    }}>
      <StarField />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 480 }}>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            <span>Building Your Future Self</span>
            <span>{step + 1} of {questions.length}</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: progress + "%", background: "linear-gradient(90deg,#ff8c00,#ff2e63)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Question */}
        <h2 style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 24, letterSpacing: -0.5 }}>
          {q.question}
        </h2>

        {/* Input */}
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={q.placeholder}
          rows={4}
          autoFocus
          style={{
            width: "100%", boxSizing: "border-box", padding: "16px",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)", color: "white",
            fontSize: 16, fontFamily: "system-ui, sans-serif",
            resize: "none", outline: "none", lineHeight: 1.6,
            marginBottom: 16
          }}
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleNext(); }}
        />

        <button onClick={handleNext} style={{
          width: "100%", padding: "16px", fontSize: 16, fontWeight: 700,
          borderRadius: 50, border: "none",
          background: value.trim() ? "linear-gradient(45deg,#ff8c00,#ff2e63)" : "rgba(255,255,255,0.1)",
          color: value.trim() ? "white" : "rgba(255,255,255,0.3)",
          cursor: value.trim() ? "pointer" : "default", letterSpacing: 1
        }}>
          {step + 1 === questions.length ? "Complete My Profile 🔥" : "Continue →"}
        </button>

        {step > 0 && (
          <button onClick={() => { setStep(step - 1); setValue(""); }} style={{
            width: "100%", marginTop: 12, padding: "12px",
            background: "transparent", border: "none",
            color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer"
          }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

/* ========================
   MAIN APP
======================== */
export default function App() {
  const TABS = { CHAT: "chat", FUTURE_SELF: "future_self", AFFIRMATIONS: "affirmations", CHECKIN: "checkin" };

  const [tab, setTab] = useState(TABS.CHAT);
  const [futureSelf, setFutureSelf] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [actAsIfMode, setActAsIfMode] = useState(false);
  const [affirmations, setAffirmations] = useState([]);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [checkIn, setCheckIn] = useState({ matched: "", proved: "", fell: "", tomorrow: "" });
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInDone, setCheckInDone] = useState(false);
  const [alignmentScore, setAlignmentScore] = useState(null);

  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    posthog.capture("app_opened");
    const saved = localStorage.getItem("futureSelf");
    const savedAffirmations = localStorage.getItem("affirmations");
    if (saved) { setFutureSelf(JSON.parse(saved)); setOnboarded(true); }
    if (savedAffirmations) setAffirmations(JSON.parse(savedAffirmations));
  }, []);

  useEffect(() => {
    if (onboarded && messages.length === 0) {
      const greeting = futureSelf
        ? `You told me you're becoming ${futureSelf.becoming}. I'm holding you to that. What's on your mind today?`
        : "Aye... I see potential in you already. Talk to me.";
      setMessages([{ sender: "ai", text: greeting, media: [] }]);
    }
  }, [onboarded]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleOnboardingComplete(answers) {
    const profile = { ...answers, createdAt: new Date().toISOString() };
    setFutureSelf(profile);
    setOnboarded(true);
    if (answers.affirmations) {
      const parsed = answers.affirmations.split(/[.!\n]/).map(s => s.trim()).filter(Boolean);
      setAffirmations(parsed);
      localStorage.setItem("affirmations", JSON.stringify(parsed));
    }
    localStorage.setItem("futureSelf", JSON.stringify(profile));
  }

  /* ========================
     VOICE
  ======================== */
  async function speak(text) {
    try {
      const res = await fetch("https://ai-backend-fyyw.onrender.com/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Voice failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      new Audio(url).play();
    } catch {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.88; u.pitch = 0.75;
      window.speechSynthesis.speak(u);
    }
  }

  /* ========================
     RECORDING
  ======================== */
  async function startRecording() {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => audioChunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setMessages(prev => [...prev, { sender: "user", text: null, media: [{ type: "audio", url }] }]);
      stream.getTracks().forEach(t => t.stop());
      sendMessageWithText("I just sent a voice message — respond with motivation and guidance based on who I'm becoming.");
    };
    mr.start();
    setIsRecording(true);
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setIsRecording(false); }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setMessages(prev => [...prev, { sender: "user", text: null, media: [{ type, url }] }]);
    sendMessageWithText(`I just shared a ${type}. Respond with relevant insight tied to who I'm becoming.`);
  }

  /* ========================
     SEND MESSAGE
  ======================== */
  async function sendMessage() {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessageWithText(text);
  }

  async function sendMessageWithText(text) {
    setMessages(prev => [...prev, { sender: "user", text, media: [] }]);
    try {
      const res = await fetch("https://ai-backend-fyyw.onrender.com/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, futureSelf, actAsIfMode })
      });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const data = await res.json();
      setMessages(prev => [...prev, {
        sender: "ai", text: data.reply, media: [
          ...(data.images || []).map(i => ({ type: "image", url: i.url })),
          ...(data.videos || []).map(v => ({ type: "video", url: v.url }))
        ]
      }]);
      setTimeout(() => speak(data.reply), 200);
    } catch {
      setMessages(prev => [...prev, { sender: "ai", text: "Something went wrong. Try again.", media: [] }]);
    }
  }

  /* ========================
     CHECK IN FLOW
  ======================== */
  const checkInQuestions = [
    { key: "matched", q: "Did your actions today match who you're becoming? Be honest." },
    { key: "proved", q: "What did you do today that proved you're changing?" },
    { key: "fell", q: "Where did you fall short? No judgment — just honesty." },
    { key: "tomorrow", q: "What's the one move you're making tomorrow, no excuses?" }
  ];

  async function submitCheckIn() {
    const score = Math.round(
      (checkIn.proved.length > 10 ? 25 : 0) +
      (checkIn.matched.toLowerCase().includes("yes") ? 25 : 10) +
      (checkIn.tomorrow.length > 10 ? 25 : 0) +
      (checkIn.fell.length > 0 ? 15 : 0)
    );
    setAlignmentScore(score);
    setCheckInDone(true);
    await sendMessageWithText(`Daily check-in: Matched my future self: ${checkIn.matched}. What I proved: ${checkIn.proved}. Where I fell short: ${checkIn.fell}. Tomorrow's move: ${checkIn.tomorrow}. Give me real feedback on this.`);
    setTab(TABS.CHAT);
  }

  /* ========================
     AFFIRMATIONS
  ======================== */
  async function addAffirmation() {
    if (!newAffirmation.trim()) return;
    const updated = [...affirmations, newAffirmation.trim()];
    setAffirmations(updated);
    localStorage.setItem("affirmations", JSON.stringify(updated));
    setNewAffirmation("");
    await sendMessageWithText(`Rewrite this affirmation to be stronger and more emotional: "${newAffirmation}"`);
    setTab(TABS.CHAT);
  }

  /* ========================
     SHOW ONBOARDING IF NOT DONE
  ======================== */
  if (!onboarded) {
    return <FutureSelfOnboarding onComplete={handleOnboardingComplete} />;
  }

  /* ========================
     RENDER MEDIA
  ======================== */
  function renderMedia(media) {
    return media.map((med, idx) => {
      if (med.type === "image") return (
        <div key={idx} style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", marginTop: 8 }}
          onClick={() => window.open(med.url, "_blank")}>
          <img src={med.url} alt="" style={{ width: "100%", display: "block", borderRadius: 16 }}
            onError={e => e.target.style.display = "none"} />
        </div>
      );
      if (med.type === "video") return (
        <div key={idx} style={{ borderRadius: 12, overflow: "hidden", background: "#000", marginTop: 8 }}>
          <video controls playsInline style={{ width: "100%", display: "block", borderRadius: 12, maxHeight: 260 }}
            onError={e => e.target.style.display = "none"}>
            <source src={med.url} type="video/mp4" />
          </video>
        </div>
      );
      if (med.type === "audio") return (
        <audio key={idx} controls src={med.url} style={{ width: "100%", marginTop: 8 }} />
      );
      return null;
    });
  }

  /* ========================
     TAB: CHAT
  ======================== */
  function ChatTab() {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", zIndex: 2 }}>

        {/* Act As If Banner */}
        {actAsIfMode && (
          <div style={{
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
            padding: "10px 16px", textAlign: "center",
            fontSize: 13, fontWeight: 700, letterSpacing: 1
          }}>
            ⚡ ACT AS IF MODE — You are your future self today
          </div>
        )}

        {/* Messages */}
        <div ref={chatRef} style={{
          flex: 1, overflowY: "auto", padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 12
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column",
              alignItems: m.sender === "user" ? "flex-end" : "flex-start"
            }}>
              {m.text && (
                <div style={{
                  background: m.sender === "user"
                    ? "linear-gradient(45deg,#ff8c00,#ff2e63)"
                    : "rgba(255,255,255,0.12)",
                  padding: "12px 16px", borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  maxWidth: "82%", color: "white", fontSize: 15, lineHeight: 1.55,
                  backdropFilter: "blur(8px)"
                }}>
                  {m.text}
                </div>
              )}
              {m.media?.length > 0 && (
                <div style={{ maxWidth: "82%" }}>
                  {renderMedia(m.media)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick commands */}
        <div style={{ padding: "0 12px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["act as if", "check my progress", "give me an affirmation"].map((cmd, i) => (
            <button key={i} onClick={() => sendMessageWithText(cmd)} style={{
              padding: "6px 14px", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)",
              fontSize: 12, cursor: "pointer"
            }}>{cmd}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "8px 12px 12px", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <input ref={fileInputRef} type="file" accept="image/*,video/*"
            style={{ display: "none" }} onChange={handleFile} />
          <button onClick={() => fileInputRef.current?.click()} style={iconBtn}>📎</button>

          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Talk to your future self..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "white",
              fontSize: 15, outline: "none", fontFamily: "system-ui, sans-serif"
            }} />

          <button onMouseDown={startRecording} onMouseUp={stopRecording}
            onTouchStart={startRecording} onTouchEnd={stopRecording} style={{
              ...iconBtn,
              background: isRecording ? "rgba(255,50,50,0.8)" : "rgba(255,255,255,0.1)"
            }}>
            {isRecording ? "⏹" : "🎙"}
          </button>

          <button onClick={sendMessage} style={{
            ...iconBtn,
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)"
          }}>➤</button>
        </div>

        {isRecording && (
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,100,100,0.9)", marginTop: 4 }}>
            Recording... release to send
          </p>
        )}
      </div>
    );
  }

  /* ========================
     TAB: FUTURE SELF
  ======================== */
  function FutureSelfTab() {
    const actAsIfActions = futureSelf ? [
      `Spend 30 minutes working on ${futureSelf.building || "your goals"} — no phone, no distractions`,
      `Say your affirmations out loud, then close your eyes and visualize being ${futureSelf.becoming || "your future self"} for 60 seconds`,
      `Do one thing today that the old version of you would have avoided`
    ] : [];

    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>

        {/* Profile Card */}
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,200,60,0.9)", marginBottom: 8, textTransform: "uppercase" }}>
            Your Future Self
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>
            {futureSelf?.becoming || "Not set yet"}
          </h2>
          {futureSelf?.beliefs && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "rgba(255,200,60,0.9)" }}>Believes:</strong> {futureSelf.beliefs}
            </p>
          )}
          {futureSelf?.building && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "rgba(255,200,60,0.9)" }}>Building:</strong> {futureSelf.building}
            </p>
          )}
          {futureSelf?.habits && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "rgba(255,200,60,0.9)" }}>Daily habits:</strong> {futureSelf.habits}
            </p>
          )}
          {futureSelf?.pain && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "rgba(255,200,60,0.9)" }}>Leaving behind:</strong> {futureSelf.pain}
            </p>
          )}
        </div>

        {/* Act As If Mode */}
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,200,60,0.9)", marginBottom: 8, textTransform: "uppercase" }}>
            Act As If Mode
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
            Today you are acting as the {futureSelf?.becoming || "best version of yourself"}. Here's what that person does today:
          </p>
          {actAsIfActions.map((action, i) => (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 12, marginBottom: 8,
              background: "rgba(255,255,255,0.06)", fontSize: 14,
              color: "rgba(255,255,255,0.85)", lineHeight: 1.5,
              borderLeft: "3px solid rgba(255,140,0,0.6)"
            }}>
              {action}
            </div>
          ))}
          <button onClick={() => {
            setActAsIfMode(!actAsIfMode);
            setTab(TABS.CHAT);
          }} style={{
            marginTop: 8, width: "100%", padding: "14px",
            borderRadius: 50, border: "none", fontWeight: 700,
            background: actAsIfMode ? "rgba(255,255,255,0.1)" : "linear-gradient(45deg,#ff8c00,#ff2e63)",
            color: "white", cursor: "pointer", fontSize: 15
          }}>
            {actAsIfMode ? "Deactivate Mode" : "⚡ Activate Act As If"}
          </button>
        </div>

        {/* Alignment Score */}
        {alignmentScore !== null && (
          <div style={card}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,200,60,0.9)", marginBottom: 8, textTransform: "uppercase" }}>
              Identity Alignment
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: alignmentScore >= 70 ? "#00c853" : alignmentScore >= 40 ? "#ff8c00" : "#ff2e63" }}>
              {alignmentScore}%
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
              {alignmentScore >= 70 ? "You moved like your future self today." : alignmentScore >= 40 ? "You showed up partially. Keep pushing." : "Tomorrow is a fresh start. Make it count."}
            </p>
          </div>
        )}

        {/* Reset Profile */}
        <button onClick={() => {
          localStorage.removeItem("futureSelf");
          localStorage.removeItem("affirmations");
          setFutureSelf(null);
          setOnboarded(false);
          setMessages([]);
        }} style={{
          padding: "12px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.15)",
          background: "transparent", color: "rgba(255,255,255,0.4)",
          fontSize: 13, cursor: "pointer"
        }}>
          Rebuild My Future Self Profile
        </button>
      </div>
    );
  }

  /* ========================
     TAB: AFFIRMATIONS
  ======================== */
  function AffirmationsTab() {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,200,60,0.9)", marginBottom: 4, textTransform: "uppercase" }}>
          Boss Affirmations
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
          Say these out loud every morning. Not in your head. Out loud.
        </p>

        {affirmations.map((a, i) => (
          <div key={i} style={{
            padding: "16px", borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 16, fontWeight: 600, lineHeight: 1.5, color: "white",
            borderLeft: "3px solid rgba(255,140,0,0.7)"
          }}>
            {a}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <input value={newAffirmation} onChange={e => setNewAffirmation(e.target.value)}
            placeholder='Add one — "I am..." "I have..." "I create..."'
            style={{
              width: "100%", boxSizing: "border-box", padding: "14px 16px",
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "white",
              fontSize: 15, outline: "none", marginBottom: 10,
              fontFamily: "system-ui, sans-serif"
            }} />
          <button onClick={addAffirmation} style={{
            width: "100%", padding: "14px", borderRadius: 50, border: "none",
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
            color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
          }}>
            Add + Let AI Make It Stronger
          </button>
        </div>
      </div>
    );
  }

  /* ========================
     TAB: CHECK IN
  ======================== */
  function CheckInTab() {
    if (checkInDone) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24, position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔥</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Check-in complete</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 24 }}>
            Your AI coach is processing your day. Check the chat for feedback.
          </p>
          <button onClick={() => setTab(TABS.CHAT)} style={{
            padding: "14px 32px", borderRadius: 50, border: "none",
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
            color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
          }}>
            See Feedback →
          </button>
        </div>
      );
    }

    const q = checkInQuestions[checkInStep];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 16px", position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,200,60,0.9)", marginBottom: 16, textTransform: "uppercase" }}>
          Daily Identity Check-In • {checkInStep + 1} of {checkInQuestions.length}
        </div>
        <h2 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, marginBottom: 24, lineHeight: 1.3 }}>
          {q.q}
        </h2>
        <textarea
          value={checkIn[q.key]}
          onChange={e => setCheckIn(prev => ({ ...prev, [q.key]: e.target.value }))}
          rows={4} placeholder="Be honest..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "16px",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.08)", color: "white",
            fontSize: 15, resize: "none", outline: "none",
            fontFamily: "system-ui, sans-serif", lineHeight: 1.6, marginBottom: 16
          }}
        />
        <button onClick={() => {
          if (checkInStep + 1 < checkInQuestions.length) {
            setCheckInStep(checkInStep + 1);
          } else {
            submitCheckIn();
          }
        }} style={{
          width: "100%", padding: "16px", borderRadius: 50, border: "none",
          background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
          color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
        }}>
          {checkInStep + 1 === checkInQuestions.length ? "Submit Check-In 🔥" : "Next →"}
        </button>
      </div>
    );
  }

  /* ========================
     MAIN RENDER WITH TABS
  ======================== */
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
      color: "white", fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden"
    }}>
      <StarField />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1 }} />

      {/* HEADER */}
      <div style={{
        position: "relative", zIndex: 2, padding: "16px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>W·I·N</h1>
          <div style={{ fontSize: 10, color: "rgba(255,200,60,0.8)", letterSpacing: 2, textTransform: "uppercase" }}>
            Winners Image Nation
          </div>
        </div>
        {actAsIfMode && (
          <div style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)", letterSpacing: 1
          }}>
            ⚡ ACT AS IF
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
        {tab === TABS.CHAT && <ChatTab />}
        {tab === TABS.FUTURE_SELF && <FutureSelfTab />}
        {tab === TABS.AFFIRMATIONS && <AffirmationsTab />}
        {tab === TABS.CHECKIN && <CheckInTab />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)"
      }}>
        {[
          { key: TABS.CHAT, icon: "💬", label: "Coach" },
          { key: TABS.FUTURE_SELF, icon: "🏆", label: "Future Self" },
          { key: TABS.AFFIRMATIONS, icon: "⚡", label: "Affirm" },
          { key: TABS.CHECKIN, icon: "✅", label: "Check In" }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "12px 4px 10px", border: "none",
            background: "transparent", color: tab === t.key ? "white" : "rgba(255,255,255,0.35)",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, letterSpacing: 0.5, fontWeight: tab === t.key ? 700 : 400,
              borderBottom: tab === t.key ? "2px solid #ff8c00" : "2px solid transparent",
              paddingBottom: 2
            }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ========================
   SHARED STYLES
======================== */
const iconBtn = {
  width: 44, height: 44, borderRadius: 50, border: "none",
  background: "rgba(255,255,255,0.1)", color: "white",
  cursor: "pointer", fontSize: 18, display: "flex",
  alignItems: "center", justifyContent: "center", flexShrink: 0
};

const card = {
  padding: "20px 16px", borderRadius: 20,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(8px)"
};
