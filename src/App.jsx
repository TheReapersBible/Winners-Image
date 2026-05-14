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
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none"
      }}
    >
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

  const chatRef = useRef(null);

  useEffect(() => {
    posthog.capture("app_opened");

    setMessages([
      {
        sender: "ai",
        text: "Aye... I see potential in you already. Talk to me."
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

  async function sendMessage() {
    if (!input.trim()) return;

    console.log("SEND MESSAGE CLICKED");

    posthog.capture("chat_message_sent", {
      length: input.length
    });

    const userText = input;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText }
    ]);

    setInput("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          profile: userProfile
        })
      });

      console.log("STATUS:", res.status);

      if (!res.ok) {
        throw new Error("Server error: " + res.status);
      }

      const data = await res.json();

      // ✅ UPDATED: now supports videos + images
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
          videos: data.videos || [],
          images: data.images || []
        }
      ]);

      posthog.capture("ai_response_received");

      setTimeout(() => speak(data.reply), 200);

    } catch (err) {
      console.error("FETCH ERROR:", err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Something went wrong. Try again."
        }
      ]);
    }
  }

  /* ========================
     🏠 HOME
  ======================== */
  if (appState === APP_STATE.HOME) {
    return (
      <div style={homeStyle}>
        <StarField />
        <div style={darkOverlay} />

        <div style={homeContent}>
          <h1>Build Your Identity</h1>
          <p>Turn mindset into discipline, structure, execution.</p>

          <button style={btn} onClick={() => setAppState(APP_STATE.ONBOARDING)}>
            Enter App
          </button>
        </div>
      </div>
    );
  }

  /* ========================
     🚀 ONBOARDING
  ======================== */
  if (appState === APP_STATE.ONBOARDING) {
    return (
      <div style={{ height: "100vh", width: "100%" }}>
        {step === 0 && (
          <div style={slide("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa")}>
            <Overlay />
            <Content>
              <h1>Welcome to Your Evolution</h1>
              <button style={btn} onClick={() => setStep(1)}>Begin →</button>
            </Content>
          </div>
        )}

        {step === 1 && (
          <div style={slide("https://images.unsplash.com/photo-1516321318423-f06f85e504b3")}>
            <Overlay />
            <Content>
              <h1>Turn Notifications On</h1>
              <button style={btn} onClick={() => setStep(2)}>Continue →</button>
            </Content>
          </div>
        )}

        {step === 2 && (
          <div style={slide("https://images.unsplash.com/photo-1490730141103-6cac27aaab94")}>
            <Overlay />
            <Content>
              <h2>Why did you download this app?</h2>

              <textarea
                style={inputStyle}
                value={userProfile.reason}
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
                <option>Non-binary</option>
              </select>

              <select
                style={inputStyle}
                onChange={(e) =>
                  setUserProfile({ ...userProfile, age: e.target.value })
                }
              >
                <option>Age</option>
                <option>13-17</option>
                <option>18-24</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45+</option>
              </select>

              <button
                style={btn}
                onClick={() => {
                  posthog.capture("onboarding_completed", userProfile);

                  setAppState(APP_STATE.CHAT);
                }}
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
     💬 CHAT
  ======================== */
  return (
    <div style={chatPage}>
      <StarField />
      <div style={darkOverlay} />

      <h1 style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        Winner’s Image Universe
      </h1>

      <div style={{ position: "relative", zIndex: 2, width: 600, margin: "0 auto" }}>
        <div style={chatBox} ref={chatRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: "10px"
              }}
            >
              <div
                style={{
                  background:
                    m.sender === "user"
                      ? "linear-gradient(45deg,#ff8c00,#ff2e63)"
                      : "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: "18px",
                  maxWidth: "70%",
                  color: "white"
                }}
              >
                {/* TEXT */}
                <div>{m.text}</div>

                {/* IMAGES */}
                {m.images?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {m.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={img.title || "image"}
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          marginTop: "8px"
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* VIDEOS */}
                {m.videos?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {m.videos.map((vid, idx) => (
                      <a
                        key={idx}
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          marginTop: "6px",
                          color: "#00bcd4",
                          textDecoration: "underline"
                        }}
                      >
                        🎥 {vid.title || "Watch Video"}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={inputBar}
            placeholder="Talk to your higher self..."
          />

          <button style={btn} onClick={sendMessage}>
            Launch
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================
   🎨 STYLES
======================== */
const btn = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(45deg,#ff8c00,#ff2e63)",
  color: "white",
  cursor: "pointer"
};

const inputStyle = {
  display: "block",
  margin: "10px auto",
  padding: "10px",
  width: "300px"
};

const inputBar = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none"
};

const chatBox = {
  height: "400px",
  overflowY: "auto",
  padding: "15px",
  marginBottom: "20px",
  background: "rgba(0,0,0,0.4)",
  borderRadius: "20px"
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
  background:
    "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564') center/cover"
};

const homeContent = {
  textAlign: "center",
  position: "relative",
  zIndex: 2
};

const chatPage = {
  minHeight: "100vh",
  background:
    "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
  color: "white",
  padding: "40px"
};

const slide = (img) => ({
  height: "100vh",
  width: "100%",
  backgroundImage: `url('${img}')`,
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
    <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
      {children}
    </div>
  );
}