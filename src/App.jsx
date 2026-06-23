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
   WINNERS IMAGE ASSESSMENT
======================== */
function WinnersImageAssessment({ onComplete }) {
  const questions = [
    {
      number: 1,
      title: "Your Ideal Self",
      question: "What does the version of you that has already won look like?",
      detail: "Be as detailed as possible. This is your vision. Don't limit yourself based on your current circumstances. If you can clearly see it in your mind and emotionally connect with it, you're already taking the first step toward becoming it.",
      field: "idealSelf",
      placeholder: "Describe this person in detail — how they think, what they do, how they carry themselves..."
    },
    {
      number: 2,
      title: "Your Environment",
      question: "Describe the environment that surrounds your ideal self.",
      detail: "Think about the people around you, where you live, what you do daily, and the energy you're exposed to. How does this environment affect you mentally, physically, spiritually, financially, and emotionally?",
      field: "environment",
      placeholder: "The people, places, energy, and daily life of the person you're becoming..."
    },
    {
      number: 3,
      title: "Mental Barriers",
      question: "Within the last 3–6 months, have you struggled with worry, doubt, fear, indecision, or lack of confidence?",
      detail: "If so, explain why you believe these thoughts or feelings have been showing up in your life. Be honest — this is just between you and your future self.",
      field: "mentalBarriers",
      placeholder: "What's been showing up mentally and why you think it's been there..."
    },
    {
      number: 4,
      title: "The Past",
      question: "Is there anything from your past that still affects you today?",
      detail: "This could be childhood experiences, relationships, failures, disappointments, regrets, or losses. Has it affected your actions, thoughts, confidence, or decision-making within the last year?",
      field: "past",
      placeholder: "What from your past still has a hold on you, and how it shows up today..."
    },
    {
      number: 5,
      title: "Satisfaction vs. Growth",
      question: "If you achieved everything you currently want in life, would you be satisfied or would you continue striving for more?",
      detail: "Whether it's financial freedom, personal growth, stronger relationships, spiritual fulfillment, or a closer relationship with God — why do you feel that way?",
      field: "satisfaction",
      placeholder: "What drives you beyond achievement — what you're really after..."
    },
    {
      number: 6,
      title: "The Cost of Staying the Same",
      question: "If nothing changes over the next 5 years and you continue living exactly as you are today, what does your life look like?",
      detail: "Be honest. How would that future make you feel? What opportunities, relationships, goals, or experiences would you lose by remaining the same person?",
      field: "costOfSame",
      placeholder: "Paint the picture of the life you'd be living if nothing changes — be real with yourself..."
    }
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");
  const [generating, setGenerating] = useState(false);

  const q = questions[step];
  const progress = (step / questions.length) * 100;

  async function handleNext() {
    if (!value.trim()) return;
    const updated = { ...answers, [q.field]: value };
    setAnswers(updated);
    setValue("");

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      setGenerating(true);
      await onComplete(updated);
    }
  }

  if (generating) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
        color: "white", position: "relative", overflow: "hidden",
        fontFamily: "system-ui, sans-serif"
      }}>
        <StarField />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>⚡</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 2, marginBottom: 12 }}>
            Creating Your Winner's Image...
          </h2>
          <p style={{ color: "rgba(255,200,60,0.8)", fontSize: 15, letterSpacing: 1 }}>
            Analyzing your vision and building your identity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
      color: "white", padding: "24px 20px", position: "relative", overflow: "hidden",
      fontFamily: "system-ui, sans-serif"
    }}>
      <StarField />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 500 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 6 }}>
            Winner's Image Assessment
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>
            Question {step + 1} of {questions.length}
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 32 }}>
          <div style={{
            height: "100%", width: progress + "%",
            background: "linear-gradient(90deg,#ff8c00,#ff2e63)",
            borderRadius: 2, transition: "width 0.5s ease"
          }} />
        </div>

        {/* Question number + title */}
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 20,
          background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.3)",
          fontSize: 12, letterSpacing: 1, color: "rgba(255,200,60,0.9)",
          textTransform: "uppercase", marginBottom: 16
        }}>
          Question {q.number} — {q.title}
        </div>

        <h2 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, lineHeight: 1.25, marginBottom: 14, margin: "0 0 14px" }}>
          {q.question}
        </h2>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>
          {q.detail}
        </p>

        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={q.placeholder}
          rows={5}
          autoFocus
          style={{
            width: "100%", boxSizing: "border-box", padding: "16px",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.07)", color: "white",
            fontSize: 15, fontFamily: "system-ui, sans-serif",
            resize: "none", outline: "none", lineHeight: 1.6, marginBottom: 16
          }}
        />

        <button onClick={handleNext} style={{
          width: "100%", padding: "16px", fontSize: 16, fontWeight: 700,
          borderRadius: 50, border: "none",
          background: value.trim() ? "linear-gradient(45deg,#ff8c00,#ff2e63)" : "rgba(255,255,255,0.08)",
          color: value.trim() ? "white" : "rgba(255,255,255,0.25)",
          cursor: value.trim() ? "pointer" : "default", letterSpacing: 1,
          transition: "all 0.3s"
        }}>
          {step + 1 === questions.length ? "Create My Winner's Image 🔥" : "Continue →"}
        </button>

        {step > 0 && (
          <button onClick={() => { setStep(step - 1); setValue(""); }} style={{
            width: "100%", marginTop: 12, padding: "12px",
            background: "transparent", border: "none",
            color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer"
          }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

/* ========================
   WINNER'S IMAGE REVEAL
======================== */
function WinnersImageReveal({ profile, onEnterApp }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
      color: "white", padding: "32px 20px", position: "relative", overflow: "hidden",
      fontFamily: "system-ui, sans-serif"
    }}>
      <StarField />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 500 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 12 }}>
            Your Winner's Image Has Been Created
          </div>
          <h1 style={{ fontSize: "clamp(28px, 8vw, 48px)", fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: -1 }}>
            This Is Who<br />You're Becoming
          </h1>
        </div>

        {/* Identity Statement */}
        <div style={{
          padding: "24px 20px", borderRadius: 20, marginBottom: 16,
          background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)"
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 12 }}>
            Your Identity Statement
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, color: "white", fontWeight: 500 }}>
            {profile.identityStatement}
          </p>
        </div>

        {/* Affirmations */}
        {profile.affirmations?.length > 0 && (
          <div style={{
            padding: "24px 20px", borderRadius: 20, marginBottom: 16,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 14 }}>
              Your Winner's Image Affirmations
            </div>
            {profile.affirmations.map((a, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 12, marginBottom: 8,
                background: "rgba(255,255,255,0.05)",
                borderLeft: "3px solid rgba(255,140,0,0.6)",
                fontSize: 15, color: "white", lineHeight: 1.5
              }}>
                {a}
              </div>
            ))}
          </div>
        )}

        {/* Daily Plan Preview */}
        {profile.dailyPlan && (
          <div style={{
            padding: "24px 20px", borderRadius: 20, marginBottom: 24,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 14 }}>
              Your Daily Identity Plan
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0 }}>
              {profile.dailyPlan}
            </p>
          </div>
        )}

        <button onClick={onEnterApp} style={{
          width: "100%", padding: "18px", fontSize: 17, fontWeight: 800,
          borderRadius: 50, border: "none",
          background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
          color: "white", cursor: "pointer", letterSpacing: 1
        }}>
          Enter Winner's Image Nation 🏆
        </button>
      </div>
    </div>
  );
}

/* ========================
   MAIN APP
======================== */
export default function App() {
  const TABS = { COACH: "coach", IDENTITY: "identity", CHECKIN: "checkin" };
  const SCREENS = { ASSESSMENT: "assessment", REVEAL: "reveal", APP: "app" };

  const [screen, setScreen] = useState(SCREENS.ASSESSMENT);
  const [tab, setTab] = useState(TABS.COACH);
  const [profile, setProfile] = useState(null);
  const [rawAnswers, setRawAnswers] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [actAsIfMode, setActAsIfMode] = useState(false);
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkIn, setCheckIn] = useState({ matched: "", proved: "", fell: "", tomorrow: "" });
  const [checkInDone, setCheckInDone] = useState(false);
  const [todayActions, setTodayActions] = useState([]);

  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    posthog.capture("app_opened");
    const saved = localStorage.getItem("winnersProfile");
    const savedAnswers = localStorage.getItem("winnersAnswers");
    if (saved) {
      setProfile(JSON.parse(saved));
      setRawAnswers(savedAnswers ? JSON.parse(savedAnswers) : null);
      setScreen(SCREENS.APP);
    }
  }, []);

  useEffect(() => {
    if (screen === SCREENS.APP && messages.length === 0 && profile) {
      const greeting = `${profile.identityStatement} That's who you are. Now talk to me — what's on your mind today?`;
      setMessages([{ sender: "ai", text: greeting, media: [] }]);

      // Generate today's actions
      const actions = [
        `Read your Winner's Image statement out loud — feel it, don't just say it`,
        `Say your affirmations out loud every morning. Not in your head. Out loud.`,
        `Visualize being ${rawAnswers?.idealSelf?.split(" ").slice(0, 8).join(" ") || "your future self"} for 5 minutes — close your eyes and feel it`,
        `Complete one action today that moves you toward ${rawAnswers?.environment?.split(" ").slice(0, 6).join(" ") || "your ideal life"}`
      ];
      setTodayActions(actions);
    }
  }, [screen, profile]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /* ========================
     ASSESSMENT COMPLETE
  ======================== */
  async function handleAssessmentComplete(answers) {
    setRawAnswers(answers);
    try {
      const res = await fetch("https://ai-backend-fyyw.onrender.com/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      const fullProfile = { ...data, answers };
      setProfile(fullProfile);
      localStorage.setItem("winnersProfile", JSON.stringify(fullProfile));
      localStorage.setItem("winnersAnswers", JSON.stringify(answers));
      setScreen(SCREENS.REVEAL);
    } catch {
      // Fallback profile if API fails
      const fallback = {
        identityStatement: `You are becoming the person you described — disciplined, focused, and unstoppable. You no longer allow doubt or past experiences to define your future. You are building a life aligned with your highest potential.`,
        affirmations: [
          "I act with confidence even when I feel uncertain.",
          "My past does not define my future.",
          "I am becoming who I was always meant to be."
        ],
        dailyPlan: "Every morning: read your identity statement, say your affirmations out loud, visualize your ideal self for 5 minutes. Every night: reflect on whether your actions matched your future identity.",
        answers
      };
      setProfile(fallback);
      localStorage.setItem("winnersProfile", JSON.stringify(fallback));
      localStorage.setItem("winnersAnswers", JSON.stringify(answers));
      setScreen(SCREENS.REVEAL);
    }
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
      new Audio(URL.createObjectURL(blob)).play();
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
      sendMessageWithText("I just sent a voice message. Respond based on my Winner's Image profile.");
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
    sendMessageWithText(`I just shared a ${type}. Respond with insight tied to my Winner's Image.`);
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
        body: JSON.stringify({ message: text, profile, actAsIfMode })
      });
      if (!res.ok) throw new Error("Server error");
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
     CHECK IN SUBMIT
  ======================== */
  async function submitCheckIn() {
    setCheckInDone(true);
    const summary = `Daily check-in — Did I act like my future self: ${checkIn.matched}. What I did well: ${checkIn.proved}. Where I fell short: ${checkIn.fell}. Tomorrow's move: ${checkIn.tomorrow}. Give me real honest feedback on this based on my Winner's Image.`;
    await sendMessageWithText(summary);
    setTab(TABS.COACH);
  }

  /* ========================
     RENDER MEDIA
  ======================== */
  function renderMedia(media) {
    return media?.map((med, idx) => {
      if (med.type === "image") return (
        <div key={idx} style={{ borderRadius: 14, overflow: "hidden", marginTop: 8, cursor: "pointer" }}
          onClick={() => window.open(med.url, "_blank")}>
          <img src={med.url} alt="" style={{ width: "100%", display: "block" }}
            onError={e => e.target.style.display = "none"} />
        </div>
      );
      if (med.type === "video") return (
        <video key={idx} controls playsInline style={{ width: "100%", borderRadius: 14, marginTop: 8, maxHeight: 260 }}
          onError={e => e.target.style.display = "none"}>
          <source src={med.url} type="video/mp4" />
        </video>
      );
      if (med.type === "audio") return (
        <audio key={idx} controls src={med.url} style={{ width: "100%", marginTop: 8 }} />
      );
      return null;
    });
  }

  /* ========================
     SCREENS
  ======================== */
  if (screen === SCREENS.ASSESSMENT) {
    return <WinnersImageAssessment onComplete={handleAssessmentComplete} />;
  }

  if (screen === SCREENS.REVEAL) {
    return <WinnersImageReveal profile={profile} onEnterApp={() => setScreen(SCREENS.APP)} />;
  }

  /* ========================
     MAIN APP TABS
  ======================== */
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
      color: "white", fontFamily: "system-ui, sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      <StarField />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 1 }} />

      {/* HEADER */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "14px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>W·I·N</h1>
          <div style={{ fontSize: 9, color: "rgba(255,200,60,0.7)", letterSpacing: 2, textTransform: "uppercase" }}>
            Winner's Image Nation
          </div>
        </div>
        {actAsIfMode && (
          <div style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: "linear-gradient(45deg,#ff8c00,#ff2e63)", letterSpacing: 1
          }}>
            ⚡ ACT AS IF
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>

        {/* ---- COACH TAB ---- */}
        {tab === TABS.COACH && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div ref={chatRef} style={{
              flex: 1, overflowY: "auto", padding: "14px 12px",
              display: "flex", flexDirection: "column", gap: 10
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
                        : "rgba(255,255,255,0.1)",
                      padding: "12px 15px",
                      borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      maxWidth: "84%", color: "white", fontSize: 15, lineHeight: 1.55,
                      backdropFilter: "blur(6px)"
                    }}>
                      {m.text}
                    </div>
                  )}
                  {m.media?.length > 0 && (
                    <div style={{ maxWidth: "84%" }}>{renderMedia(m.media)}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick commands */}
            <div style={{ padding: "0 12px 6px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["act as if today", "check my progress", "remind me who I am"].map((cmd, i) => (
                <button key={i} onClick={() => sendMessageWithText(cmd)} style={{
                  padding: "5px 12px", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
                  fontSize: 11, cursor: "pointer"
                }}>{cmd}</button>
              ))}
            </div>

            {/* Input bar */}
            <div style={{ padding: "6px 12px 12px", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <input ref={fileInputRef} type="file" accept="image/*,video/*"
                style={{ display: "none" }} onChange={handleFile} />
              <button onClick={() => fileInputRef.current?.click()} style={iconBtn}>📎</button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Talk to your future self..."
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.07)", color: "white",
                  fontSize: 15, outline: "none", fontFamily: "system-ui, sans-serif"
                }} />
              <button onMouseDown={startRecording} onMouseUp={stopRecording}
                onTouchStart={startRecording} onTouchEnd={stopRecording}
                style={{ ...iconBtn, background: isRecording ? "rgba(255,50,50,0.8)" : "rgba(255,255,255,0.08)" }}>
                {isRecording ? "⏹" : "🎙"}
              </button>
              <button onClick={sendMessage} style={{ ...iconBtn, background: "linear-gradient(45deg,#ff8c00,#ff2e63)" }}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* ---- IDENTITY TAB ---- */}
        {tab === TABS.IDENTITY && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Today's Winner's Image */}
            <div style={card}>
              <div style={cardLabel}>Today's Winner's Image</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 16px", color: "white", fontWeight: 500 }}>
                {profile?.identityStatement}
              </p>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
              <div style={cardLabel}>Your Affirmations — Say These Out Loud</div>
              {profile?.affirmations?.map((a, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 12, marginBottom: 8,
                  background: "rgba(255,255,255,0.05)",
                  borderLeft: "3px solid rgba(255,140,0,0.6)",
                  fontSize: 14, color: "white", lineHeight: 1.5
                }}>{a}</div>
              ))}
            </div>

            {/* Today's Mission */}
            <div style={card}>
              <div style={cardLabel}>Today's Mission</div>
              {todayActions.map((action, i) => (
                <div key={i} style={{
                  padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                  background: "rgba(255,255,255,0.05)",
                  borderLeft: "3px solid rgba(255,46,99,0.6)",
                  fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.55
                }}>{action}</div>
              ))}
            </div>

            {/* Act As If Mode */}
            <div style={card}>
              <div style={cardLabel}>Act As If Mode</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 1.6 }}>
                Activate this when you're ready to show up as the person you're becoming — right now, today, not someday.
              </p>
              <button onClick={() => {
                setActAsIfMode(!actAsIfMode);
                if (!actAsIfMode) sendMessageWithText("I just activated Act As If mode. Speak to me as if I already am my future self. What do I need to hear right now?");
              }} style={{
                width: "100%", padding: "14px", borderRadius: 50, border: "none",
                background: actAsIfMode ? "rgba(255,255,255,0.08)" : "linear-gradient(45deg,#ff8c00,#ff2e63)",
                color: actAsIfMode ? "rgba(255,255,255,0.5)" : "white",
                fontWeight: 700, fontSize: 15, cursor: "pointer"
              }}>
                {actAsIfMode ? "Deactivate Mode" : "⚡ Activate Act As If"}
              </button>
            </div>

            {/* Reset */}
            <button onClick={() => {
              localStorage.removeItem("winnersProfile");
              localStorage.removeItem("winnersAnswers");
              setProfile(null); setRawAnswers(null);
              setMessages([]); setScreen(SCREENS.ASSESSMENT);
            }} style={{
              padding: "12px", borderRadius: 50,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "rgba(255,255,255,0.3)",
              fontSize: 13, cursor: "pointer"
            }}>
              Retake Winner's Image Assessment
            </button>
          </div>
        )}

        {/* ---- CHECK IN TAB ---- */}
        {tab === TABS.CHECKIN && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 16px" }}>
            {checkInDone ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔥</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Check-in complete</h2>
                <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 24, lineHeight: 1.6 }}>
                  Your coach is reviewing your day. Check your messages for real feedback.
                </p>
                <button onClick={() => { setTab(TABS.COACH); setCheckInDone(false); setCheckInStep(0); setCheckIn({ matched: "", proved: "", fell: "", tomorrow: "" }); }} style={{
                  padding: "14px 32px", borderRadius: 50, border: "none",
                  background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
                  color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
                }}>
                  See Feedback →
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,200,60,0.8)", textTransform: "uppercase", marginBottom: 20 }}>
                  Daily Identity Check-In • {checkInStep + 1} of 4
                </div>

                {/* Progress */}
                <div style={{ height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 24 }}>
                  <div style={{
                    height: "100%", width: (checkInStep / 4 * 100) + "%",
                    background: "linear-gradient(90deg,#ff8c00,#ff2e63)", borderRadius: 2, transition: "width 0.4s"
                  }} />
                </div>

                {[
                  { key: "matched", q: "Did your actions today match the person you're becoming? Be honest." },
                  { key: "proved", q: "What did you do today that proved you're changing?" },
                  { key: "fell", q: "Where did you fall short today? No judgment — just honesty." },
                  { key: "tomorrow", q: "What's the one move you're making tomorrow, no excuses?" }
                ].filter((_, i) => i === checkInStep).map(item => (
                  <div key={item.key} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 style={{ fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 20 }}>
                      {item.q}
                    </h2>
                    <textarea
                      value={checkIn[item.key]}
                      onChange={e => setCheckIn(prev => ({ ...prev, [item.key]: e.target.value }))}
                      rows={5} placeholder="Be honest..."
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "16px",
                        borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.07)", color: "white",
                        fontSize: 15, resize: "none", outline: "none",
                        fontFamily: "system-ui, sans-serif", lineHeight: 1.6, marginBottom: 16, flex: 1
                      }}
                    />
                    <button onClick={() => {
                      if (checkInStep + 1 < 4) setCheckInStep(checkInStep + 1);
                      else submitCheckIn();
                    }} style={{
                      width: "100%", padding: "16px", borderRadius: 50, border: "none",
                      background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
                      color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
                    }}>
                      {checkInStep + 1 === 4 ? "Submit Check-In 🔥" : "Next →"}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "relative", zIndex: 2, display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)"
      }}>
        {[
          { key: TABS.COACH, icon: "💬", label: "AI Coach" },
          { key: TABS.IDENTITY, icon: "🏆", label: "My Image" },
          { key: TABS.CHECKIN, icon: "✅", label: "Check In" }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "12px 4px 10px", border: "none",
            background: "transparent",
            color: tab === t.key ? "white" : "rgba(255,255,255,0.3)",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3
          }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, letterSpacing: 0.5,
              fontWeight: tab === t.key ? 700 : 400,
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
  background: "rgba(255,255,255,0.08)", color: "white",
  cursor: "pointer", fontSize: 18, display: "flex",
  alignItems: "center", justifyContent: "center", flexShrink: 0
};

const card = {
  padding: "20px 16px", borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(8px)"
};

const cardLabel = {
  fontSize: 10, letterSpacing: 3, color: "rgba(255,200,60,0.8)",
  textTransform: "uppercase", marginBottom: 12
};
