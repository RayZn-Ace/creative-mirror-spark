/* ─── Internationalization for City Pages ─── */

export type LangCode = "de" | "nl" | "fr" | "pl" | "hr" | "pt" | "en";

export interface Translations {
  // Hero
  tourSubtitle: string;
  from: string; // "AB"
  clock: string; // "UHR"
  selectDate: string;
  // Date tiles
  soldOutLabel: string;
  // Ticket widget
  reservedFor: string;
  soldOutTitle: string;
  soldOutDesc: string;
  ticketsLoading: string;
  discountPlaceholder: string;
  discountApply: string;
  discountApplied: string;
  continueBtn: string;
  inclVat: string;
  // Info sections
  eventInfoTitle: string;
  eventInfoContent: (weekday: string, date: string, venue: string, address: string, time: string) => string;
  admissionTitle: string;
  admissionContent: string;
  freeTicketsTitle: string;
  whatsappJoin: string;
  whatsappDesc: string;
  // Nearby
  moreCities: string;
  moreCitiesDesc: string;
  kmAway: string;
  // Footer
  footerQuestion: string;
  footerContact: string;
  footerOrganizer: string;
  imprint: string;
  privacy: string;
  terms: string;
  // Loading
  loading: string;
  // Weekdays
  weekdays: string[];
  // Months short
  monthsShort: string[];
}

const de: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "AB",
  clock: "UHR",
  selectDate: "Wähle deinen Termin",
  soldOutLabel: "Ausverkauft",
  reservedFor: "Reserviert für:",
  soldOutTitle: "AUSVERKAUFT",
  soldOutDesc: "Dieses Event ist leider ausverkauft. Schau dir unsere anderen Termine an!",
  ticketsLoading: "Tickets laden...",
  discountPlaceholder: "Rabattcode eingeben",
  discountApply: "Einlösen",
  discountApplied: "✓ Code wird beim Checkout geprüft",
  continueBtn: "WEITER",
  inclVat: "inkl. MwSt.",
  eventInfoTitle: "Eventinformationen",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – DAS FANKONZERT! 🎶\n\nBei der Mamma Mia Party feiern wir die größten Songs von ABBA – und zwar gemeinsam mit EUCH! 🎤 ✨\n\nVon „Dancing Queen" über „Mamma Mia" bis „Waterloo" – wir spielen alle Kult-Hits live vom DJ-Pult zum Mitsingen, Tanzen und Feiern.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Beginn: ${time} Uhr\n\n🪩 DRESSCODE:\nGlitzer, Mamma Mia oder ABBA-Bezug! (Kein Muss, aber gerne gesehen)`,
  admissionTitle: "Einlassinformationen",
  admissionContent: "✅ Einlass ab 18 Jahren – Ausnahmen nur nach Absprache mit der Location.\n\n✅ Wir starten mit der Show, sobald der größte Teil des Einlasses durch ist. Bis dahin laufen bekannte Partysongs zum Mitsingen.\n\n✅ Der Einlass dauert in der Regel nicht länger als 30 Minuten.\n\n✅ Dein Ticket brauchst du nicht auszudrucken – es reicht digital auf deinem Handy.",
  freeTicketsTitle: "Freikarten & mehr?",
  whatsappJoin: "Jetzt beitreten",
  whatsappDesc: "Werde Teil unserer WhatsApp-Community.",
  moreCities: "🎶 Weitere Städte",
  moreCitiesDesc: "Sichere dir jetzt Tickets für weitere Städte",
  kmAway: "km entfernt",
  footerQuestion: "Fragen, Probleme oder Reservierungsanfragen?",
  footerContact: "Kontaktiere uns:",
  footerOrganizer: "Veranstalter: Gimme Gimme Party.",
  imprint: "Impressum",
  privacy: "Datenschutz",
  terms: "AGB",
  loading: "Laden...",
  weekdays: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  monthsShort: ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
};

const nl: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "VANAF",
  clock: "UUR",
  selectDate: "Kies je datum",
  soldOutLabel: "Uitverkocht",
  reservedFor: "Gereserveerd voor:",
  soldOutTitle: "UITVERKOCHT",
  soldOutDesc: "Dit evenement is helaas uitverkocht. Bekijk onze andere data!",
  ticketsLoading: "Tickets laden...",
  discountPlaceholder: "Kortingscode invoeren",
  discountApply: "Toepassen",
  discountApplied: "✓ Code wordt bij de checkout gecontroleerd",
  continueBtn: "VERDER",
  inclVat: "incl. btw",
  eventInfoTitle: "Evenementinformatie",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – HET FANCONCERT! 🎶\n\nBij het Mamma Mia feest vieren we de grootste hits van ABBA – samen met JULLIE! 🎤 ✨\n\nVan "Dancing Queen" tot "Mamma Mia" en "Waterloo" – we spelen alle culthits live om mee te zingen, dansen en feesten.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Aanvang: ${time} uur\n\n🪩 DRESSCODE:\nGlitter, Mamma Mia of ABBA-thema! (Geen verplichting, maar wel leuk)`,
  admissionTitle: "Toegangsinformatie",
  admissionContent: "✅ Toegang vanaf 18 jaar – uitzonderingen alleen in overleg met de locatie.\n\n✅ We beginnen met de show zodra het grootste deel binnen is. Tot die tijd draaien we bekende meezingers.\n\n✅ De inlaat duurt doorgaans niet langer dan 30 minuten.\n\n✅ Je hoeft je ticket niet af te drukken – digitaal op je telefoon is voldoende.",
  freeTicketsTitle: "Gratis kaarten & meer?",
  whatsappJoin: "Nu deelnemen",
  whatsappDesc: "Word lid van onze WhatsApp-community.",
  moreCities: "🎶 Meer steden",
  moreCitiesDesc: "Bestel nu tickets voor andere steden",
  kmAway: "km verwijderd",
  footerQuestion: "Vragen, problemen of reserveringsverzoeken?",
  footerContact: "Neem contact op:",
  footerOrganizer: "Organisator: Gimme Gimme Party.",
  imprint: "Colofon",
  privacy: "Privacybeleid",
  terms: "Algemene voorwaarden",
  loading: "Laden...",
  weekdays: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  monthsShort: ["", "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
};

const fr: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "DÈS",
  clock: "H",
  selectDate: "Choisis ta date",
  soldOutLabel: "Épuisé",
  reservedFor: "Réservé pour :",
  soldOutTitle: "ÉPUISÉ",
  soldOutDesc: "Cet événement est malheureusement complet. Découvre nos autres dates !",
  ticketsLoading: "Chargement des billets...",
  discountPlaceholder: "Entrer un code promo",
  discountApply: "Appliquer",
  discountApplied: "✓ Le code sera vérifié au moment du paiement",
  continueBtn: "CONTINUER",
  inclVat: "TTC",
  eventInfoTitle: "Informations sur l'événement",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – LE CONCERT DES FANS ! 🎶\n\nLors de la Mamma Mia Party, nous célébrons les plus grands tubes d'ABBA – tous ensemble ! 🎤 ✨\n\nDe « Dancing Queen » à « Mamma Mia » en passant par « Waterloo » – tous les tubes cultes en live pour chanter, danser et faire la fête.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Début : ${time}h\n\n🪩 DRESS CODE :\nPaillettes, Mamma Mia ou thème ABBA ! (Pas obligatoire, mais apprécié)`,
  admissionTitle: "Informations d'entrée",
  admissionContent: "✅ Entrée à partir de 18 ans – exceptions uniquement en accord avec le lieu.\n\n✅ Le spectacle commence dès que la majorité du public est entrée. En attendant, des tubes connus sont diffusés.\n\n✅ L'entrée ne dure généralement pas plus de 30 minutes.\n\n✅ Pas besoin d'imprimer ton billet – le format numérique sur ton téléphone suffit.",
  freeTicketsTitle: "Places gratuites & plus ?",
  whatsappJoin: "Rejoins-nous",
  whatsappDesc: "Fais partie de notre communauté WhatsApp.",
  moreCities: "🎶 Autres villes",
  moreCitiesDesc: "Réserve maintenant des billets pour d'autres villes",
  kmAway: "km de distance",
  footerQuestion: "Questions, problèmes ou demandes de réservation ?",
  footerContact: "Contacte-nous :",
  footerOrganizer: "Organisateur : Gimme Gimme Party.",
  imprint: "Mentions légales",
  privacy: "Politique de confidentialité",
  terms: "CGV",
  loading: "Chargement...",
  weekdays: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  monthsShort: ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
};

const pl: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "OD",
  clock: "",
  selectDate: "Wybierz datę",
  soldOutLabel: "Wyprzedane",
  reservedFor: "Zarezerwowano na:",
  soldOutTitle: "WYPRZEDANE",
  soldOutDesc: "To wydarzenie jest niestety wyprzedane. Sprawdź inne terminy!",
  ticketsLoading: "Ładowanie biletów...",
  discountPlaceholder: "Wpisz kod rabatowy",
  discountApply: "Zastosuj",
  discountApplied: "✓ Kod zostanie sprawdzony przy kasie",
  continueBtn: "DALEJ",
  inclVat: "brutto",
  eventInfoTitle: "Informacje o wydarzeniu",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – KONCERT FANÓW! 🎶\n\nNa Mamma Mia Party świętujemy największe hity ABBA – razem z WAMI! 🎤 ✨\n\nOd „Dancing Queen" przez „Mamma Mia" po „Waterloo" – gramy wszystkie kultowe hity na żywo do wspólnego śpiewania, tańczenia i zabawy.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Początek: ${time}\n\n🪩 DRESS CODE:\nBrokat, Mamma Mia lub motyw ABBA! (Nieobowiązkowe, ale mile widziane)`,
  admissionTitle: "Informacje o wejściu",
  admissionContent: "✅ Wejście od 18 lat – wyjątki tylko po uzgodnieniu z lokalizacją.\n\n✅ Show rozpoczyna się, gdy większość publiczności wejdzie. Do tego czasu grają znane hity do wspólnego śpiewania.\n\n✅ Wejście trwa zazwyczaj nie dłużej niż 30 minut.\n\n✅ Nie musisz drukować biletu – wystarczy wersja cyfrowa na telefonie.",
  freeTicketsTitle: "Darmowe bilety i więcej?",
  whatsappJoin: "Dołącz teraz",
  whatsappDesc: "Dołącz do naszej społeczności WhatsApp.",
  moreCities: "🎶 Więcej miast",
  moreCitiesDesc: "Kup teraz bilety na inne miasta",
  kmAway: "km stąd",
  footerQuestion: "Pytania, problemy lub prośby o rezerwację?",
  footerContact: "Skontaktuj się z nami:",
  footerOrganizer: "Organizator: Gimme Gimme Party.",
  imprint: "Impressum",
  privacy: "Polityka prywatności",
  terms: "Regulamin",
  loading: "Ładowanie...",
  weekdays: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
  monthsShort: ["", "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"],
};

const hr: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "OD",
  clock: "SATI",
  selectDate: "Odaberi datum",
  soldOutLabel: "Rasprodano",
  reservedFor: "Rezervirano za:",
  soldOutTitle: "RASPRODANO",
  soldOutDesc: "Ovaj događaj je nažalost rasprodan. Pogledaj naše druge termine!",
  ticketsLoading: "Učitavanje ulaznica...",
  discountPlaceholder: "Unesi kod za popust",
  discountApply: "Primijeni",
  discountApplied: "✓ Kod će biti provjeren prilikom plaćanja",
  continueBtn: "NASTAVI",
  inclVat: "s PDV-om",
  eventInfoTitle: "Informacije o događaju",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – FAN KONCERT! 🎶\n\nNa Mamma Mia Partyju slavimo najveće hitove ABBA-e – zajedno s VAMA! 🎤 ✨\n\nOd „Dancing Queen" preko „Mamma Mia" do „Waterloo" – sviramo sve kultne hitove uživo za pjevanje, ples i zabavu.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Početak: ${time}\n\n🪩 DRESS CODE:\nŠljokice, Mamma Mia ili ABBA tema! (Nije obavezno, ali je dobrodošlo)`,
  admissionTitle: "Informacije o ulazu",
  admissionContent: "✅ Ulaz od 18 godina – iznimke samo u dogovoru s lokacijom.\n\n✅ Show počinje čim većina publike uđe. Do tada sviraju poznati hitovi za pjevanje.\n\n✅ Ulaz obično ne traje duže od 30 minuta.\n\n✅ Ulaznicu ne trebaš ispisati – dovoljna je digitalna verzija na mobitelu.",
  freeTicketsTitle: "Besplatne ulaznice i više?",
  whatsappJoin: "Pridruži se sada",
  whatsappDesc: "Postani dio naše WhatsApp zajednice.",
  moreCities: "🎶 Više gradova",
  moreCitiesDesc: "Osiguraj ulaznice za druge gradove",
  kmAway: "km daleko",
  footerQuestion: "Pitanja, problemi ili zahtjevi za rezervaciju?",
  footerContact: "Kontaktiraj nas:",
  footerOrganizer: "Organizator: Gimme Gimme Party.",
  imprint: "Impressum",
  privacy: "Pravila privatnosti",
  terms: "Uvjeti korištenja",
  loading: "Učitavanje...",
  weekdays: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
  monthsShort: ["", "Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro"],
};

const pt: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "A PARTIR DAS",
  clock: "H",
  selectDate: "Escolha sua data",
  soldOutLabel: "Esgotado",
  reservedFor: "Reservado por:",
  soldOutTitle: "ESGOTADO",
  soldOutDesc: "Este evento está esgotado. Confira nossas outras datas!",
  ticketsLoading: "Carregando ingressos...",
  discountPlaceholder: "Inserir código de desconto",
  discountApply: "Aplicar",
  discountApplied: "✓ O código será verificado no checkout",
  continueBtn: "CONTINUAR",
  inclVat: "impostos incl.",
  eventInfoTitle: "Informações do evento",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – O SHOW DOS FÃS! 🎶\n\nNa Mamma Mia Party celebramos os maiores hits do ABBA – junto com VOCÊS! 🎤 ✨\n\nDe "Dancing Queen" a "Mamma Mia" e "Waterloo" – tocamos todos os hits ao vivo para cantar, dançar e festejar.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Início: ${time}h\n\n🪩 DRESS CODE:\nBrilho, Mamma Mia ou tema ABBA! (Não é obrigatório, mas é bem-vindo)`,
  admissionTitle: "Informações de entrada",
  admissionContent: "✅ Entrada a partir de 18 anos – exceções apenas em acordo com o local.\n\n✅ O show começa quando a maior parte do público entrar. Até lá, tocam hits famosos para cantar junto.\n\n✅ A entrada geralmente não leva mais de 30 minutos.\n\n✅ Não precisa imprimir o ingresso – a versão digital no celular é suficiente.",
  freeTicketsTitle: "Ingressos grátis e mais?",
  whatsappJoin: "Participe agora",
  whatsappDesc: "Faça parte da nossa comunidade WhatsApp.",
  moreCities: "🎶 Mais cidades",
  moreCitiesDesc: "Garanta ingressos para outras cidades",
  kmAway: "km de distância",
  footerQuestion: "Dúvidas, problemas ou pedidos de reserva?",
  footerContact: "Entre em contato:",
  footerOrganizer: "Organizador: Gimme Gimme Party.",
  imprint: "Informações legais",
  privacy: "Política de privacidade",
  terms: "Termos e condições",
  loading: "Carregando...",
  weekdays: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  monthsShort: ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
};

const en: Translations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR",
  from: "FROM",
  clock: "",
  selectDate: "Choose your date",
  soldOutLabel: "Sold Out",
  reservedFor: "Reserved for:",
  soldOutTitle: "SOLD OUT",
  soldOutDesc: "This event is unfortunately sold out. Check out our other dates!",
  ticketsLoading: "Loading tickets...",
  discountPlaceholder: "Enter discount code",
  discountApply: "Apply",
  discountApplied: "✓ Code will be verified at checkout",
  continueBtn: "CONTINUE",
  inclVat: "incl. VAT",
  eventInfoTitle: "Event information",
  eventInfoContent: (weekday, date, venue, address, time) =>
    `🎉 MAMMA MIA PARTY – THE FAN CONCERT! 🎶\n\nAt the Mamma Mia Party we celebrate the greatest ABBA hits – together with YOU! 🎤 ✨\n\nFrom "Dancing Queen" to "Mamma Mia" and "Waterloo" – we play all the iconic hits live for singing, dancing and partying.\n\n📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 Start: ${time}\n\n🪩 DRESS CODE:\nGlitter, Mamma Mia or ABBA theme! (Not required, but welcome)`,
  admissionTitle: "Admission information",
  admissionContent: "✅ Entry from 18 years – exceptions only by arrangement with the venue.\n\n✅ The show starts once the majority of the audience has entered. Until then, popular singalong hits will be played.\n\n✅ Entry usually takes no longer than 30 minutes.\n\n✅ You don't need to print your ticket – the digital version on your phone is sufficient.",
  freeTicketsTitle: "Free tickets & more?",
  whatsappJoin: "Join now",
  whatsappDesc: "Become part of our WhatsApp community.",
  moreCities: "🎶 More cities",
  moreCitiesDesc: "Get tickets for other cities now",
  kmAway: "km away",
  footerQuestion: "Questions, problems or reservation requests?",
  footerContact: "Contact us:",
  footerOrganizer: "Organizer: Gimme Gimme Party.",
  imprint: "Legal notice",
  privacy: "Privacy policy",
  terms: "Terms & conditions",
  loading: "Loading...",
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  monthsShort: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const translations: Record<LangCode, Translations> = { de, nl, fr, pl, hr, pt, en };

/* ─── City → Language mapping ─── */
const CITY_LANG: Record<string, LangCode> = {
  Amsterdam: "nl", Rotterdam: "nl", Utrecht: "nl",
  Antwerpen: "nl",
  Paris: "fr", "Le Havre": "fr", Mathay: "fr",
  Luxembourg: "fr",
  Krakow: "pl",
  Zadar: "hr",
  "São Paulo": "pt",
};

export const getLangForCity = (city: string): LangCode => CITY_LANG[city] || "de";

export const getTranslations = (city: string): Translations => {
  const lang = getLangForCity(city);
  return translations[lang];
};

export const getCurrencyForCity = (city: string): string => {
  const lang = getLangForCity(city);
  switch (lang) {
    case "pl": return "PLN";
    case "hr": return "HRK";
    case "pt": return "BRL";
    default: return "EUR";
  }
};
