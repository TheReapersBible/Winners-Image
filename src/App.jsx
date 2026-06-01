import { useState, useEffect, useRef } from "react";
import posthog from "./analytics";

/* ========================
   🌌 STABLE STARFIELD
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
    <div style={{
      position: "fixed",
      inset: 0,
      overflow: "hidden",
      zIndex: 0,
      pointerEvents: "none"
    }}>
      {starsRef.current.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top + "%",
            left: s.left + "%",
            width: s.size,
            height: s.size,
            background: "white",
            borderRadius: "50%",
            opacity: s.opacity
          }}
        />
      ))}
    </div>
  );
}

/* ========================
   🚀 APP
======================== */
export default function App() {
  const APP_STATE = {
    HOME: "home",
    ONBOARDING: "onboarding",
    CHAT: "chat"
  };

  const [appState, setAppState] = useState(APP_STATE.HOME);
  const [step, setStep] = useState(0);

  const [userProfile, setUserProfile] = useState({
    reason: "",
    gender: "",
    age: ""
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* ========================
     INIT
  ======================== */
  useEffect(() => {
    posthog.capture("app_opened");

    setMessages([
      {
        sender: "ai",
        text: "Aye... I see potential in you already. Talk to me.",
        media: []
      }
    ]);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.65;
    window.speechSynthesis.speak(utterance);
  }

  /* ========================
     NOTIFICATIONS
  ======================== */
  function handleNotifYes() {
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        if (perm === "granted") {
          new Notification("Winners Image Nation", {
            body: "You're locked in. We'll check on your mental game regularly. 🔥"
          });
          setTimeout(() => {
            if (Notification.permission === "granted") {
              new Notification("Winners Image Nation", {
                body: "Hey — how's your mental state right now? Come talk to me. 💪"
              });
            }
          }, 30 * 60 * 1000);
        }
      });
    }
    setStep(2);
  }

  /* ========================
     VOICE RECORDING
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
      setMessages(prev => [...prev, {
        sender: "user",
        text: null,
        media: [{ type: "audio", url }]
      }]);
      stream.getTracks().forEach(t => t.stop());
      sendMessageWithText("I just sent a voice message — please respond with motivation and guidance.");
    };
    mr.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  /* ========================
     FILE UPLOAD
  ======================== */
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setMessages(prev => [...prev, {
      sender: "user",
      text: null,
      media: [{ type, url }]
    }]);
    sendMessageWithText(`I just shared a ${type}. Please respond with relevant motivational insight.`);
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
    setMessages(prev => [
      ...prev,
      { sender: "user", text, media: [] }
    ]);

    try {
      const res = await fetch(
        "https://ai-backend-fyyw.onrender.com/api/ai",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            profile: userProfile
          })
        }
      );

      if (!res.ok) throw new Error("Server error: " + res.status);

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
          media: [
            ...(data.images || []).map(i => ({ type: "image", url: i.url })),
            ...(data.videos || []).map(v => ({ type: "video", url: v.url }))
          ]
        }
      ]);

      setTimeout(() => speak(data.reply), 200);

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Something went wrong. Try again.",
          media: []
        }
      ]);
    }
  }

  /* ========================
     HOME
  ======================== */
  if (appState === APP_STATE.HOME) {
    return (
      <div style={{
        ...homeStyle,
        background: "url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600') center/cover no-repeat"
      }}>
        <StarField />
        <div style={darkOverlay} />

        <div style={homeContent}>
          {/* WIN badge */}
          <div style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,200,60,0.9)",
            border: "1px solid rgba(255,200,60,0.4)",
            padding: "6px 18px",
            borderRadius: 30,
            marginBottom: 18,
            backdropFilter: "blur(4px)",
            background: "rgba(255,200,60,0.08)"
          }}>
            W·I·N
          </div>

          <h1 style={{
            fontSize: "clamp(38px, 9vw, 82px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 2,
            margin: "0 0 10px",
            textTransform: "uppercase",
            background: "linear-gradient(135deg, #ffffff 0%, rgba(255,200,60,0.9) 60%, #ff8c00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Winners<br />Image<br />Nation
          </h1>

          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 3,
            textTransform: "uppercase",
            margin: "18px 0 36px"
          }}>
            Mindset · Identity · Execution
          </p>

          <button style={btn} onClick={() => setAppState(APP_STATE.ONBOARDING)}>
            Enter App
          </button>
        </div>
      </div>
    );
  }

  /* ========================
     ONBOARDING
  ======================== */
  if (appState === APP_STATE.ONBOARDING) {
    return (
      <div style={{ height: "100vh", width: "100%" }}>

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <div style={{
            ...slide(),
            background: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600') center/cover no-repeat"
          }}>
            <Overlay />
            <Content>
              <h1 style={{ fontSize: "clamp(28px, 6vw, 52px)", fontWeight: 900, marginBottom: 14 }}>
                Welcome to Your Evolution
              </h1>
              <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 340, margin: "0 auto 32px", lineHeight: 1.7 }}>
                This is where ordinary ends and champions are built. Are you ready?
              </p>
              <button style={btn} onClick={() => setStep(1)}>Begin</button>
            </Content>
          </div>
        )}

        {/* STEP 1 — Notifications */}
        {step === 1 && (
          <div style={{
            ...slide(),
            background: "url('https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600') center/cover no-repeat"
          }}>
            <Overlay />
            <Content>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🔔</div>
              <h1 style={{ fontSize: "clamp(24px, 5vw, 46px)", fontWeight: 900, marginBottom: 14 }}>
                Turn Notifications On
              </h1>
              <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 340, margin: "0 auto 32px", lineHeight: 1.7 }}>
                We'll check in on your mental health, remind you to stay focused, and keep you accountable — even when life gets loud. We'll never spam you. Only what matters.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <button style={btn} onClick={handleNotifYes}>Yes, notify me</button>
                <button style={btnOutline} onClick={() => setStep(2)}>Not now</button>
              </div>
            </Content>
          </div>
        )}

        {/* STEP 2 — Profile */}
        {step === 2 && (
          <div style={{
            ...slide(),
            background: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600') center/cover no-repeat",
            alignItems: "center"
          }}>
            <Overlay />
            <Content>
              <h2 style={{ fontSize: "clamp(22px, 5vw, 40px)", fontWeight: 900, marginBottom: 8 }}>
                Why did you download this app?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 320, margin: "0 auto 24px", fontSize: 14, lineHeight: 1.6 }}>
                Your answer helps us personalise your journey and give you what you actually need.
              </p>

              <textarea
                style={inputStyle}
                value={userProfile.reason}
                placeholder="Be honest — what brought you here?"
                onChange={(e) =>
                  setUserProfile({ ...userProfile, reason: e.target.value })
                }
              />

              <select
                style={inputStyle}
                onChange={(e) =>
                  setUserProfile({ ...userProfile, gender: e.target.value })
                }
              >
                <option>Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>

              <select
                style={inputStyle}
                onChange={(e) =>
                  setUserProfile({ ...userProfile, age: e.target.value })
                }
              >
                <option>Age</option>
                <option>Under 18</option>
                <option>18–24</option>
                <option>25–34</option>
                <option>35–44</option>
                <option>45–54</option>
                <option>55–64</option>
                <option>65+</option>
              </select>

              <button
                style={btn}
                onClick={() => setAppState(APP_STATE.CHAT)}
              >
                Enter App 🚀
              </button>
            </Content>
          </div>
        )}

      </div>
    );
  }

  /* ========================
     CHAT UI
  ======================== */
  return (
    <div style={chatPage}>
      <StarField />
      <div style={darkOverlay} />

      <h1 style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        Winner's Image Nation
      </h1>

      <div style={{ width: 600, margin: "0 auto", position: "relative", zIndex: 2 }}>

        <div style={chatBox} ref={chatRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: 10
              }}
            >
              <div
                style={{
                  background: m.sender === "user"
                    ? "linear-gradient(45deg,#ff8c00,#ff2e63)"
                    : "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 18,
                  maxWidth: "70%",
                  color: "white"
                }}
              >
                {m.text && <div>{m.text}</div>}

                {/* MEDIA */}
                {m.media?.length > 0 && (
                  <div style={{ marginTop: m.text ? 10 : 0 }}>
                    {m.media.map((med, idx) => {
                      if (med.type === "image") return (
                        <img
                          key={idx}
                          src={med.url}
                          alt=""
                          onClick={() => window.open(med.url, "_blank")}
                          style={{ width: "100%", borderRadius: 12, marginTop: 8, cursor: "pointer", display: "block" }}
                        />
                      );
                      if (med.type === "video") return (
                        <video
                          key={idx}
                          controls
                          style={{ width: "100%", borderRadius: 12, marginTop: 8, display: "block" }}
                        >
                          <source src={med.url} />
                        </video>
                      );
                      if (med.type === "audio") return (
                        <audio
                          key={idx}
                          controls
                          src={med.url}
                          style={{ width: "100%", marginTop: 8 }}
                        />
                      );
                      return null;
                    })}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* INPUT BAR */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <button
            style={{ ...btn, padding: "12px 14px" }}
            onClick={() => fileInputRef.current?.click()}
            title="Send image or video"
          >
            📎
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={inputBar}
            placeholder="Talk to your higher self..."
          />

          {/* Voice record — hold to record */}
          <button
            style={{
              ...btn,
              padding: "12px 14px",
              background: isRecording
                ? "linear-gradient(45deg,#ff2e63,#ff0000)"
                : "linear-gradient(45deg,#ff8c00,#ff2e63)"
            }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            title="Hold to record voice"
          >
            {isRecording ? "⏹" : "🎙"}
          </button>

          {/* Send */}
          <button style={btn} onClick={sendMessage}>
            Send
          </button>

        </div>

        {isRecording && (
          <p style={{ color: "rgba(255,100,100,0.9)", fontSize: 13, textAlign: "center", marginTop: 8 }}>
            Recording... release to send
          </p>
        )}

      </div>
    </div>
  );
}

/* ========================
   STYLES
======================== */
const btn = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
  color: "white",
  cursor: "pointer"
};

const btnOutline = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.5)",
  background: "transparent",
  color: "white",
  cursor: "pointer"
};

const inputStyle = {
  display: "block",
  margin: "10px auto",
  padding: "10px",
  width: 300
};

const inputBar = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none"
};

const chatBox = {
  height: 400,
  overflowY: "auto",
  padding: 15,
  marginBottom: 20,
  background: "rgba(0,0,0,0.4)",
  borderRadius: 20
};

const darkOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  zIndex: 1
};

const homeStyle = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  position: "relative",
  overflow: "hidden"
};

const homeContent = {
  textAlign: "center",
  position: "relative",
  zIndex: 2
};

const chatPage = {
  minHeight: "100vh",
  background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
  color: "white",
  padding: 40
};

const slide = () => ({
  height: "100vh",
  width: "100%",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "white"
});

function Overlay() {
  return <div style={darkOverlay} />;
}

function Content({ children }) {
  return (
    <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px" }}>
      {children}
    </div>
  );
}
