import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Bot, User, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ChatMsg {
  from: "bot" | "user" | "admin" | "system";
  text: string;
}

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "bot" | "live" | "offline-form";
type FormStep = "issue" | "email" | "phone" | "done";

export default function SupportChatbot() {
  const [alfredEnabled, setAlfredEnabled] = useState<boolean | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { from: "bot", text: "Hey! 👋 Ich bin Sophia, deine Ansprechpartnerin für alles rund um NIGHTLIFE GENERATION. Was kann ich für dich tun?" },
  ]);
  const [aiHistory, setAiHistory] = useState<AIMessage[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [mode, setMode] = useState<ChatMode>("bot");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<FormStep>("issue");
  const [formData, setFormData] = useState({ issue: "", email: "", phone: "" });
  const [emailInput, setEmailInput] = useState("");
  const [supportOnline, setSupportOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [customerLang, setCustomerLang] = useState<string>("de");

  // Check if Alfred is enabled
  useEffect(() => {
    const checkAlfred = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "alfred_butler").maybeSingle();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        setAlfredEnabled(!!(data.value as Record<string, unknown>).enabled);
      } else {
        setAlfredEnabled(false);
      }
    };
    checkAlfred();
  }, []);

  // Check support online status
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "support_online").maybeSingle();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        const val = data.value as Record<string, unknown>;
        setSupportOnline(!!val.online);
        setStaffCount(typeof val.staff_count === "number" ? val.staff_count : 0);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Realtime messages for live chat
  useEffect(() => {
    if (!ticketId || mode !== "live") return;
    const ch = supabase.channel(`chat-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, async (payload) => {
        const msg = payload.new as { sender_type: string; content: string; is_internal: boolean };
        if (msg.sender_type === "admin" && !msg.is_internal) {
          // Translate admin message to customer language if needed
          let text = msg.content;
          if (customerLang !== "de") {
            try {
              const { data } = await supabase.functions.invoke("translate-message", {
                body: { text: msg.content, targetLanguage: customerLang },
              });
              if (data?.result) text = data.result;
            } catch { /* use original */ }
          }
          setChatMessages(prev => [...prev, { from: "admin", text }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticketId, mode, customerLang]);

  const [staffCount, setStaffCount] = useState(0);

  const quickReplies = [
    { label: "💬 Live Chat", query: "Ich möchte mit einem Mitarbeiter chatten" },
  ];

  const askAlfred = useCallback(async (userText: string, history: AIMessage[]): Promise<string> => {
    const newHistory = [...history, { role: "user" as const, content: userText }];
    setAiHistory(newHistory);

    try {
      const { data, error } = await supabase.functions.invoke("james-chat", {
        body: { messages: newHistory },
      });
      if (error) throw error;
      const reply = data?.reply || "";
      setAiHistory(prev => [...prev, { role: "assistant", content: reply }]);
      return reply;
    } catch (e) {
      console.error("Alfred AI error:", e);
      return "Entschuldigung, da ist etwas schiefgelaufen. Versuch es bitte nochmal! 😅";
    }
  }, []);

  const startLiveChat = useCallback(async (initialMessage?: string) => {
    if (supportOnline) {
      setChatMessages(prev => [
        ...prev,
        { from: "system", text: `Es sind gerade ${staffCount} Mitarbeiter für dich da! 🟢` },
      ]);
      const { data } = await supabase.from("support_tickets").insert([{
        subject: initialMessage?.substring(0, 100) || "Live-Chat Anfrage",
        customer_email: "chat@visitor.local",
        category: "support" as const,
        source: "chat",
        metadata: { language: customerLang },
      }]).select().single();

      if (data) {
        setTicketId(data.id);
        setMode("live");
        setChatMessages(prev => [
          ...prev,
          { from: "system", text: "Du bist jetzt mit einem Mitarbeiter verbunden. 🟢" },
        ]);
        if (initialMessage) {
          await supabase.from("support_messages").insert([{
            ticket_id: data.id,
            sender_type: "customer",
            content: initialMessage,
          }]);
        }
      }
    } else {
      setMode("offline-form");
      setFormStep("issue");
      setChatMessages(prev => [
        ...prev,
        { from: "bot", text: "Aktuell sind leider alle Mitarbeiter im Gespräch. 😊 Bitte schildere kurz dein Anliegen und gib uns deine E-Mail-Adresse – wir melden uns dann schnellstmöglich per Mail bei dir!" },
      ]);
    }
  }, [supportOnline, staffCount, customerLang]);

  const handleOfflineForm = useCallback(async (input: string) => {
    if (formStep === "issue") {
      setFormData(prev => ({ ...prev, issue: input }));
      setChatMessages(prev => [
        ...prev,
        { from: "user", text: input },
        { from: "bot", text: "Danke! Bitte gib uns noch deine E-Mail-Adresse, damit wir uns bei dir melden können: 📧" },
      ]);
      setFormStep("email");
    }
  }, [formStep]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleQuickReply = async (query: string) => {
    setShowQuickReplies(false);
    setChatMessages(prev => [...prev, { from: "user", text: query }]);

    if (query.includes("Mitarbeiter")) {
      startLiveChat();
      return;
    }

    setIsTyping(true);
    const reply = await askAlfred(query, aiHistory);
    setIsTyping(false);

    if (reply.trim() === "ESCALATE") {
      startLiveChat(query);
    } else {
      setChatMessages(prev => [...prev, { from: "bot", text: reply }]);
    }
  };

  // Detect customer language from first message
  const detectLang = useCallback(async (text: string) => {
    try {
      const { data } = await supabase.functions.invoke("translate-message", {
        body: { text, detectOnly: true },
      });
      if (data?.result) {
        const lang = data.result.toLowerCase().trim().substring(0, 2);
        setCustomerLang(lang);
      }
    } catch { /* default to de */ }
  }, []);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatInput("");

    // Offline form mode
    if (mode === "offline-form") {
      await handleOfflineForm(userText);
      return;
    }

    // Live chat mode
    if (mode === "live" && ticketId) {
      setChatMessages(prev => [...prev, { from: "user", text: userText }]);
      // Translate to German for admin, store original + translated
      let deText = userText;
      if (customerLang !== "de") {
        try {
          const { data } = await supabase.functions.invoke("translate-message", {
            body: { text: userText, targetLanguage: "German" },
          });
          if (data?.result) deText = data.result;
        } catch { /* use original */ }
      }
      await supabase.from("support_messages").insert([{
        ticket_id: ticketId,
        sender_type: "customer",
        content: deText,
        attachments: JSON.parse(JSON.stringify([{ original: userText, language: customerLang }])),
      }]);
      return;
    }

    // Bot mode - AI powered
    setChatMessages(prev => [...prev, { from: "user", text: userText }]);
    setShowQuickReplies(false);

    // Detect language on first user message
    if (aiHistory.filter(m => m.role === "user").length === 0) {
      detectLang(userText);
    }

    setIsTyping(true);
    const reply = await askAlfred(userText, aiHistory);
    setIsTyping(false);

    if (reply.trim() === "ESCALATE") {
      const allUserMessages = chatMessages.filter(m => m.from === "user").map(m => m.text).join(" | ");
      startLiveChat(allUserMessages || userText);
    } else {
      setChatMessages(prev => [...prev, { from: "bot", text: reply }]);
    }
  };

  if (!alfredEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {chatOpen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-80 sm:w-96 h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: "hsl(270 30% 10%)",
            border: "1px solid hsl(270 60% 40% / 0.2)",
            boxShadow: "0 0 40px hsl(270 80% 50% / 0.1)",
          }}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center gap-3"
            style={{ background: mode === "live" ? "hsl(142 70% 35%)" : "linear-gradient(135deg, hsl(270 90% 55%), hsl(280 85% 45%))" }}
          >
            {mode === "live" ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            <div>
              <p className="font-semibold text-white text-sm">{mode === "live" ? "Live Support" : "Sophia"}</p>
              <p className="text-xs text-white/70">
                {mode === "live" ? "Verbunden mit Mitarbeiter" : "NIGHTLIFE Support"}
              </p>
            </div>
            {mode === "live" && <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />}
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/70 hover:text-white text-lg">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : m.from === "system" ? "justify-center" : "justify-start"}`}>
                {m.from === "system" ? (
                  <span className="text-xs italic px-3 py-1 rounded-full text-center" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.5)" }}>
                    {m.text}
                  </span>
                ) : (
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line"
                    style={{
                      background: m.from === "user" ? "hsl(270 70% 45%)" : m.from === "admin" ? "hsl(142 70% 35% / 0.3)" : "hsl(270 30% 18%)",
                      color: "hsl(0 0% 100%)",
                      border: m.from === "admin" ? "1px solid hsl(142 70% 40% / 0.3)" : "none",
                    }}
                  >
                    {m.from === "admin" && <span className="text-[10px] font-bold block mb-0.5" style={{ color: "hsl(142 70% 55%)" }}>Mitarbeiter</span>}
                    {m.text}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-sm flex items-center gap-2" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.5)" }}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sophia tippt...
                </div>
              </div>
            )}

            {showQuickReplies && mode === "bot" && !isTyping && (
              <div className="flex flex-wrap gap-2 mt-1">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => handleQuickReply(qr.query)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: "hsl(217 91% 50% / 0.15)",
                      color: "hsl(217 91% 65%)",
                      border: "1px solid hsl(217 91% 50% / 0.3)",
                    }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Inline email field for offline form */}
            {mode === "offline-form" && formStep === "email" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-3 space-y-2"
                style={{ background: "hsl(270 30% 15%)", border: "1px solid hsl(270 60% 40% / 0.25)" }}
              >
                <p className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.6)" }}>📧 Deine E-Mail-Adresse</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = emailInput.trim();
                    if (!email || !email.includes("@")) return;
                    setEmailInput("");
                    setFormData(prev => ({ ...prev, email }));

                    const { error } = await supabase.from("support_tickets").insert([{
                      subject: formData.issue.substring(0, 100),
                      customer_email: email,
                      category: "support" as const,
                      source: "chat",
                      metadata: { full_issue: formData.issue, language: customerLang },
                    }]);

                    setChatMessages(prev => [
                      ...prev,
                      { from: "user", text: email },
                      { from: "bot", text: error
                        ? "Entschuldigung, es gab einen Fehler. Bitte versuche es später erneut. 😔"
                        : "Vielen Dank! ✅ Wir haben dein Anliegen erhalten und melden uns schnellstmöglich per Mail bei dir. Schönen Tag noch! 🎉"
                      },
                    ]);
                    setFormStep("done");
                    setMode("bot");
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@beispiel.de"
                    type="email"
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ background: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.15)" }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "hsl(270 90% 55%)", color: "hsl(0 0% 100%)" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleChat} className="p-3 flex gap-2" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                mode === "live" ? "Nachricht an Mitarbeiter..." :
                mode === "offline-form" && formStep === "email" ? "Deine E-Mail-Adresse..." :
                mode === "offline-form" && formStep === "phone" ? "Deine Telefonnummer..." :
                "Frag mich etwas..."
              }
              className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping}
              className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: mode === "live" ? "hsl(142 70% 40%)" : "hsl(270 90% 55%)", color: "hsl(0 0% 100%)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="flex items-center gap-3 mb-20 lg:mb-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="rounded-xl px-4 py-2 shadow-lg hidden sm:block"
            style={{ background: "hsl(270 80% 20%)", border: "1px solid hsl(270 80% 56% / 0.3)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 100%)" }}>
              Fragen? Sophia hilft! 💬
            </p>
          </motion.div>
          <button
            onClick={() => setChatOpen(true)}
            className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(270 90% 55%), hsl(280 85% 45%))",
              boxShadow: "0 0 25px hsl(270 90% 55% / 0.5), 0 0 60px hsl(270 90% 55% / 0.2)",
            }}
            aria-label="Sophia Support Chat öffnen"
          >
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "hsl(270 90% 55% / 0.3)" }} />
            <span className="relative z-10 text-2xl" role="img" aria-label="Sophia">👩‍💼</span>
          </button>
        </div>
      )}
    </div>
  );
}
