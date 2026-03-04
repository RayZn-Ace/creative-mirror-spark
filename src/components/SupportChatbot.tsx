import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Bot, User, Send } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ChatMsg {
  from: "bot" | "user" | "admin" | "system";
  text: string;
}

const kb: { keywords: string[]; de: string; en: string }[] = [
  { keywords: ["alter", "kinder", "kind", "unter 18", "mindestalter", "jugendliche", "teenager", "age", "kids", "children", "underage"],
    de: "Da jede Location unterschiedliche Hausregeln hat, empfehlen wir dir, die Location direkt zu kontaktieren. Offiziell ist unser Event ab 18 Jahren. 🔞",
    en: "Since each venue has its own house rules, we recommend contacting the venue directly. Officially, our event is 18+. 🔞" },
  { keywords: ["männer", "mann", "jungs", "kerle", "men", "guys", "male"],
    de: "Natürlich sind Männer ebenfalls herzlich willkommen! Unsere Party ist für alle. 🎉",
    en: "Of course, men are absolutely welcome! Our party is for everyone. 🎉" },
  { keywords: ["tisch", "lounge", "reservier", "tische", "table", "vip bereich", "reservation", "reserve"],
    de: "Für Tisch- oder Lounge-Reservierungen kontaktiere bitte direkt die jeweilige Location. 🍾",
    en: "For table or lounge reservations, please contact the venue directly. 🍾" },
  { keywords: ["jga", "junggesellinnen", "junggesellen", "gruppe", "gruppen", "geburtstag", "birthday", "firmenfeier", "firmenevent", "teambuilding", "corporate", "bachelorette", "bachelor", "polterabend", "betriebsausflug", "group"],
    de: "Das klingt mega! 🎉 Schreib uns deine Details (Gruppenname, Personenzahl, gewünschtes Event) und wir melden uns!",
    en: "That sounds amazing! 🎉 Send us your details (group name, number of people, desired event) and we'll get back to you!" },
  { keywords: ["wie lange", "dauer", "stunden", "how long", "duration", "hours", "length"],
    de: "Die Veranstaltung dauert mindestens 3 Stunden. Die Show selbst ca. 2:15h. Je nach Location gibt's danach noch eine Aftershow! ⏱",
    en: "The event lasts at least 3 hours. The show itself is about 2:15h. Some venues have an aftershow! ⏱" },
  { keywords: ["nur 2", "warum so kurz", "kurz", "why only", "short"],
    de: "Wir haben die größten und bekanntesten ABBA-Hits ausgewählt, damit die Party maximal intensiv ist. Quality over Quantity! 🎶",
    en: "We've selected the biggest ABBA hits to make the party as intense as possible. Quality over quantity! 🎶" },
  { keywords: ["warm up", "warmup", "vorprogramm", "vor der show", "davor", "before the show", "pre-show"],
    de: "Vor der Show gibt es ein Warm-Up Programm mit bekannten Party-Hits zum Mitsingen und Tanzen! 💃🔥",
    en: "Before the show there's a warm-up program with popular party hits to sing and dance along! 💃🔥" },
  { keywords: ["essen", "food", "dinner", "speisen", "catering", "hungrig", "hungry"],
    de: "Das ist von Location zu Location unterschiedlich. Bitte kontaktiere die Location direkt. 🍔",
    en: "This varies by venue. Please contact the venue directly. 🍔" },
  { keywords: ["garderobe", "jacke", "mantel", "cloakroom", "coat", "wardrobe"],
    de: "Es gibt eine Garderobe. Preise variieren je nach Location – bitte direkt bei der Location anfragen. 🧥",
    en: "There's a cloakroom. Prices vary by venue – please ask the venue directly. 🧥" },
  { keywords: ["verschoben", "verlegt", "verlegung", "postpone", "postponed", "rescheduled"],
    de: "Alle Tickets behalten ihre Gültigkeit! Wenn dir das neue Datum nicht passt, kannst du dein Ticket bei JEDER unserer Veranstaltungen einlösen – gib uns einfach am Einlass Bescheid. 🎫",
    en: "All tickets remain valid! If the new date doesn't work, you can redeem your ticket at ANY of our events – just let us know at the entrance. 🎫" },
  { keywords: ["stornierung", "stornieren", "widerruf", "cancel", "cancellation", "storno"],
    de: "Gemäß § 312g Abs. 2 Nr. 9 BGB ist das Widerrufsrecht bei Veranstaltungen ausgeschlossen. Ticketstornierungen sind daher leider nicht möglich. ❌",
    en: "According to German law (§ 312g), the right of withdrawal is excluded for event tickets. Ticket cancellations are unfortunately not possible. ❌" },
  { keywords: ["umbuch", "umtausch", "anderer termin", "tauschen", "wechseln", "ändern", "rebook", "exchange", "change date", "switch"],
    de: "Umbuchungen sind möglich! Gebühr: 5€ pro Ticket. Möchtest du mit einem Mitarbeiter darüber chatten? 🔁",
    en: "Rebooking is possible! Fee: €5 per ticket. Would you like to chat with an agent about this? 🔁" },
  { keywords: ["parken", "parkplatz", "auto", "anfahrt", "parking", "car", "drive"],
    de: "Parkplätze sind je nach Location unterschiedlich – bitte direkt bei der Location anfragen. 🚗",
    en: "Parking varies by venue – please ask the venue directly. 🚗" },
  { keywords: ["karte zahlen", "kartenzahlung", "bargeld", "cash", "ec karte", "bezahlen", "card payment", "pay"],
    de: "Ob man vor Ort mit Karte zahlen kann, ist je Location unterschiedlich – bitte direkt anfragen. 💳",
    en: "Whether you can pay by card on-site varies by venue – please ask directly. 💳" },
  { keywords: ["programm", "ablauf", "schedule", "program", "lineup", "band", "live", "sänger", "dj", "performer", "künstler", "singer", "musician"],
    de: "Wir sind eine weltweite Partytour! DJ, Crew und Give-Aways sind immer dabei. Sänger, Band oder Violinist sind Zusatz-Highlights je nach Tourstop. 🎶",
    en: "We're a worldwide party tour! DJ, crew and giveaways are always included. Singers, bands or violinists are bonus highlights depending on the tour stop. 🎶" },
  { keywords: ["ticket", "karten", "kaufen", "bestellen", "preis", "kosten", "wie teuer", "eintritt", "tickets", "buy", "price", "cost", "order", "shop"],
    de: "Tickets gibt's in unserem offiziellen Ticketshop! 🎫 Auch auf Eventim, Eventbrite, Ticketmaster und weiteren Plattformen!",
    en: "Get your tickets at our official shop! 🎫 Also available on Eventim, Eventbrite, Ticketmaster and more!" },
  { keywords: ["kontakt", "email", "mail", "schreiben", "support", "hilfe", "telefon", "anrufen", "hotline", "nummer", "kundenservice", "contact", "phone", "call", "help"],
    de: "Ich verbinde dich gerne mit einem Mitarbeiter! \u{1F4AC} Klicke auf 'Mit Mitarbeiter chatten' um den Live-Chat zu starten.",
    en: "I'd be happy to connect you with an agent! 💬 Click 'Chat with agent' to start a live chat." },
  { keywords: ["location anmelden", "location buchen", "uns buchen", "club anmelden", "venue register", "book us", "host"],
    de: "Cool, dass du Interesse hast! 🎉 Möchtest du direkt mit einem Mitarbeiter darüber sprechen?",
    en: "Cool that you're interested! 🎉 Would you like to speak with an agent directly?" },
  { keywords: ["foto", "fotos", "video", "videos", "bilder", "instagram", "social media", "tiktok", "facebook", "photo", "pictures", "media"],
    de: "Fotos und Videos findest du auf unseren Social-Media-Kanälen! 📸 Oft posten auch die Fotografen der jeweiligen Location.",
    en: "Find photos and videos on our social media channels! 📸 The venue's photographers often post as well." },
  { keywords: ["ausgefallen", "abgesagt", "geld zurück", "erstattung", "refund", "cancelled", "money back"],
    de: "Bei Ausfall hast du 2 Optionen:\n1️⃣ Ticket für ein anderes Event einlösen\n2️⃣ Erstattung beantragen\n\nMöchtest du mit einem Mitarbeiter darüber chatten?",
    en: "If cancelled, you have 2 options:\n1️⃣ Redeem your ticket for any other event\n2️⃣ Request a refund\n\nWould you like to chat with an agent?" },
  { keywords: ["songs", "lieder", "setlist", "welche lieder", "playlist", "hits", "which songs"],
    de: "Wir spielen die größten ABBA-Hits: Dancing Queen, Mamma Mia, Gimme Gimme Gimme, Waterloo, SOS und viele mehr! 🎶",
    en: "We play the biggest ABBA hits: Dancing Queen, Mamma Mia, Gimme Gimme Gimme, Waterloo, SOS and many more! 🎶" },
  { keywords: ["dresscode", "kleidung", "anziehen", "outfit", "kostüm", "verkleid", "dress code", "wear", "costume"],
    de: "Es gibt keinen Dresscode, aber viele Gäste kommen in 70er-Outfits, Glitzer oder ABBA-Kostümen! 🕺✨",
    en: "No dress code, but many guests come in 70s outfits, glitter or ABBA costumes! 🕺✨" },
  { keywords: ["wo", "städte", "stadt", "termine", "wann", "datum", "termin", "nächste", "tour", "tourdaten", "where", "cities", "city", "dates", "when", "next", "schedule"],
    de: "Wir sind in über 100 Städten in 13 Ländern unterwegs! Alle Termine findest du auf unserer Eventseite. 🌍",
    en: "We're touring 100+ cities in 13 countries! Find all dates on our events page. 🌍" },
  { keywords: ["land", "länder", "international", "europa", "weltweit", "ausland", "countries", "worldwide", "europe"],
    de: "Wir sind in 13 Ländern unterwegs: 🇩🇪 🇦🇹 🇨🇭 🇳🇱 🇫🇷 🇱🇺 🇧🇪 🇵🇱 🇨🇿 🇮🇹 🇪🇸 🇭🇷 🇧🇷 – und es werden mehr!",
    en: "We're touring 13 countries: 🇩🇪 🇦🇹 🇨🇭 🇳🇱 🇫🇷 🇱🇺 🇧🇪 🇵🇱 🇨🇿 🇮🇹 🇪🇸 🇭🇷 🇧🇷 – and growing!" },
  { keywords: ["was ist", "worum geht", "was erwartet", "konzept", "what is", "about", "concept"],
    de: "Die GIMME GIMME PARTY ist die größte ABBA Sing-Along Party der Welt! 🎤 Wir bringen die besten ABBA-Hits live!",
    en: "GIMME GIMME PARTY is the world's biggest ABBA sing-along party! 🎤 We bring the best ABBA hits live!" },
  { keywords: ["hallo", "hey", "hi", "moin", "servus", "grüß", "guten tag", "guten abend", "guten morgen", "hello", "good morning", "good evening"],
    de: "Hey! 👋 Wie kann ich dir helfen? Frag mich alles zu Tickets, Terminen, der Show oder was dich sonst interessiert!",
    en: "Hey! 👋 How can I help? Ask me anything about tickets, dates, the show or whatever you're curious about!" },
  { keywords: ["danke", "dankeschön", "vielen dank", "thanks", "thank you", "merci", "thx"],
    de: "Gerne! 😊 Wenn du noch Fragen hast, bin ich hier. Viel Spaß bei der GIMME GIMME PARTY! 🎉",
    en: "You're welcome! 😊 If you have more questions, I'm here. Enjoy the GIMME GIMME PARTY! 🎉" },
  { keywords: ["tschüss", "bye", "ciao", "auf wiedersehen", "bis bald", "goodbye", "see you"],
    de: "Tschüss! 👋 Bis bald auf der GIMME GIMME PARTY! 🎶🕺",
    en: "Bye! 👋 See you at the GIMME GIMME PARTY! 🎶🕺" },
  { keywords: ["aftershow", "after show", "after party", "afterparty", "nachher", "danach", "weiter feiern", "after"],
    de: "Ob es eine Aftershow gibt, hängt von der Location ab. 🌙🎉",
    en: "Whether there's an aftershow depends on the venue. 🌙🎉" },
  { keywords: ["rauchen", "raucherbereich", "raucher", "smoking", "smoke", "zigarette", "cigarette", "vape"],
    de: "Das kommt auf die Location an. Bitte frage direkt bei der Location nach. 🚬",
    en: "This depends on the venue. Please ask the venue directly. 🚬" },
  { keywords: ["wiedereintritt", "wiedereinlass", "nochmal rein", "re-entry", "reentry", "re entry", "rausgehen"],
    de: "In der Regel gibt es keinen Wiedereintritt. Bitte klär das vorab mit der Location. 🚪",
    en: "Generally, there's no re-entry. Please check with the venue beforehand. 🚪" },
  { keywords: ["giveaway", "give away", "give-away", "merchandise", "merch", "fanartikel", "geschenk", "tuch", "haarreifen", "led", "gadget"],
    de: "Je nach Ticket-Kategorie bekommst du Give-Aways wie LED-Haareife, Tücher oder Stoffbänder! 🎁",
    en: "Depending on your ticket category, you'll get giveaways like LED headbands, scarves or fabric bands! 🎁" },
  { keywords: ["influencer", "creator", "content creator", "akkreditierung", "presse", "press", "journalist", "media pass"],
    de: "Du bist Influencer oder Content Creator? Möchtest du direkt mit einem Mitarbeiter darüber chatten? 📸",
    en: "You're an influencer or content creator? Would you like to chat with an agent directly? 📸" },
  { keywords: ["job", "jobs", "arbeiten", "mitarbeiter", "bewerben", "bewerbung", "work", "apply", "career", "hiring"],
    de: "Du willst Teil des Teams werden? 🎉 Schau auf unserer Jobs-Seite vorbei!",
    en: "Want to join the team? 🎉 Check out our jobs page!" },
  { keywords: ["sicherheit", "security", "notfall", "erste hilfe", "sanitäter", "safety", "emergency", "first aid"],
    de: "Deine Sicherheit ist uns wichtig! Jede Location hat Security und Notfallpläne. 🛡️",
    en: "Your safety matters! Every venue has security and emergency plans. 🛡️" },
  { keywords: ["wetter", "draußen", "outdoor", "open air", "regen", "weather", "outside", "rain"],
    de: "Unsere Events finden in der Regel indoor statt. Falls dein Event outdoor ist, findest du Infos auf der Event-Seite. ☀️",
    en: "Our events are usually indoors. If your event is outdoors, you'll find info on the event page. ☀️" },
  { keywords: ["alkohol", "getränke", "trinken", "drinks", "alcohol", "bar", "bier", "wein", "sekt", "cocktail", "beer", "wine"],
    de: "An der Bar der Location gibt's Getränke – Sekt, Aperol und Cocktails sind beliebt! 🍹",
    en: "Drinks are available at the venue's bar – prosecco, Aperol and cocktails are especially popular! 🍹" },
  { keywords: ["vip", "premium", "gold", "backstage", "upgrade"],
    de: "Es gibt verschiedene Ticket-Kategorien je nach Location. Schau im Ticketshop nach deinem Event! 🌟",
    en: "There are different ticket categories depending on the venue. Check the ticket shop for your event! 🌟" },
  { keywords: ["lohnt", "erfahrung", "bewertung", "review", "empfehl", "worth", "experience", "recommend"],
    de: "Unsere Gäste lieben es! ⭐ Komm vorbei und überzeug dich selbst!",
    en: "Our guests love it! ⭐ Come and see for yourself!" },
  { keywords: ["barrierefreiheit", "rollstuhl", "barrierefrei", "behindert", "wheelchair", "accessible", "disability"],
    de: "Die Barrierefreiheit hängt von der jeweiligen Location ab. Bitte kontaktiere die Location direkt. ♿",
    en: "Accessibility depends on the venue. Please contact the venue directly. ♿" },
  { keywords: ["einlass", "uhrzeit", "beginn", "anfang", "start", "türöffnung", "doors", "opening", "what time", "when does"],
    de: "Einlass und Startzeit variieren je Location. Die genauen Zeiten stehen auf deinem Ticket und unserer Termine-Seite! ⏰",
    en: "Doors and start time vary by venue. Exact times are on your ticket and our events page! ⏰" },
  { keywords: ["partner", "kooperation", "zusammenarbeit", "sponsor", "sponsoring", "partnership", "collaborate"],
    de: "Interessiert an einer Partnerschaft? Möchtest du direkt mit einem Mitarbeiter darüber chatten? 🤝",
    en: "Interested in a partnership? Would you like to chat with an agent directly? 🤝" },
  { keywords: ["mitarbeiter", "agent", "mensch", "person", "real person", "human", "live chat", "chat starten"],
    de: "ESCALATE",
    en: "ESCALATE" },
];

function detectLanguage(input: string): "de" | "en" {
  const enWords = ["the", "is", "are", "how", "what", "where", "when", "can", "do", "does", "my", "your", "please", "thanks", "thank", "hello", "hi", "hey", "want", "need", "would", "could", "have", "will"];
  const words = input.toLowerCase().split(/\s+/);
  const enCount = words.filter(w => enWords.includes(w)).length;
  return enCount >= 2 ? "en" : "de";
}

function findAnswer(input: string): { text: string; escalate: boolean } {
  const lang = detectLanguage(input);
  const q = input.toLowerCase().replace(/[?!.,;:'"]/g, "");
  const words = q.split(/\s+/).filter(w => w.length > 2);

  let bestScore = 0;
  let bestAnswer = "";

  for (const entry of kb) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        score += kw.length * 4;
      } else {
        for (const w of words) {
          if (kw.includes(w) && w.length > 3) score += w.length;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry[lang];
    }
  }

  if (bestScore >= 6) {
    if (bestAnswer === "ESCALATE") {
      return { text: "", escalate: true };
    }
    return { text: bestAnswer, escalate: false };
  }

  return { text: "", escalate: true };
}

type ChatMode = "bot" | "live" | "offline-form";
type FormStep = "issue" | "email" | "phone" | "done";

export default function SupportChatbot() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { from: "bot", text: "Hallo 👋 Ich bin James, dein Support-Bot für die GIMME GIMME PARTY, und ich helfe dir gerne weiter." },
  ]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [mode, setMode] = useState<ChatMode>("bot");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<FormStep>("issue");
  const [formData, setFormData] = useState({ issue: "", email: "", phone: "", name: "" });
  const [supportOnline, setSupportOnline] = useState(false);
  const [noAnswerCount, setNoAnswerCount] = useState(0);

  // Check support online status
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "support_online").maybeSingle();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        setSupportOnline(!!(data.value as Record<string, unknown>).online);
      }
    };
    check();
    // Re-check every 30s
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Realtime messages for live chat
  useEffect(() => {
    if (!ticketId || mode !== "live") return;
    const ch = supabase.channel(`chat-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        const msg = payload.new as { sender_type: string; content: string; is_internal: boolean };
        if (msg.sender_type === "admin" && !msg.is_internal) {
          setChatMessages(prev => [...prev, { from: "admin", text: msg.content }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticketId, mode]);

  const quickReplies = [
    { label: "🎫 Tickets", query: "Wo kann ich Tickets kaufen?" },
    { label: "📅 Termine", query: "Wann und wo findet die Party statt?" },
    { label: "👯 Gruppen/JGA", query: "Kann ich als Gruppe kommen?" },
    { label: "💬 Live Chat", query: "Ich möchte mit einem Mitarbeiter chatten" },
  ];

  const startLiveChat = useCallback(async (initialMessage?: string) => {
    if (supportOnline) {
      // Create ticket and start live chat
      const { data } = await supabase.from("support_tickets").insert([{
        subject: initialMessage || "Live-Chat Anfrage",
        customer_email: "chat@visitor.local",
        category: "support" as const,
        source: "chat",
      }]).select().single();

      if (data) {
        setTicketId(data.id);
        setMode("live");
        setChatMessages(prev => [
          ...prev,
          { from: "system", text: "Du bist jetzt mit einem Mitarbeiter verbunden. 🟢" },
        ]);
        // Send initial message if any
        if (initialMessage) {
          await supabase.from("support_messages").insert([{
            ticket_id: data.id,
            sender_type: "customer",
            content: initialMessage,
          }]);
        }
      }
    } else {
      // Offline: collect info
      setMode("offline-form");
      setFormStep("issue");
      setChatMessages(prev => [
        ...prev,
        { from: "bot", text: "Aktuell sind leider alle Mitarbeiter im Gespräch. 😊 Damit wir uns schnellstmöglich bei dir melden können, schildere bitte kurz dein Anliegen:" },
      ]);
    }
  }, [supportOnline]);

  const handleOfflineForm = useCallback(async (input: string) => {
    if (formStep === "issue") {
      setFormData(prev => ({ ...prev, issue: input }));
      setChatMessages(prev => [
        ...prev,
        { from: "user", text: input },
        { from: "bot", text: "Danke! Bitte gib uns deine E-Mail-Adresse, damit wir dich kontaktieren können: 📧" },
      ]);
      setFormStep("email");
    } else if (formStep === "email") {
      setFormData(prev => ({ ...prev, email: input }));
      setChatMessages(prev => [
        ...prev,
        { from: "user", text: input },
        { from: "bot", text: "Und optional deine Telefonnummer, falls wir dich anrufen sollen (oder schreib 'weiter' zum Überspringen): 📱" },
      ]);
      setFormStep("phone");
    } else if (formStep === "phone") {
      const phone = input.toLowerCase() === "weiter" || input.toLowerCase() === "skip" ? "" : input;
      setFormData(prev => ({ ...prev, phone }));

      // Create ticket
      const { error } = await supabase.from("support_tickets").insert([{
        subject: formData.issue.substring(0, 100),
        customer_email: formData.email,
        category: "support" as const,
        source: "chat",
        metadata: { phone, full_issue: formData.issue },
      }]);

      if (!error) {
        // Also save the message
        setChatMessages(prev => [
          ...prev,
          { from: "user", text: input },
          { from: "bot", text: "Vielen Dank! ✅ Wir haben dein Anliegen erhalten und melden uns zeitnah bei dir. Schönen Tag noch! 🎉" },
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          { from: "user", text: input },
          { from: "bot", text: "Entschuldigung, es gab einen Fehler. Bitte versuche es später erneut. 😔" },
        ]);
      }
      setFormStep("done");
      setMode("bot");
    }
  }, [formStep, formData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleQuickReply = (query: string) => {
    setShowQuickReplies(false);
    setChatMessages(prev => [...prev, { from: "user", text: query }]);

    if (query.includes("Mitarbeiter")) {
      setTimeout(() => startLiveChat(), 400);
      return;
    }

    const { text, escalate } = findAnswer(query);
    if (escalate) {
      setTimeout(() => startLiveChat(query), 400);
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { from: "bot", text }]);
      }, 400);
    }
  };

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
      await supabase.from("support_messages").insert([{
        ticket_id: ticketId,
        sender_type: "customer",
        content: userText,
      }]);
      return;
    }

    // Bot mode
    setChatMessages(prev => [...prev, { from: "user", text: userText }]);
    const { text, escalate } = findAnswer(userText);

    if (escalate) {
      const newCount = noAnswerCount + 1;
      setNoAnswerCount(newCount);

      if (newCount >= 2) {
        // After 2 unanswered questions, offer live chat
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            from: "bot",
            text: "Hmm, da kann ich dir leider nicht weiterhelfen. 🤔 Soll ich dich mit einem Mitarbeiter verbinden?"
          }]);
        }, 400);
      } else {
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            from: "bot",
            text: "Da bin ich mir nicht ganz sicher. 🤔 Hast du noch eine andere Frage, oder soll ich dich mit einem Mitarbeiter verbinden?"
          }]);
        }, 400);
      }
    } else {
      setNoAnswerCount(0);
      setTimeout(() => {
        setChatMessages(prev => [...prev, { from: "bot", text }]);
      }, 400);
    }
  };

  // Check for "ja" / "yes" to escalation prompt
  useEffect(() => {
    const last = chatMessages[chatMessages.length - 1];
    const prev = chatMessages[chatMessages.length - 2];
    if (last?.from === "user" && prev?.from === "bot" && prev.text.includes("Mitarbeiter verbinden")) {
      const q = last.text.toLowerCase();
      if (q.includes("ja") || q.includes("yes") || q.includes("bitte") || q.includes("gerne") || q.includes("klar") || q.includes("sure")) {
        startLiveChat(formData.issue || chatMessages.filter(m => m.from === "user").map(m => m.text).join(" | "));
      }
    }
  }, [chatMessages, startLiveChat, formData.issue]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {chatOpen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-80 sm:w-96 h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: "hsl(220 50% 12%)",
            border: "1px solid hsl(0 0% 100% / 0.1)",
          }}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center gap-3"
            style={{ background: mode === "live" ? "hsl(142 70% 35%)" : "hsl(330 80% 50%)" }}
          >
            {mode === "live" ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            <div>
              <p className="font-semibold text-white text-sm">{mode === "live" ? "Live Support" : "James"}</p>
              <p className="text-xs text-white/70">
                {mode === "live" ? "Verbunden mit Mitarbeiter" : "GIMME GIMME Support"}
              </p>
            </div>
            {mode === "live" && (
              <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
            <button
              onClick={() => setChatOpen(false)}
              className="ml-auto text-white/70 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : m.from === "system" ? "justify-center" : "justify-start"}`}
              >
                {m.from === "system" ? (
                  <span
                    className="text-xs italic px-3 py-1 rounded-full text-center"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.5)" }}
                  >
                    {m.text}
                  </span>
                ) : (
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line"
                    style={{
                      background: m.from === "user" ? "hsl(330 80% 50%)"
                        : m.from === "admin" ? "hsl(142 70% 35% / 0.3)"
                        : "hsl(0 0% 100% / 0.08)",
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
            {showQuickReplies && mode === "bot" && (
              <div className="flex flex-wrap gap-2 mt-1">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => handleQuickReply(qr.query)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: "hsl(330 80% 50% / 0.15)",
                      color: "hsl(330 80% 65%)",
                      border: "1px solid hsl(330 80% 50% / 0.3)",
                    }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
            {/* Escalation button when bot can't answer */}
            {mode === "bot" && noAnswerCount >= 1 && (
              <button
                onClick={() => startLiveChat()}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: supportOnline ? "hsl(142 70% 45% / 0.15)" : "hsl(200 80% 55% / 0.15)",
                  color: supportOnline ? "hsl(142 70% 55%)" : "hsl(200 80% 60%)",
                  border: supportOnline ? "1px solid hsl(142 70% 45% / 0.3)" : "1px solid hsl(200 80% 55% / 0.3)",
                }}
              >
                {supportOnline ? "🟢 Mit Mitarbeiter chatten" : "📝 Nachricht hinterlassen"}
              </button>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleChat}
            className="p-3 flex gap-2"
            style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
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
              style={{
                background: "hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.1)",
              }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: mode === "live" ? "hsl(142 70% 40%)" : "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="rounded-xl px-4 py-2 shadow-lg hidden sm:block"
            style={{
              background: "hsl(220 50% 15%)",
              border: "1px solid hsl(0 0% 100% / 0.1)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 100%)" }}>
              Fragen? James hilft! 💬
            </p>
          </motion.div>
          <button
            onClick={() => setChatOpen(true)}
            className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(330 80% 50%), hsl(330 80% 40%))",
              color: "hsl(0 0% 100%)",
            }}
            aria-label="Support Chat öffnen"
          >
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "hsl(330 80% 50% / 0.3)" }}
            />
            <MessageCircle className="w-7 h-7 relative z-10" />
          </button>
        </div>
      )}
    </div>
  );
}
