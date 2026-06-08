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

  /* ========================
     ELEVENLABS VOICE
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
      const audio = new Audio(url);
      audio.play();

    } catch (err) {
      console.log("Voice error:", err);
      // Fallback to browser voice if ElevenLabs fails
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.65;
      window.speechSynthesis.speak(utterance);
    }
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
          body: JSON.stringify({ message: text })
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
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: 16
              }}
            >
              {m.text && (
                <div
                  style={{
                    background: m.sender === "user"
                      ? "linear-gradient(45deg,#ff8c00,#ff2e63)"
                      : "rgba(255,255,255,0.15)",
                    padding: "12px 16px",
                    borderRadius: 18,
                    maxWidth: "70%",
                    color: "white",
                    marginBottom: m.media?.length > 0 ? 8 : 0
                  }}
                >
                  {m.text}
                </div>
              )}

              {m.media?.length > 0 && (
                <div style={{ width: "70%", display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.media.map((med, idx) => {
                    if (med.type === "image") return (
                      <div key={idx} style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer" }}
                        onClick={() => window.open(med.url, "_blank")}>
                        <img
                          src={med.url}
                          alt=""
                          style={{
                            width: "100%",
                            display: "block",
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.15)"
                          }}
                          onError={e => e.target.style.display = "none"}
                        />
                      </div>
                    );
                    if (med.type === "video") return (
                      <div key={idx} style={{ borderRadius: 12, overflow: "hidden", background: "#000" }}>
                        <video
                          controls
                          playsInline
                          style={{
                            width: "100%",
                            display: "block",
                            borderRadius: 12,
                            maxHeight: 300
                          }}
                          onError={e => e.target.style.display = "none"}
                        >
                          <source src={med.url} type="video/mp4" />
                        </video>
                      </div>
                    );
                    if (med.type === "audio") return (
                      <audio
                        key={idx}
                        controls
                        src={med.url}
                        style={{ width: "100%", marginTop: 4 }}
                      />
                    );
                    return null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* INPUT BAR */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

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

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={inputBar}
            placeholder="Talk to your higher self..."
          />

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

const inputBar = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none"
};

const chatBox = {
  height: "calc(100vh - 220px)",
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

const chatPage = {
  minHeight: "100vh",
  background: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa') center/cover",
  color: "white",
  padding: 40,
  position: "relative",
  overflow: "hidden"
};
