/* ─── Internationalization for City Pages ─── */

export type LangCode =
  | "de" | "nl" | "fr" | "pl" | "hr" | "pt" | "en"
  | "it" | "es" | "cs" | "da" | "sv" | "no" | "fi"
  | "hu" | "ro" | "bg" | "el" | "tr" | "sr" | "sl"
  | "sk" | "lt" | "lv" | "et" | "ru" | "uk" | "sq"
  | "bs" | "ka" | "ja" | "ko" | "zh" | "ar" | "th";

export interface Translations {
  tourSubtitle: string;
  from: string;
  clock: string;
  selectDate: string;
  soldOutLabel: string;
  reservedFor: string;
  soldOutTitle: string;
  soldOutDesc: string;
  soldOutBadge: string;
  comingSoonLabel: string;
  ticketsLoading: string;
  discountPlaceholder: string;
  discountApply: string;
  discountApplied: string;
  continueBtn: string;
  inclVat: string;
  eventInfoTitle: string;
  eventInfoContent: (weekday: string, date: string, venue: string, address: string, time: string) => string;
  admissionTitle: string;
  admissionContent: string;
  freeTicketsTitle: string;
  whatsappJoin: string;
  whatsappDesc: string;
  moreCities: string;
  moreCitiesDesc: string;
  kmAway: string;
  footerQuestion: string;
  footerContact: string;
  footerOrganizer: string;
  imprint: string;
  privacy: string;
  terms: string;
  loading: string;
  weekdays: string[];
  monthsShort: string[];
  badgeMap: Record<string, string>;
  ticketDescMap: Record<string, string>;
  // Checkout
  checkoutTitle: string;
  namePlaceholder: string;
  birthDatePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  backBtn: string;
  payNowBtn: string;
  checkoutLoadingBtn: string;
  invalidEmail: string;
}

/* ─── Helper: build eventInfoContent for any language ─── */
const makeEventInfo = (
  _partyLine: string, _introLine: string, _hitsLine: string, _dressIntro: string, _dressDesc: string, startLabel: string, timeUnit: string
) => (weekday: string, date: string, venue: string, address: string, time: string) =>
  `📅 ${weekday}, ${date}\n📍 ${venue} – ${address}\n🕐 ${startLabel}: ${time}${timeUnit}`;

/* ─── Checkout translations per language ─── */
const checkoutI18n: Record<string, Pick<Translations, "checkoutTitle" | "namePlaceholder" | "birthDatePlaceholder" | "emailPlaceholder" | "phonePlaceholder" | "backBtn" | "payNowBtn" | "checkoutLoadingBtn" | "invalidEmail">> = {
  de: { checkoutTitle: "Checkout", namePlaceholder: "Name *", birthDatePlaceholder: "Geburtsdatum *", emailPlaceholder: "E-Mail *", phonePlaceholder: "Telefon", backBtn: "Zurück", payNowBtn: "Jetzt bezahlen", checkoutLoadingBtn: "Wird geladen...", invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein." },
  nl: { checkoutTitle: "Afrekenen", namePlaceholder: "Naam *", birthDatePlaceholder: "Geboortedatum *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefoon", backBtn: "Terug", payNowBtn: "Nu betalen", checkoutLoadingBtn: "Laden...", invalidEmail: "Voer een geldig e-mailadres in." },
  fr: { checkoutTitle: "Paiement", namePlaceholder: "Nom *", birthDatePlaceholder: "Date de naissance *", emailPlaceholder: "E-mail *", phonePlaceholder: "Téléphone", backBtn: "Retour", payNowBtn: "Payer maintenant", checkoutLoadingBtn: "Chargement...", invalidEmail: "Veuillez entrer une adresse e-mail valide." },
  en: { checkoutTitle: "Checkout", namePlaceholder: "Name *", birthDatePlaceholder: "Date of birth *", emailPlaceholder: "Email *", phonePlaceholder: "Phone", backBtn: "Back", payNowBtn: "Pay now", checkoutLoadingBtn: "Loading...", invalidEmail: "Please enter a valid email address." },
  pl: { checkoutTitle: "Kasa", namePlaceholder: "Imię i nazwisko *", birthDatePlaceholder: "Data urodzenia *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Wstecz", payNowBtn: "Zapłać teraz", checkoutLoadingBtn: "Ładowanie...", invalidEmail: "Podaj prawidłowy adres e-mail." },
  hr: { checkoutTitle: "Plaćanje", namePlaceholder: "Ime *", birthDatePlaceholder: "Datum rođenja *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Natrag", payNowBtn: "Plati sada", checkoutLoadingBtn: "Učitavanje...", invalidEmail: "Unesi valjanu e-mail adresu." },
  pt: { checkoutTitle: "Pagamento", namePlaceholder: "Nome *", birthDatePlaceholder: "Data de nascimento *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefone", backBtn: "Voltar", payNowBtn: "Pagar agora", checkoutLoadingBtn: "Carregando...", invalidEmail: "Insira um e-mail válido." },
  it: { checkoutTitle: "Pagamento", namePlaceholder: "Nome *", birthDatePlaceholder: "Data di nascita *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefono", backBtn: "Indietro", payNowBtn: "Paga ora", checkoutLoadingBtn: "Caricamento...", invalidEmail: "Inserisci un indirizzo e-mail valido." },
  es: { checkoutTitle: "Pago", namePlaceholder: "Nombre *", birthDatePlaceholder: "Fecha de nacimiento *", emailPlaceholder: "Correo *", phonePlaceholder: "Teléfono", backBtn: "Volver", payNowBtn: "Pagar ahora", checkoutLoadingBtn: "Cargando...", invalidEmail: "Introduce un correo electrónico válido." },
  cs: { checkoutTitle: "Platba", namePlaceholder: "Jméno *", birthDatePlaceholder: "Datum narození *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Zpět", payNowBtn: "Zaplatit", checkoutLoadingBtn: "Načítání...", invalidEmail: "Zadej platný e-mail." },
  da: { checkoutTitle: "Betaling", namePlaceholder: "Navn *", birthDatePlaceholder: "Fødselsdato *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Tilbage", payNowBtn: "Betal nu", checkoutLoadingBtn: "Indlæser...", invalidEmail: "Indtast en gyldig e-mailadresse." },
  sv: { checkoutTitle: "Betalning", namePlaceholder: "Namn *", birthDatePlaceholder: "Födelsedatum *", emailPlaceholder: "E-post *", phonePlaceholder: "Telefon", backBtn: "Tillbaka", payNowBtn: "Betala nu", checkoutLoadingBtn: "Laddar...", invalidEmail: "Ange en giltig e-postadress." },
  no: { checkoutTitle: "Betaling", namePlaceholder: "Navn *", birthDatePlaceholder: "Fødselsdato *", emailPlaceholder: "E-post *", phonePlaceholder: "Telefon", backBtn: "Tilbake", payNowBtn: "Betal nå", checkoutLoadingBtn: "Laster...", invalidEmail: "Skriv inn en gyldig e-postadresse." },
  fi: { checkoutTitle: "Maksu", namePlaceholder: "Nimi *", birthDatePlaceholder: "Syntymäaika *", emailPlaceholder: "Sähköposti *", phonePlaceholder: "Puhelin", backBtn: "Takaisin", payNowBtn: "Maksa nyt", checkoutLoadingBtn: "Ladataan...", invalidEmail: "Anna kelvollinen sähköpostiosoite." },
  hu: { checkoutTitle: "Fizetés", namePlaceholder: "Név *", birthDatePlaceholder: "Születési dátum *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Vissza", payNowBtn: "Fizess most", checkoutLoadingBtn: "Betöltés...", invalidEmail: "Adj meg érvényes e-mail címet." },
  ro: { checkoutTitle: "Plată", namePlaceholder: "Nume *", birthDatePlaceholder: "Data nașterii *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Înapoi", payNowBtn: "Plătește acum", checkoutLoadingBtn: "Se încarcă...", invalidEmail: "Introduceți o adresă de e-mail validă." },
  bg: { checkoutTitle: "Плащане", namePlaceholder: "Име *", birthDatePlaceholder: "Дата на раждане *", emailPlaceholder: "Имейл *", phonePlaceholder: "Телефон", backBtn: "Назад", payNowBtn: "Плати сега", checkoutLoadingBtn: "Зареждане...", invalidEmail: "Въведете валиден имейл адрес." },
  el: { checkoutTitle: "Πληρωμή", namePlaceholder: "Όνομα *", birthDatePlaceholder: "Ημερομηνία γέννησης *", emailPlaceholder: "Email *", phonePlaceholder: "Τηλέφωνο", backBtn: "Πίσω", payNowBtn: "Πληρωμή τώρα", checkoutLoadingBtn: "Φόρτωση...", invalidEmail: "Εισάγετε μια έγκυρη διεύθυνση email." },
  tr: { checkoutTitle: "Ödeme", namePlaceholder: "Ad *", birthDatePlaceholder: "Doğum tarihi *", emailPlaceholder: "E-posta *", phonePlaceholder: "Telefon", backBtn: "Geri", payNowBtn: "Şimdi öde", checkoutLoadingBtn: "Yükleniyor...", invalidEmail: "Geçerli bir e-posta adresi girin." },
  sr: { checkoutTitle: "Plaćanje", namePlaceholder: "Ime *", birthDatePlaceholder: "Datum rođenja *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Nazad", payNowBtn: "Plati sada", checkoutLoadingBtn: "Učitavanje...", invalidEmail: "Unesi ispravnu e-mail adresu." },
  sl: { checkoutTitle: "Plačilo", namePlaceholder: "Ime *", birthDatePlaceholder: "Datum rojstva *", emailPlaceholder: "E-pošta *", phonePlaceholder: "Telefon", backBtn: "Nazaj", payNowBtn: "Plačaj zdaj", checkoutLoadingBtn: "Nalaganje...", invalidEmail: "Vnesite veljaven e-poštni naslov." },
  sk: { checkoutTitle: "Platba", namePlaceholder: "Meno *", birthDatePlaceholder: "Dátum narodenia *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefón", backBtn: "Späť", payNowBtn: "Zaplatiť", checkoutLoadingBtn: "Načítavanie...", invalidEmail: "Zadajte platnú e-mailovú adresu." },
  lt: { checkoutTitle: "Mokėjimas", namePlaceholder: "Vardas *", birthDatePlaceholder: "Gimimo data *", emailPlaceholder: "El. paštas *", phonePlaceholder: "Telefonas", backBtn: "Atgal", payNowBtn: "Mokėti dabar", checkoutLoadingBtn: "Kraunama...", invalidEmail: "Įveskite galiojantį el. pašto adresą." },
  lv: { checkoutTitle: "Maksājums", namePlaceholder: "Vārds *", birthDatePlaceholder: "Dzimšanas datums *", emailPlaceholder: "E-pasts *", phonePlaceholder: "Tālrunis", backBtn: "Atpakaļ", payNowBtn: "Maksāt tagad", checkoutLoadingBtn: "Ielādē...", invalidEmail: "Ievadiet derīgu e-pasta adresi." },
  et: { checkoutTitle: "Makse", namePlaceholder: "Nimi *", birthDatePlaceholder: "Sünnikuupäev *", emailPlaceholder: "E-post *", phonePlaceholder: "Telefon", backBtn: "Tagasi", payNowBtn: "Maksa nüüd", checkoutLoadingBtn: "Laadimine...", invalidEmail: "Sisestage kehtiv e-posti aadress." },
  ru: { checkoutTitle: "Оплата", namePlaceholder: "Имя *", birthDatePlaceholder: "Дата рождения *", emailPlaceholder: "E-mail *", phonePlaceholder: "Телефон", backBtn: "Назад", payNowBtn: "Оплатить", checkoutLoadingBtn: "Загрузка...", invalidEmail: "Введите действительный адрес электронной почты." },
  uk: { checkoutTitle: "Оплата", namePlaceholder: "Ім'я *", birthDatePlaceholder: "Дата народження *", emailPlaceholder: "E-mail *", phonePlaceholder: "Телефон", backBtn: "Назад", payNowBtn: "Оплатити", checkoutLoadingBtn: "Завантаження...", invalidEmail: "Введіть дійсну адресу електронної пошти." },
  sq: { checkoutTitle: "Pagesa", namePlaceholder: "Emri *", birthDatePlaceholder: "Data e lindjes *", emailPlaceholder: "Email *", phonePlaceholder: "Telefon", backBtn: "Prapa", payNowBtn: "Paguaj tani", checkoutLoadingBtn: "Po ngarkohet...", invalidEmail: "Vendosni një adresë email të vlefshme." },
  bs: { checkoutTitle: "Plaćanje", namePlaceholder: "Ime *", birthDatePlaceholder: "Datum rođenja *", emailPlaceholder: "E-mail *", phonePlaceholder: "Telefon", backBtn: "Nazad", payNowBtn: "Plati sada", checkoutLoadingBtn: "Učitavanje...", invalidEmail: "Unesite ispravnu e-mail adresu." },
  ka: { checkoutTitle: "გადახდა", namePlaceholder: "სახელი *", birthDatePlaceholder: "დაბადების თარიღი *", emailPlaceholder: "ელ.ფოსტა *", phonePlaceholder: "ტელეფონი", backBtn: "უკან", payNowBtn: "გადაიხადე ახლა", checkoutLoadingBtn: "იტვირთება...", invalidEmail: "შეიყვანეთ ვალიდური ელ.ფოსტა." },
  ja: { checkoutTitle: "お支払い", namePlaceholder: "お名前 *", birthDatePlaceholder: "生年月日 *", emailPlaceholder: "メール *", phonePlaceholder: "電話番号", backBtn: "戻る", payNowBtn: "今すぐ支払う", checkoutLoadingBtn: "読込中...", invalidEmail: "有効なメールアドレスを入力してください。" },
  ko: { checkoutTitle: "결제", namePlaceholder: "이름 *", birthDatePlaceholder: "생년월일 *", emailPlaceholder: "이메일 *", phonePlaceholder: "전화번호", backBtn: "뒤로", payNowBtn: "지금 결제", checkoutLoadingBtn: "로딩 중...", invalidEmail: "유효한 이메일 주소를 입력하세요." },
  zh: { checkoutTitle: "付款", namePlaceholder: "姓名 *", birthDatePlaceholder: "出生日期 *", emailPlaceholder: "电子邮件 *", phonePlaceholder: "电话", backBtn: "返回", payNowBtn: "立即付款", checkoutLoadingBtn: "加载中...", invalidEmail: "请输入有效的电子邮件地址。" },
  ar: { checkoutTitle: "الدفع", namePlaceholder: "* الاسم", birthDatePlaceholder: "* تاريخ الميلاد", emailPlaceholder: "* البريد الإلكتروني", phonePlaceholder: "الهاتف", backBtn: "رجوع", payNowBtn: "ادفع الآن", checkoutLoadingBtn: "جارٍ التحميل...", invalidEmail: "يرجى إدخال بريد إلكتروني صالح." },
  th: { checkoutTitle: "ชำระเงิน", namePlaceholder: "ชื่อ *", birthDatePlaceholder: "วันเกิด *", emailPlaceholder: "อีเมล *", phonePlaceholder: "โทรศัพท์", backBtn: "กลับ", payNowBtn: "จ่ายเลย", checkoutLoadingBtn: "กำลังโหลด...", invalidEmail: "กรุณากรอกอีเมลที่ถูกต้อง" },
};

/* ─── Standard badge & ticket desc maps ─── */
const badgeDe = { "FAST AUSVERKAUFT": "FAST AUSVERKAUFT", "84% schon weg": "84% schon weg", "FANLIEBLING": "FANLIEBLING" };
const descDe = {
  "EARLY BIRD TICKET": "Eintrittspreis",
  "LAST CHANCE TICKET": "Vergünstigter Eintritt · Einlass auch bei ausverkauften Events",
  "LAST MINUTE TICKET": "Regulärer Eintritt",
  "DELUXE TICKET": "Gültiges Ticket + Einlass ohne Anstehen über den VIP-Eingang",
  "FAN TICKET": "VIP-Eingang + Exklusives Stoff-Sammelband + LED-Haarkranz",
};

/* ─── All Languages ─── */
type BaseTranslations = Omit<Translations, "checkoutTitle" | "namePlaceholder" | "birthDatePlaceholder" | "emailPlaceholder" | "phonePlaceholder" | "backBtn" | "payNowBtn" | "checkoutLoadingBtn" | "invalidEmail">;

const de: BaseTranslations = {
  tourSubtitle: "", from: "AB", clock: "UHR", selectDate: "Wähle deinen Termin",
  soldOutLabel: "Ausverkauft", reservedFor: "Reserviert für:", soldOutTitle: "AUSVERKAUFT",
  soldOutDesc: "Dieses Event ist leider ausverkauft. Schau dir unsere anderen Termine an!",
  soldOutBadge: "SOLD OUT", comingSoonLabel: "COMING SOON",
  ticketsLoading: "Tickets laden...", discountPlaceholder: "Rabattcode eingeben", discountApply: "Einlösen",
  discountApplied: "✓ Code wird beim Checkout geprüft", continueBtn: "WEITER", inclVat: "inkl. MwSt.",
  eventInfoTitle: "Eventinformationen",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Beginn", " Uhr"),
  admissionTitle: "Einlassinformationen",
  admissionContent: "✅ Einlass gemäß Veranstalterangaben – bitte Altersfreigabe beachten.\n\n✅ Dein Ticket brauchst du nicht auszudrucken – es reicht digital auf deinem Handy.\n\n✅ Der Einlass dauert in der Regel nicht länger als 30 Minuten.",
  freeTicketsTitle: "Freikarten & mehr?", whatsappJoin: "Jetzt beitreten", whatsappDesc: "Werde Teil unserer WhatsApp-Community.",
  moreCities: "Weitere Städte", moreCitiesDesc: "Sichere dir jetzt Tickets für weitere Städte", kmAway: "km entfernt",
  footerQuestion: "Fragen, Probleme oder Reservierungsanfragen?", footerContact: "Kontaktiere uns:",
  footerOrganizer: "partyticket.app", imprint: "Impressum", privacy: "Datenschutz", terms: "AGB",
  loading: "Laden...",
  weekdays: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
  monthsShort: ["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
  badgeMap: badgeDe, ticketDescMap: descDe,
};

const nl: BaseTranslations = {
  tourSubtitle: "", from: "VANAF", clock: "UUR", selectDate: "Kies je datum",
  soldOutLabel: "Uitverkocht", reservedFor: "Gereserveerd voor:", soldOutTitle: "UITVERKOCHT",
  soldOutDesc: "Dit evenement is helaas uitverkocht. Bekijk onze andere data!",
  soldOutBadge: "UITVERKOCHT", comingSoonLabel: "BINNENKORT",
  ticketsLoading: "Tickets laden...", discountPlaceholder: "Kortingscode invoeren", discountApply: "Toepassen",
  discountApplied: "✓ Code wordt bij de checkout gecontroleerd", continueBtn: "VERDER", inclVat: "incl. btw",
  eventInfoTitle: "Evenementinformatie",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Aanvang", " uur"),
  admissionTitle: "Toegangsinformatie",
  admissionContent: "✅ Toegang vanaf 18 jaar – uitzonderingen alleen in overleg met de locatie.\n\n✅ We beginnen met de show zodra het grootste deel binnen is.\n\n✅ De inlaat duurt doorgaans niet langer dan 30 minuten.\n\n✅ Je hoeft je ticket niet af te drukken – digitaal op je telefoon is voldoende.",
  freeTicketsTitle: "Gratis kaarten & meer?", whatsappJoin: "Nu deelnemen", whatsappDesc: "Word lid van onze WhatsApp-community.",
  moreCities: "Meer steden", moreCitiesDesc: "Bestel nu tickets voor andere steden", kmAway: "km verwijderd",
  footerQuestion: "Vragen, problemen of reserveringsverzoeken?", footerContact: "Neem contact op:",
  footerOrganizer: "partyticket.app", imprint: "Colofon", privacy: "Privacybeleid", terms: "Algemene voorwaarden",
  loading: "Laden...",
  weekdays: ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"],
  monthsShort: ["","Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "BIJNA UITVERKOCHT", "84% schon weg": "84% al weg", "FANLIEBLING": "FAVORIET" },
  ticketDescMap: { "EARLY BIRD TICKET": "Toegangsprijs", "LAST CHANCE TICKET": "Voordelig toegang · Toegang ook bij uitverkochte evenementen", "LAST MINUTE TICKET": "Reguliere toegang", "DELUXE TICKET": "Geldig ticket + Toegang zonder wachtrij via de VIP-ingang", "FAN TICKET": "VIP-ingang + Exclusieve stoffen verzamelband + LED-haarkrans" },
};

const fr: BaseTranslations = {
  tourSubtitle: "", from: "DÈS", clock: "H", selectDate: "Choisis ta date",
  soldOutLabel: "Épuisé", reservedFor: "Réservé pour :", soldOutTitle: "ÉPUISÉ",
  soldOutDesc: "Cet événement est malheureusement complet. Découvre nos autres dates !",
  soldOutBadge: "ÉPUISÉ", comingSoonLabel: "BIENTÔT",
  ticketsLoading: "Chargement des billets...", discountPlaceholder: "Entrer un code promo", discountApply: "Appliquer",
  discountApplied: "✓ Le code sera vérifié au moment du paiement", continueBtn: "CONTINUER", inclVat: "TTC",
  eventInfoTitle: "Informations sur l'événement",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Debut", "h"),
  admissionTitle: "Informations d'entrée",
  admissionContent: "✅ Entrée à partir de 18 ans – exceptions uniquement en accord avec le lieu.\n\n✅ Le spectacle commence dès que la majorité du public est entrée.\n\n✅ L'entrée ne dure généralement pas plus de 30 minutes.\n\n✅ Pas besoin d'imprimer ton billet – le format numérique suffit.",
  freeTicketsTitle: "Places gratuites & plus ?", whatsappJoin: "Rejoins-nous", whatsappDesc: "Fais partie de notre communauté WhatsApp.",
  moreCities: "Autres villes", moreCitiesDesc: "Réserve maintenant des billets pour d'autres villes", kmAway: "km",
  footerQuestion: "Questions, problèmes ou demandes de réservation ?", footerContact: "Contacte-nous :",
  footerOrganizer: "partyticket.app", imprint: "Mentions légales", privacy: "Confidentialité", terms: "CGV",
  loading: "Chargement...",
  weekdays: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
  monthsShort: ["","Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"],
  badgeMap: { "FAST AUSVERKAUFT": "PRESQUE ÉPUISÉ", "84% schon weg": "84% déjà partis", "FANLIEBLING": "COUP DE CŒUR" },
  ticketDescMap: { "EARLY BIRD TICKET": "Prix d'entrée", "LAST CHANCE TICKET": "Entrée à prix réduit · Accès même en cas de sold out", "LAST MINUTE TICKET": "Entrée standard", "DELUXE TICKET": "Billet valide + Entrée sans file via l'entrée VIP", "FAN TICKET": "Entrée VIP + Bracelet collector exclusif + Couronne LED" },
};

const en: BaseTranslations = {
  tourSubtitle: "", from: "FROM", clock: "", selectDate: "Choose your date",
  soldOutLabel: "Sold Out", reservedFor: "Reserved for:", soldOutTitle: "SOLD OUT",
  soldOutDesc: "This event is unfortunately sold out. Check out our other dates!",
  soldOutBadge: "SOLD OUT", comingSoonLabel: "COMING SOON",
  ticketsLoading: "Loading tickets...", discountPlaceholder: "Enter discount code", discountApply: "Apply",
  discountApplied: "✓ Code will be verified at checkout", continueBtn: "CONTINUE", inclVat: "incl. VAT",
  eventInfoTitle: "Event information",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Start", ""),
  admissionTitle: "Admission information",
  admissionContent: "✅ Entry age depends on the event – please check the organizer's info.\n\n✅ You don't need to print your ticket – digital on your phone is sufficient.\n\n✅ Entry usually takes no longer than 30 minutes.",
  freeTicketsTitle: "Free tickets & more?", whatsappJoin: "Join now", whatsappDesc: "Become part of our WhatsApp community.",
  moreCities: "More cities", moreCitiesDesc: "Get tickets for other cities now", kmAway: "km away",
  footerQuestion: "Questions, problems or reservation requests?", footerContact: "Contact us:",
  footerOrganizer: "partyticket.app", imprint: "Legal notice", privacy: "Privacy policy", terms: "Terms & conditions",
  loading: "Loading...",
  weekdays: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  monthsShort: ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "ALMOST SOLD OUT", "84% schon weg": "84% already gone", "FANLIEBLING": "FAN FAVORITE" },
  ticketDescMap: { "EARLY BIRD TICKET": "Entry price", "LAST CHANCE TICKET": "Discounted entry · Access even at sold-out events", "LAST MINUTE TICKET": "Regular entry", "DELUXE TICKET": "Valid ticket + Skip-the-line via VIP entrance", "FAN TICKET": "VIP entrance + Exclusive collectible wristband + LED crown" },
};

const pl: BaseTranslations = {
  tourSubtitle: "", from: "OD", clock: "", selectDate: "Wybierz datę",
  soldOutLabel: "Wyprzedane", reservedFor: "Zarezerwowano na:", soldOutTitle: "WYPRZEDANE",
  soldOutDesc: "To wydarzenie jest niestety wyprzedane. Sprawdź inne terminy!",
  soldOutBadge: "WYPRZEDANE", comingSoonLabel: "WKRÓTCE",
  ticketsLoading: "Ładowanie biletów...", discountPlaceholder: "Wpisz kod rabatowy", discountApply: "Zastosuj",
  discountApplied: "✓ Kod zostanie sprawdzony przy kasie", continueBtn: "DALEJ", inclVat: "brutto",
  eventInfoTitle: "Informacje o wydarzeniu",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Poczatek", ""),
  admissionTitle: "Informacje o wejściu",
  admissionContent: "✅ Wejście od 18 lat – wyjątki tylko po uzgodnieniu.\n\n✅ Nie musisz drukować biletu – wystarczy wersja cyfrowa.\n\n✅ Wejście trwa zazwyczaj nie dłużej niż 30 minut.",
  freeTicketsTitle: "Darmowe bilety i więcej?", whatsappJoin: "Dołącz teraz", whatsappDesc: "Dołącz do naszej społeczności WhatsApp.",
  moreCities: "Więcej miast", moreCitiesDesc: "Kup teraz bilety na inne miasta", kmAway: "km stąd",
  footerQuestion: "Pytania, problemy lub prośby o rezerwację?", footerContact: "Skontaktuj się z nami:",
  footerOrganizer: "partyticket.app", imprint: "Impressum", privacy: "Polityka prywatności", terms: "Regulamin",
  loading: "Ładowanie...",
  weekdays: ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"],
  monthsShort: ["","Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"],
  badgeMap: { "FAST AUSVERKAUFT": "PRAWIE WYPRZEDANE", "84% schon weg": "84% już sprzedane", "FANLIEBLING": "ULUBIENIEC FANÓW" },
  ticketDescMap: { "EARLY BIRD TICKET": "Cena wejścia", "LAST CHANCE TICKET": "Zniżkowe wejście · Wejście także na wyprzedane wydarzenia", "LAST MINUTE TICKET": "Regularne wejście", "DELUXE TICKET": "Ważny bilet + Wejście bez kolejki przez VIP", "FAN TICKET": "Wejście VIP + Ekskluzywna opaska + Wianek LED" },
};

const hr: BaseTranslations = {
  tourSubtitle: "", from: "OD", clock: "SATI", selectDate: "Odaberi datum",
  soldOutLabel: "Rasprodano", reservedFor: "Rezervirano za:", soldOutTitle: "RASPRODANO",
  soldOutDesc: "Ovaj događaj je nažalost rasprodan. Pogledaj naše druge termine!",
  soldOutBadge: "RASPRODANO", comingSoonLabel: "USKORO",
  ticketsLoading: "Učitavanje ulaznica...", discountPlaceholder: "Unesi kod za popust", discountApply: "Primijeni",
  discountApplied: "✓ Kod će biti provjeren prilikom plaćanja", continueBtn: "NASTAVI", inclVat: "s PDV-om",
  eventInfoTitle: "Informacije o događaju",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Pocetak", ""),
  admissionTitle: "Informacije o ulazu",
  admissionContent: "✅ Ulaz od 18 godina – iznimke samo u dogovoru s lokacijom.\n\n✅ Ulaznicu ne trebaš ispisati – dovoljna je digitalna verzija.\n\n✅ Ulaz obično ne traje duže od 30 minuta.",
  freeTicketsTitle: "Besplatne ulaznice i više?", whatsappJoin: "Pridruži se sada", whatsappDesc: "Postani dio naše WhatsApp zajednice.",
  moreCities: "Više gradova", moreCitiesDesc: "Osiguraj ulaznice za druge gradove", kmAway: "km daleko",
  footerQuestion: "Pitanja, problemi ili zahtjevi za rezervaciju?", footerContact: "Kontaktiraj nas:",
  footerOrganizer: "partyticket.app", imprint: "Impressum", privacy: "Pravila privatnosti", terms: "Uvjeti korištenja",
  loading: "Učitavanje...",
  weekdays: ["Nedjelja","Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"],
  monthsShort: ["","Sij","Velj","Ožu","Tra","Svi","Lip","Srp","Kol","Ruj","Lis","Stu","Pro"],
  badgeMap: { "FAST AUSVERKAUFT": "GOTOVO RASPRODANO", "84% schon weg": "84% već prodano", "FANLIEBLING": "OMILJENO" },
  ticketDescMap: { "EARLY BIRD TICKET": "Cijena ulaznice", "LAST CHANCE TICKET": "Sniženi ulaz · Ulaz i na rasprodane događaje", "LAST MINUTE TICKET": "Redovni ulaz", "DELUXE TICKET": "Valjana ulaznica + Ulaz bez čekanja kroz VIP", "FAN TICKET": "VIP ulaz + Ekskluzivna traka + LED vijenac" },
};

const pt: BaseTranslations = {
  tourSubtitle: "", from: "A PARTIR DAS", clock: "H", selectDate: "Escolha sua data",
  soldOutLabel: "Esgotado", reservedFor: "Reservado por:", soldOutTitle: "ESGOTADO",
  soldOutDesc: "Este evento está esgotado. Confira nossas outras datas!",
  soldOutBadge: "ESGOTADO", comingSoonLabel: "EM BREVE",
  ticketsLoading: "Carregando ingressos...", discountPlaceholder: "Inserir código de desconto", discountApply: "Aplicar",
  discountApplied: "✓ O código será verificado no checkout", continueBtn: "CONTINUAR", inclVat: "impostos incl.",
  eventInfoTitle: "Informações do evento",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Início", "h"),
  admissionTitle: "Informações de entrada",
  admissionContent: "✅ Entrada a partir de 18 anos – exceções apenas em acordo com o local.\n\n✅ Não precisa imprimir o ingresso – versão digital é suficiente.\n\n✅ A entrada geralmente não leva mais de 30 minutos.",
  freeTicketsTitle: "Ingressos grátis e mais?", whatsappJoin: "Participe agora", whatsappDesc: "Faça parte da nossa comunidade WhatsApp.",
  moreCities: "Mais cidades", moreCitiesDesc: "Garanta ingressos para outras cidades", kmAway: "km de distância",
  footerQuestion: "Dúvidas, problemas ou pedidos de reserva?", footerContact: "Entre em contato:",
  footerOrganizer: "partyticket.app", imprint: "Informações legais", privacy: "Privacidade", terms: "Termos e condições",
  loading: "Carregando...",
  weekdays: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  monthsShort: ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  badgeMap: { "FAST AUSVERKAUFT": "QUASE ESGOTADO", "84% schon weg": "84% já vendidos", "FANLIEBLING": "FAVORITO DOS FÃS" },
  ticketDescMap: { "EARLY BIRD TICKET": "Preço de entrada", "LAST CHANCE TICKET": "Entrada com desconto · Acesso mesmo em eventos esgotados", "LAST MINUTE TICKET": "Entrada regular", "DELUXE TICKET": "Ingresso válido + Entrada sem fila pela VIP", "FAN TICKET": "Entrada VIP + Pulseira colecionável + Coroa de LED" },
};

const it: BaseTranslations = {
  tourSubtitle: "", from: "DALLE", clock: "", selectDate: "Scegli la tua data",
  soldOutLabel: "Esaurito", reservedFor: "Riservato per:", soldOutTitle: "ESAURITO",
  soldOutDesc: "Questo evento è purtroppo esaurito. Scopri le altre date!",
  soldOutBadge: "ESAURITO", comingSoonLabel: "PROSSIMAMENTE",
  ticketsLoading: "Caricamento biglietti...", discountPlaceholder: "Inserisci codice sconto", discountApply: "Applica",
  discountApplied: "✓ Il codice sarà verificato al checkout", continueBtn: "CONTINUA", inclVat: "IVA incl.",
  eventInfoTitle: "Informazioni sull'evento",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Inizio", ""),
  admissionTitle: "Informazioni sull'ingresso",
  admissionContent: "✅ Ingresso dai 18 anni – eccezioni solo in accordo con la location.\n\n✅ Non è necessario stampare il biglietto – basta la versione digitale.\n\n✅ L'ingresso non dura di solito più di 30 minuti.",
  freeTicketsTitle: "Biglietti gratis e altro?", whatsappJoin: "Unisciti ora", whatsappDesc: "Entra nella nostra community WhatsApp.",
  moreCities: "Altre città", moreCitiesDesc: "Acquista ora biglietti per altre città", kmAway: "km di distanza",
  footerQuestion: "Domande, problemi o richieste di prenotazione?", footerContact: "Contattaci:",
  footerOrganizer: "partyticket.app", imprint: "Note legali", privacy: "Privacy", terms: "Termini e condizioni",
  loading: "Caricamento...",
  weekdays: ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"],
  monthsShort: ["","Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"],
  badgeMap: { "FAST AUSVERKAUFT": "QUASI ESAURITO", "84% schon weg": "84% già venduti", "FANLIEBLING": "PREFERITO DAI FAN" },
  ticketDescMap: { "EARLY BIRD TICKET": "Prezzo d'ingresso", "LAST CHANCE TICKET": "Ingresso scontato · Accesso anche a eventi esauriti", "LAST MINUTE TICKET": "Ingresso regolare", "DELUXE TICKET": "Biglietto valido + Ingresso senza coda via VIP", "FAN TICKET": "Ingresso VIP + Braccialetto esclusivo + Corona LED" },
};

const es: BaseTranslations = {
  tourSubtitle: "", from: "DESDE", clock: "H", selectDate: "Elige tu fecha",
  soldOutLabel: "Agotado", reservedFor: "Reservado para:", soldOutTitle: "AGOTADO",
  soldOutDesc: "Este evento está agotado. ¡Mira nuestras otras fechas!",
  soldOutBadge: "AGOTADO", comingSoonLabel: "PRÓXIMAMENTE",
  ticketsLoading: "Cargando entradas...", discountPlaceholder: "Introduce código de descuento", discountApply: "Aplicar",
  discountApplied: "✓ El código se verificará en el checkout", continueBtn: "CONTINUAR", inclVat: "IVA incl.",
  eventInfoTitle: "Información del evento",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Inicio", "h"),
  admissionTitle: "Información de acceso",
  admissionContent: "✅ Acceso según indicaciones del organizador.\n\n✅ No necesitas imprimir tu entrada – basta con la versión digital.\n\n✅ El acceso no suele durar más de 30 minutos.",
  freeTicketsTitle: "¿Entradas gratis y más?", whatsappJoin: "Únete ahora", whatsappDesc: "Sé parte de nuestra comunidad WhatsApp.",
  moreCities: "Más ciudades", moreCitiesDesc: "Consigue entradas para otras ciudades", kmAway: "km de distancia",
  footerQuestion: "¿Preguntas, problemas o solicitudes de reserva?", footerContact: "Contáctanos:",
  footerOrganizer: "partyticket.app", imprint: "Aviso legal", privacy: "Privacidad", terms: "Términos y condiciones",
  loading: "Cargando...",
  weekdays: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
  monthsShort: ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  badgeMap: { "FAST AUSVERKAUFT": "CASI AGOTADO", "84% schon weg": "84% ya vendidos", "FANLIEBLING": "FAVORITO DE FANS" },
  ticketDescMap: { "EARLY BIRD TICKET": "Precio de entrada", "LAST CHANCE TICKET": "Entrada con descuento · Acceso incluso en eventos agotados", "LAST MINUTE TICKET": "Entrada regular", "DELUXE TICKET": "Entrada válida + Acceso sin cola por VIP", "FAN TICKET": "Entrada VIP + Pulsera coleccionable + Corona LED" },
};

const cs: BaseTranslations = {
  tourSubtitle: "", from: "OD", clock: "", selectDate: "Vyber si datum",
  soldOutLabel: "Vyprodáno", reservedFor: "Rezervováno pro:", soldOutTitle: "VYPRODÁNO",
  soldOutDesc: "Tato akce je bohužel vyprodána. Podívej se na další termíny!",
  soldOutBadge: "VYPRODÁNO", comingSoonLabel: "BRZY",
  ticketsLoading: "Načítání vstupenek...", discountPlaceholder: "Zadej slevový kód", discountApply: "Použít",
  discountApplied: "✓ Kód bude ověřen při platbě", continueBtn: "POKRAČOVAT", inclVat: "vč. DPH",
  eventInfoTitle: "Informace o akci",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Zacatek", ""),
  admissionTitle: "Informace o vstupu",
  admissionContent: "✅ Vstup od 18 let – výjimky pouze po dohodě s provozem.\n\n✅ Vstupenku nemusíš tisknout – stačí digitální verze.\n\n✅ Vstup obvykle netrvá déle než 30 minut.",
  freeTicketsTitle: "Vstupenky zdarma a více?", whatsappJoin: "Připoj se", whatsappDesc: "Staň se součástí naší WhatsApp komunity.",
  moreCities: "Další města", moreCitiesDesc: "Zajisti si vstupenky do dalších měst", kmAway: "km daleko",
  footerQuestion: "Dotazy, problémy nebo žádosti o rezervaci?", footerContact: "Kontaktuj nás:",
  footerOrganizer: "partyticket.app", imprint: "Impressum", privacy: "Ochrana soukromí", terms: "Obchodní podmínky",
  loading: "Načítání...",
  weekdays: ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"],
  monthsShort: ["","Led","Úno","Bře","Dub","Kvě","Čvn","Čvc","Srp","Zář","Říj","Lis","Pro"],
  badgeMap: { "FAST AUSVERKAUFT": "TÉMĚŘ VYPRODÁNO", "84% schon weg": "84% už prodáno", "FANLIEBLING": "OBLÍBENEC FANOUŠKŮ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Vstupné", "LAST CHANCE TICKET": "Zvýhodněný vstup · Vstup i na vyprodané akce", "LAST MINUTE TICKET": "Běžný vstup", "DELUXE TICKET": "Platná vstupenka + Vstup bez fronty přes VIP", "FAN TICKET": "VIP vstup + Exkluzivní sběratelský náramek + LED věnec" },
};

const da: BaseTranslations = {
  tourSubtitle: "", from: "FRA", clock: "", selectDate: "Vælg din dato",
  soldOutLabel: "Udsolgt", reservedFor: "Reserveret til:", soldOutTitle: "UDSOLGT",
  soldOutDesc: "Denne begivenhed er desværre udsolgt. Se vores andre datoer!",
  soldOutBadge: "UDSOLGT", comingSoonLabel: "KOMMER SNART",
  ticketsLoading: "Indlæser billetter...", discountPlaceholder: "Indtast rabatkode", discountApply: "Anvend",
  discountApplied: "✓ Koden verificeres ved checkout", continueBtn: "VIDERE", inclVat: "inkl. moms",
  eventInfoTitle: "Begivenhedsinfo",
  eventInfoContent: makeEventInfo("", "", "", "", "", "Start", ""),
  admissionTitle: "Adgangsinformation",
  admissionContent: "✅ Adgang fra 18 år – undtagelser kun efter aftale.\n\n✅ Du behøver ikke printe din billet – digital version er nok.\n\n✅ Indgangen tager normalt ikke mere end 30 minutter.",
  freeTicketsTitle: "Gratis billetter & mere?", whatsappJoin: "Tilmeld dig nu", whatsappDesc: "Bliv en del af vores WhatsApp-fællesskab.",
  moreCities: "Flere byer", moreCitiesDesc: "Køb billetter til andre byer nu", kmAway: "km væk",
  footerQuestion: "Spørgsmål, problemer eller reservationsforespørgsler?", footerContact: "Kontakt os:",
  footerOrganizer: "partyticket.app", imprint: "Kolofon", privacy: "Privatlivspolitik", terms: "Vilkår og betingelser",
  loading: "Indlæser...",
  weekdays: ["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "NÆSTEN UDSOLGT", "84% schon weg": "84% allerede væk", "FANLIEBLING": "FANFAVORIT" },
  ticketDescMap: { "EARLY BIRD TICKET": "Indgangspris", "LAST CHANCE TICKET": "Nedsat adgang · Adgang selv til udsolgte events", "LAST MINUTE TICKET": "Normal adgang", "DELUXE TICKET": "Gyldig billet + Spring køen over via VIP", "FAN TICKET": "VIP-indgang + Eksklusivt armbånd + LED-krone" },
};

const sv: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "FRÅN", clock: "", selectDate: "Välj ditt datum",
  soldOutLabel: "Slutsålt", reservedFor: "Reserverat för:", soldOutTitle: "SLUTSÅLT",
  soldOutDesc: "Detta event är tyvärr slutsålt. Kolla våra andra datum!",
  soldOutBadge: "SLUTSÅLT", comingSoonLabel: "KOMMER SNART",
  ticketsLoading: "Laddar biljetter...", discountPlaceholder: "Ange rabattkod", discountApply: "Tillämpa",
  discountApplied: "✓ Koden verifieras vid checkout", continueBtn: "FORTSÄTT", inclVat: "inkl. moms",
  eventInfoTitle: "Eventinformation",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FANKONSERTEN!", "På Mamma Mia Party firar vi de största ABBA-hitsen – tillsammans med ER!", "Från \"Dancing Queen\" till \"Mamma Mia\" och \"Waterloo\" – alla kulthits live.", "DRESS CODE", "Glitter, Mamma Mia eller ABBA-tema! (Inte obligatoriskt, men välkommet)", "Start", ""),
  admissionTitle: "Inslappsinformation",
  admissionContent: "✅ Insläpp från 18 år – undantag bara i samråd med lokalen.\n\n✅ Showen startar när större delen av publiken har kommit in.\n\n✅ Insläppet tar vanligtvis inte mer än 30 minuter.\n\n✅ Du behöver inte skriva ut biljetten – digital version räcker.",
  freeTicketsTitle: "Gratisbiljetter & mer?", whatsappJoin: "Gå med nu", whatsappDesc: "Bli en del av vår WhatsApp-community.",
  moreCities: "Fler städer", moreCitiesDesc: "Boka biljetter till andra städer nu", kmAway: "km bort",
  footerQuestion: "Frågor, problem eller bokningsförfrågningar?", footerContact: "Kontakta oss:",
  footerOrganizer: "Arrangör: Gimme Gimme Party.", imprint: "Impressum", privacy: "Integritetspolicy", terms: "Villkor",
  loading: "Laddar...",
  weekdays: ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "NÄSTAN SLUTSÅLT", "84% schon weg": "84% redan borta", "FANLIEBLING": "FANFAVORIT" },
  ticketDescMap: { "EARLY BIRD TICKET": "Inträde", "LAST CHANCE TICKET": "Rabatterat inträde · Tillgång även vid slutsålda event", "LAST MINUTE TICKET": "Ordinarie inträde", "DELUXE TICKET": "Giltig biljett + Gå förbi kön via VIP", "FAN TICKET": "VIP-ingång + Exklusivt armband + LED-krona" },
};

const no: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "FRA", clock: "", selectDate: "Velg din dato",
  soldOutLabel: "Utsolgt", reservedFor: "Reservert for:", soldOutTitle: "UTSOLGT",
  soldOutDesc: "Dette arrangementet er dessverre utsolgt. Sjekk våre andre datoer!",
  soldOutBadge: "UTSOLGT", comingSoonLabel: "KOMMER SNART",
  ticketsLoading: "Laster billetter...", discountPlaceholder: "Skriv inn rabattkode", discountApply: "Bruk",
  discountApplied: "✓ Koden bekreftes ved checkout", continueBtn: "VIDERE", inclVat: "inkl. mva",
  eventInfoTitle: "Arrangementinfo",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FANKONSERTEN!", "På Mamma Mia Party feirer vi de største ABBA-hitene – sammen med DERE!", "Fra \"Dancing Queen\" til \"Mamma Mia\" og \"Waterloo\" – alle kulthits live.", "DRESS CODE", "Glitter, Mamma Mia eller ABBA-tema! (Ikke påkrevd, men velkomment)", "Start", ""),
  admissionTitle: "Innslippsinformasjon",
  admissionContent: "✅ Innslipp fra 18 år – unntak kun etter avtale.\n\n✅ Showet starter når størstedelen av publikum har kommet inn.\n\n✅ Innslippet tar vanligvis ikke mer enn 30 minutter.\n\n✅ Du trenger ikke skrive ut billetten – digital versjon er nok.",
  freeTicketsTitle: "Gratisbilletter & mer?", whatsappJoin: "Bli med nå", whatsappDesc: "Bli en del av vårt WhatsApp-fellesskap.",
  moreCities: "Flere byer", moreCitiesDesc: "Kjøp billetter til andre byer nå", kmAway: "km unna",
  footerQuestion: "Spørsmål, problemer eller reservasjonsforespørsler?", footerContact: "Kontakt oss:",
  footerOrganizer: "Arrangør: Gimme Gimme Party.", imprint: "Kolofon", privacy: "Personvern", terms: "Vilkår",
  loading: "Laster...",
  weekdays: ["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Des"],
  badgeMap: { "FAST AUSVERKAUFT": "NESTEN UTSOLGT", "84% schon weg": "84% allerede borte", "FANLIEBLING": "FANFAVORITT" },
  ticketDescMap: { "EARLY BIRD TICKET": "Inngangspris", "LAST CHANCE TICKET": "Rabattert inngang · Tilgang selv ved utsolgte events", "LAST MINUTE TICKET": "Ordinær inngang", "DELUXE TICKET": "Gyldig billett + Hopp over køen via VIP", "FAN TICKET": "VIP-inngang + Eksklusivt armbånd + LED-krone" },
};

const fi: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "ALK.", clock: "", selectDate: "Valitse päivämääräsi",
  soldOutLabel: "Loppuunmyyty", reservedFor: "Varattu:", soldOutTitle: "LOPPUUNMYYTY",
  soldOutDesc: "Tämä tapahtuma on valitettavasti loppuunmyyty. Tutustu muihin päivämääriin!",
  soldOutBadge: "LOPPUUNMYYTY", comingSoonLabel: "TULOSSA PIAN",
  ticketsLoading: "Ladataan lippuja...", discountPlaceholder: "Syötä alennuskoodi", discountApply: "Käytä",
  discountApplied: "✓ Koodi tarkistetaan kassalla", continueBtn: "JATKA", inclVat: "sis. ALV",
  eventInfoTitle: "Tapahtumatiedot",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FANIKONSERTTI!", "Mamma Mia Partyssa juhlimme ABBA:n suurimpia hittejä – yhdessä TEIDÄN kanssanne!", "\"Dancing Queenista\" \"Mamma Miaan\" ja \"Waterloohon\" – kaikki kulttihitit livenä.", "PUKUKOODI", "Glitteriä, Mamma Mia tai ABBA-teema! (Ei pakollinen, mutta tervetullut)", "Alkaa", ""),
  admissionTitle: "Sisäänpääsytiedot",
  admissionContent: "✅ Sisäänpääsy 18-vuotiaista – poikkeukset vain sopimuksesta.\n\n✅ Show alkaa kun suurin osa yleisöstä on saapunut.\n\n✅ Sisäänpääsy kestää yleensä alle 30 minuuttia.\n\n✅ Lippua ei tarvitse tulostaa – digitaalinen versio riittää.",
  freeTicketsTitle: "Ilmaislippuja & lisää?", whatsappJoin: "Liity nyt", whatsappDesc: "Liity WhatsApp-yhteisöömme.",
  moreCities: "Lisää kaupunkeja", moreCitiesDesc: "Hanki liput muihin kaupunkeihin nyt", kmAway: "km päässä",
  footerQuestion: "Kysymyksiä, ongelmia tai varauspyyntöjä?", footerContact: "Ota yhteyttä:",
  footerOrganizer: "Järjestäjä: Gimme Gimme Party.", imprint: "Tietoa sivustosta", privacy: "Tietosuoja", terms: "Käyttöehdot",
  loading: "Ladataan...",
  weekdays: ["Sunnuntai","Maanantai","Tiistai","Keskiviikko","Torstai","Perjantai","Lauantai"],
  monthsShort: ["","Tam","Hel","Maa","Huh","Tou","Kes","Hei","Elo","Syy","Lok","Mar","Jou"],
  badgeMap: { "FAST AUSVERKAUFT": "MELKEIN LOPPUUNMYYTY", "84% schon weg": "84% jo myyty", "FANLIEBLING": "FANISUOSIKKI" },
  ticketDescMap: { "EARLY BIRD TICKET": "Sisäänpääsyhinta", "LAST CHANCE TICKET": "Alennettu sisäänpääsy · Pääsy myös loppuunmyytyihin tapahtumiin", "LAST MINUTE TICKET": "Normaali sisäänpääsy", "DELUXE TICKET": "Voimassa oleva lippu + Ohita jono VIP-sisäänkäynnistä", "FAN TICKET": "VIP-sisäänpääsy + Keräilyranneke + LED-seppele" },
};

const hu: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "", clock: "-TÓL", selectDate: "Válaszd ki a dátumod",
  soldOutLabel: "Elfogyott", reservedFor: "Foglalva:", soldOutTitle: "ELFOGYOTT",
  soldOutDesc: "Ez az esemény sajnos elfogyott. Nézd meg a többi időpontot!",
  soldOutBadge: "ELFOGYOTT", comingSoonLabel: "HAMAROSAN",
  ticketsLoading: "Jegyek betöltése...", discountPlaceholder: "Kedvezménykód megadása", discountApply: "Alkalmaz",
  discountApplied: "✓ A kód a fizetésnél lesz ellenőrizve", continueBtn: "TOVÁBB", inclVat: "ÁFA-val",
  eventInfoTitle: "Esemény információk",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – A RAJONGÓI KONCERT!", "A Mamma Mia Partyn az ABBA legnagyobb slágereivel ünneplünk – VELETEK együtt!", "A \"Dancing Queen\"-től a \"Mamma Mia\"-n át a \"Waterloo\"-ig – minden kultikus sláger élőben.", "DRESS CODE", "Csillámpor, Mamma Mia vagy ABBA témájú! (Nem kötelező, de szívesen látjuk)", "Kezdés", ""),
  admissionTitle: "Belépési információk",
  admissionContent: "✅ Belépés 18 éves kortól – kivételek csak a helyszínnel egyeztetve.\n\n✅ A show akkor kezdődik, amikor a közönség nagy része beérkezett.\n\n✅ A belépés általában nem tart 30 percnél tovább.\n\n✅ A jegyet nem kell kinyomtatni – elég a digitális verzió.",
  freeTicketsTitle: "Ingyenes jegyek és több?", whatsappJoin: "Csatlakozz most", whatsappDesc: "Légy része WhatsApp közösségünknek.",
  moreCities: "További városok", moreCitiesDesc: "Szerezz jegyeket más városokba", kmAway: "km-re",
  footerQuestion: "Kérdések, problémák vagy foglalási kérelmek?", footerContact: "Lépj kapcsolatba velünk:",
  footerOrganizer: "Szervező: Gimme Gimme Party.", imprint: "Impresszum", privacy: "Adatvédelem", terms: "ÁSZF",
  loading: "Betöltés...",
  weekdays: ["Vasárnap","Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat"],
  monthsShort: ["","Jan","Feb","Már","Ápr","Máj","Jún","Júl","Aug","Szep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "MAJDNEM ELFOGYOTT", "84% schon weg": "84% már elkelt", "FANLIEBLING": "RAJONGÓI KEDVENC" },
  ticketDescMap: { "EARLY BIRD TICKET": "Belépőjegy", "LAST CHANCE TICKET": "Kedvezményes belépés · Belépés elfogyott eseményekre is", "LAST MINUTE TICKET": "Normál belépés", "DELUXE TICKET": "Érvényes jegy + Soron kívüli belépés VIP-en át", "FAN TICKET": "VIP belépés + Exkluzív karkötő + LED koszorú" },
};

const ro: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "DE LA", clock: "", selectDate: "Alege data ta",
  soldOutLabel: "Epuizat", reservedFor: "Rezervat pentru:", soldOutTitle: "EPUIZAT",
  soldOutDesc: "Acest eveniment este din păcate epuizat. Verifică celelalte date!",
  soldOutBadge: "EPUIZAT", comingSoonLabel: "ÎN CURÂND",
  ticketsLoading: "Se încarcă biletele...", discountPlaceholder: "Introduceți codul de reducere", discountApply: "Aplică",
  discountApplied: "✓ Codul va fi verificat la checkout", continueBtn: "CONTINUĂ", inclVat: "TVA incl.",
  eventInfoTitle: "Informații despre eveniment",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – CONCERTUL FANILOR!", "La Mamma Mia Party sărbătorim cele mai mari hituri ABBA – împreună cu VOI!", "De la \"Dancing Queen\" la \"Mamma Mia\" și \"Waterloo\" – toate hiturile cult live.", "DRESS CODE", "Sclipici, Mamma Mia sau temă ABBA! (Nu e obligatoriu, dar binevenit)", "Început", ""),
  admissionTitle: "Informații acces",
  admissionContent: "✅ Acces de la 18 ani – excepții doar cu acordul locației.\n\n✅ Show-ul începe când majoritatea publicului a intrat.\n\n✅ Accesul durează de obicei maxim 30 de minute.\n\n✅ Nu trebuie să tipărești biletul – varianta digitală e suficientă.",
  freeTicketsTitle: "Bilete gratuite și mai mult?", whatsappJoin: "Alătură-te acum", whatsappDesc: "Fii parte din comunitatea noastră WhatsApp.",
  moreCities: "Mai multe orașe", moreCitiesDesc: "Cumpără bilete pentru alte orașe acum", kmAway: "km distanță",
  footerQuestion: "Întrebări, probleme sau cereri de rezervare?", footerContact: "Contactează-ne:",
  footerOrganizer: "Organizator: Gimme Gimme Party.", imprint: "Informații legale", privacy: "Confidențialitate", terms: "Termeni și condiții",
  loading: "Se încarcă...",
  weekdays: ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"],
  monthsShort: ["","Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "APROAPE EPUIZAT", "84% schon weg": "84% deja vândute", "FANLIEBLING": "FAVORITUL FANILOR" },
  ticketDescMap: { "EARLY BIRD TICKET": "Preț de intrare", "LAST CHANCE TICKET": "Intrare cu reducere · Acces chiar și la evenimente epuizate", "LAST MINUTE TICKET": "Intrare regulară", "DELUXE TICKET": "Bilet valid + Acces fără coadă prin VIP", "FAN TICKET": "Intrare VIP + Brățară colecționabilă + Coroană LED" },
};

const bg: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "ОТ", clock: "Ч", selectDate: "Избери дата",
  soldOutLabel: "Разпродадено", reservedFor: "Резервирано за:", soldOutTitle: "РАЗПРОДАДЕНО",
  soldOutDesc: "Това събитие за съжаление е разпродадено. Разгледай другите дати!",
  soldOutBadge: "РАЗПРОДАДЕНО", comingSoonLabel: "СКОРО",
  ticketsLoading: "Зареждане на билети...", discountPlaceholder: "Въведи код за отстъпка", discountApply: "Приложи",
  discountApplied: "✓ Кодът ще бъде проверен при плащане", continueBtn: "НАПРЕД", inclVat: "вкл. ДДС",
  eventInfoTitle: "Информация за събитието",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – ФЕНСКИ КОНЦЕРТ!", "На Mamma Mia Party празнуваме най-големите хитове на ABBA – заедно с ВАС!", "От \"Dancing Queen\" до \"Mamma Mia\" и \"Waterloo\" – всички култови хитове на живо.", "ДРЕСКОД", "Блясък, Mamma Mia или ABBA тема! (Не е задължително, но е добре дошло)", "Начало", "ч"),
  admissionTitle: "Информация за входа",
  admissionContent: "✅ Вход от 18 години – изключения само по договорка.\n\n✅ Шоуто започва, когато по-голямата част от публиката влезе.\n\n✅ Входът обикновено не отнема повече от 30 минути.\n\n✅ Не е нужно да разпечатвате билета – цифровата версия е достатъчна.",
  freeTicketsTitle: "Безплатни билети и още?", whatsappJoin: "Присъедини се", whatsappDesc: "Стани част от нашата WhatsApp общност.",
  moreCities: "Повече градове", moreCitiesDesc: "Вземи билети за други градове сега", kmAway: "км",
  footerQuestion: "Въпроси, проблеми или заявки за резервация?", footerContact: "Свържи се с нас:",
  footerOrganizer: "Организатор: Gimme Gimme Party.", imprint: "Импресум", privacy: "Поверителност", terms: "Условия",
  loading: "Зареждане...",
  weekdays: ["Неделя","Понеделник","Вторник","Сряда","Четвъртък","Петък","Събота"],
  monthsShort: ["","Яну","Фев","Мар","Апр","Май","Юни","Юли","Авг","Сеп","Окт","Ное","Дек"],
  badgeMap: { "FAST AUSVERKAUFT": "ПОЧТИ РАЗПРОДАДЕНО", "84% schon weg": "84% вече продадени", "FANLIEBLING": "ФАВОРИТ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Цена за вход", "LAST CHANCE TICKET": "Намален вход · Достъп дори при разпродадени събития", "LAST MINUTE TICKET": "Редовен вход", "DELUXE TICKET": "Валиден билет + Вход без опашка през VIP", "FAN TICKET": "VIP вход + Ексклузивна гривна + LED венец" },
};

const el: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "ΑΠΌ", clock: "", selectDate: "Επίλεξε ημερομηνία",
  soldOutLabel: "Εξαντλημένο", reservedFor: "Κρατημένο για:", soldOutTitle: "ΕΞΑΝΤΛΗΘΗΚΕ",
  soldOutDesc: "Αυτό το event είναι δυστυχώς εξαντλημένο. Δες τις άλλες ημερομηνίες!",
  soldOutBadge: "ΕΞΑΝΤΛΗΘΗΚΕ", comingSoonLabel: "ΣΎΝΤΟΜΑ",
  ticketsLoading: "Φόρτωση εισιτηρίων...", discountPlaceholder: "Εισάγετε κωδικό έκπτωσης", discountApply: "Εφαρμογή",
  discountApplied: "✓ Ο κωδικός θα ελεγχθεί στο checkout", continueBtn: "ΣΥΝΕΧΕΙΑ", inclVat: "με ΦΠΑ",
  eventInfoTitle: "Πληροφορίες εκδήλωσης",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – Η ΣΥΝΑΥΛΙΑ ΤΩΝ FANS!", "Στο Mamma Mia Party γιορτάζουμε τα μεγαλύτερα hits των ABBA – μαζί με ΕΣΑΣ!", "Από \"Dancing Queen\" μέχρι \"Mamma Mia\" και \"Waterloo\" – όλα τα cult hits ζωντανά.", "DRESS CODE", "Γκλίτερ, Mamma Mia ή θέμα ABBA! (Δεν είναι υποχρεωτικό, αλλά καλοδεχούμενο)", "Έναρξη", ""),
  admissionTitle: "Πληροφορίες εισόδου",
  admissionContent: "✅ Είσοδος από 18 ετών – εξαιρέσεις μόνο κατόπιν συνεννόησης.\n\n✅ Το show ξεκινάει όταν μπει η πλειοψηφία του κοινού.\n\n✅ Η είσοδος συνήθως δεν διαρκεί πάνω από 30 λεπτά.\n\n✅ Δεν χρειάζεται να εκτυπώσεις το εισιτήριο – αρκεί η ψηφιακή έκδοση.",
  freeTicketsTitle: "Δωρεάν εισιτήρια & περισσότερα?", whatsappJoin: "Μπες τώρα", whatsappDesc: "Γίνε μέλος της WhatsApp κοινότητάς μας.",
  moreCities: "Περισσότερες πόλεις", moreCitiesDesc: "Πάρε εισιτήρια για άλλες πόλεις τώρα", kmAway: "χλμ μακριά",
  footerQuestion: "Ερωτήσεις, προβλήματα ή αιτήματα κράτησης;", footerContact: "Επικοινώνησε μαζί μας:",
  footerOrganizer: "Διοργανωτής: Gimme Gimme Party.", imprint: "Νομικά", privacy: "Απόρρητο", terms: "Όροι χρήσης",
  loading: "Φόρτωση...",
  weekdays: ["Κυριακή","Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο"],
  monthsShort: ["","Ιαν","Φεβ","Μαρ","Απρ","Μαι","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"],
  badgeMap: { "FAST AUSVERKAUFT": "ΣΧΕΔΟΝ ΕΞΑΝΤΛΗΘΗΚΕ", "84% schon weg": "84% ήδη πωλήθηκαν", "FANLIEBLING": "ΑΓΑΠΗΜΕΝΟ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Τιμή εισόδου", "LAST CHANCE TICKET": "Μειωμένη είσοδος · Πρόσβαση ακόμα και σε sold-out events", "LAST MINUTE TICKET": "Κανονική είσοδος", "DELUXE TICKET": "Έγκυρο εισιτήριο + Είσοδος χωρίς ουρά μέσω VIP", "FAN TICKET": "VIP είσοδος + Συλλεκτικό βραχιόλι + LED στεφάνι" },
};

const tr: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "SAAT", clock: "", selectDate: "Tarihini seç",
  soldOutLabel: "Tükendi", reservedFor: "Rezerve:", soldOutTitle: "TÜKENDİ",
  soldOutDesc: "Bu etkinlik maalesef tükendi. Diğer tarihlere göz at!",
  soldOutBadge: "TÜKENDİ", comingSoonLabel: "YAKINDA",
  ticketsLoading: "Biletler yükleniyor...", discountPlaceholder: "İndirim kodu girin", discountApply: "Uygula",
  discountApplied: "✓ Kod ödeme sırasında kontrol edilecek", continueBtn: "DEVAM", inclVat: "KDV dahil",
  eventInfoTitle: "Etkinlik bilgileri",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FAN KONSERİ!", "Mamma Mia Party'de ABBA'nın en büyük hitlerini kutluyoruz – SİZİNLE birlikte!", "\"Dancing Queen\"den \"Mamma Mia\"ya ve \"Waterloo\"ya – tüm kült hitler canlı.", "KIYAFET KODU", "Simli, Mamma Mia veya ABBA temalı! (Zorunlu değil ama hoş karşılanır)", "Başlangıç", ""),
  admissionTitle: "Giriş bilgileri",
  admissionContent: "✅ 18 yaş ve üzeri giriş – istisnalar sadece mekanla anlaşarak.\n\n✅ Show, seyircilerin çoğu girince başlar.\n\n✅ Giriş genellikle 30 dakikadan fazla sürmez.\n\n✅ Bileti yazdırmanıza gerek yok – dijital versiyonu yeterli.",
  freeTicketsTitle: "Ücretsiz biletler ve daha fazlası?", whatsappJoin: "Şimdi katıl", whatsappDesc: "WhatsApp topluluğumuzun bir parçası ol.",
  moreCities: "Daha fazla şehir", moreCitiesDesc: "Diğer şehirler için hemen bilet al", kmAway: "km uzaklıkta",
  footerQuestion: "Sorular, sorunlar veya rezervasyon talepleri?", footerContact: "Bize ulaşın:",
  footerOrganizer: "Organizatör: Gimme Gimme Party.", imprint: "Yasal bilgi", privacy: "Gizlilik", terms: "Şartlar ve koşullar",
  loading: "Yükleniyor...",
  weekdays: ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
  monthsShort: ["","Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],
  badgeMap: { "FAST AUSVERKAUFT": "NEREDEYSE TÜKENDİ", "84% schon weg": "%84 zaten satıldı", "FANLIEBLING": "FAN FAVORİSİ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Giriş fiyatı", "LAST CHANCE TICKET": "İndirimli giriş · Tükenmiş etkinliklere de erişim", "LAST MINUTE TICKET": "Normal giriş", "DELUXE TICKET": "Geçerli bilet + VIP'ten sırasız giriş", "FAN TICKET": "VIP giriş + Koleksiyon bilekliği + LED taç" },
};

const sr: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "OD", clock: "Č", selectDate: "Izaberi datum",
  soldOutLabel: "Rasprodato", reservedFor: "Rezervisano za:", soldOutTitle: "RASPRODATO",
  soldOutDesc: "Ovaj događaj je nažalost rasprodat. Pogledaj ostale datume!",
  soldOutBadge: "RASPRODATO", comingSoonLabel: "USKORO",
  ticketsLoading: "Učitavanje karata...", discountPlaceholder: "Unesi kod za popust", discountApply: "Primeni",
  discountApplied: "✓ Kod će biti proveren pri plaćanju", continueBtn: "NASTAVI", inclVat: "sa PDV-om",
  eventInfoTitle: "Informacije o događaju",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY - FAN KONCERT!", "Na Mamma Mia Partyju slavimo najvece hitove ABBA-e - zajedno sa VAMA!", "Od 'Dancing Queen' preko 'Mamma Mia' do 'Waterloo' - svi kultni hitovi uzivo.", "DRESS CODE", "Sljokice, Mamma Mia ili ABBA tema! (Nije obavezno, ali je dobrodoslo)", "Pocetak", "c"),
  admissionTitle: "Informacije o ulasku",
  admissionContent: "✅ Ulaz od 18 godina – izuzeci samo po dogovoru.\n\n✅ Šou počinje kad većina publike uđe.\n\n✅ Ulaz obično ne traje duže od 30 minuta.\n\n✅ Kartu ne moraš da štampaš – digitalna verzija je dovoljna.",
  freeTicketsTitle: "Besplatne karte i više?", whatsappJoin: "Pridruži se sada", whatsappDesc: "Postani deo naše WhatsApp zajednice.",
  moreCities: "Više gradova", moreCitiesDesc: "Kupi karte za druge gradove", kmAway: "km daleko",
  footerQuestion: "Pitanja, problemi ili zahtevi za rezervaciju?", footerContact: "Kontaktiraj nas:",
  footerOrganizer: "Organizator: Gimme Gimme Party.", imprint: "Impressum", privacy: "Privatnost", terms: "Uslovi korišćenja",
  loading: "Učitavanje...",
  weekdays: ["Nedelja","Ponedeljak","Utorak","Sreda","Četvrtak","Petak","Subota"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "SKORO RASPRODATO", "84% schon weg": "84% već prodato", "FANLIEBLING": "OMILJENO" },
  ticketDescMap: { "EARLY BIRD TICKET": "Cena ulaznice", "LAST CHANCE TICKET": "Snižen ulaz · Ulaz i na rasprodate događaje", "LAST MINUTE TICKET": "Regularan ulaz", "DELUXE TICKET": "Važeća karta + Ulaz bez reda preko VIP", "FAN TICKET": "VIP ulaz + Ekskluzivna narukvica + LED venac" },
};

const sl: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "OD", clock: "", selectDate: "Izberi datum",
  soldOutLabel: "Razprodano", reservedFor: "Rezervirano za:", soldOutTitle: "RAZPRODANO",
  soldOutDesc: "Ta dogodek je žal razprodan. Oglej si druge termine!",
  soldOutBadge: "RAZPRODANO", comingSoonLabel: "KMALU",
  ticketsLoading: "Nalaganje vstopnic...", discountPlaceholder: "Vnesi kodo za popust", discountApply: "Uporabi",
  discountApplied: "✓ Koda bo preverjena ob plačilu", continueBtn: "NAPREJ", inclVat: "z DDV",
  eventInfoTitle: "Informacije o dogodku",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY - KONCERT ZA OBOZOVALCE!", "Na Mamma Mia Partyju praznujemo najvecje hite ABBA - skupaj z VAMI!", "Od 'Dancing Queen' do 'Mamma Mia' in 'Waterloo' - vsi kultni hiti v zivo.", "DRESS CODE", "Blescice, Mamma Mia ali ABBA tema! (Ni obvezno, a dobrodoslo)", "Zacetek", ""),
  admissionTitle: "Informacije o vstopu",
  admissionContent: "✅ Vstop od 18 let – izjeme le po dogovoru.\n\n✅ Show se začne, ko vstopi večina občinstva.\n\n✅ Vstop ponavadi ne traja več kot 30 minut.\n\n✅ Vstopnice ni treba tiskati – digitalna verzija zadostuje.",
  freeTicketsTitle: "Brezplačne vstopnice in več?", whatsappJoin: "Pridruži se zdaj", whatsappDesc: "Postani del naše WhatsApp skupnosti.",
  moreCities: "Več mest", moreCitiesDesc: "Kupi vstopnice za druga mesta", kmAway: "km stran",
  footerQuestion: "Vprašanja, težave ali prošnje za rezervacijo?", footerContact: "Kontaktiraj nas:",
  footerOrganizer: "Organizator: Gimme Gimme Party.", imprint: "Impressum", privacy: "Zasebnost", terms: "Pogoji uporabe",
  loading: "Nalaganje...",
  weekdays: ["Nedelja","Ponedeljek","Torek","Sreda","Četrtek","Petek","Sobota"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "SKORAJ RAZPRODANO", "84% schon weg": "84% že prodano", "FANLIEBLING": "PRILJUBLJENO" },
  ticketDescMap: { "EARLY BIRD TICKET": "Cena vstopnice", "LAST CHANCE TICKET": "Znižan vstop · Dostop tudi na razprodane dogodke", "LAST MINUTE TICKET": "Redni vstop", "DELUXE TICKET": "Veljavna vstopnica + Vstop brez čakanja prek VIP", "FAN TICKET": "VIP vstop + Ekskluzivna zapestnica + LED venec" },
};

const sk: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "OD", clock: "", selectDate: "Vyber si dátum",
  soldOutLabel: "Vypredané", reservedFor: "Rezervované pre:", soldOutTitle: "VYPREDANÉ",
  soldOutDesc: "Táto akcia je bohužiaľ vypredaná. Pozri si ďalšie termíny!",
  soldOutBadge: "VYPREDANÉ", comingSoonLabel: "ČOSKORO",
  ticketsLoading: "Načítavanie lístkov...", discountPlaceholder: "Zadaj zľavový kód", discountApply: "Použiť",
  discountApplied: "✓ Kód bude overený pri platbe", continueBtn: "POKRAČOVAŤ", inclVat: "s DPH",
  eventInfoTitle: "Informácie o akcii",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY - FANUSIKOVSKY KONCERT!", "Na Mamma Mia Party oslavujeme najvacsie hity ABBA - spolu s VAMI!", "Od 'Dancing Queen' cez 'Mamma Mia' po 'Waterloo' - vsetky kultove hity nazivo.", "DRESS CODE", "Trblietky, Mamma Mia alebo ABBA motiv! (Nie je povinne, ale vitane)", "Zaciatok", ""),
  admissionTitle: "Informácie o vstupe",
  admissionContent: "✅ Vstup od 18 rokov – výnimky len po dohode.\n\n✅ Show začína, keď vstúpi väčšina publika.\n\n✅ Vstup zvyčajne netrvá dlhšie ako 30 minút.\n\n✅ Lístok nemusíš tlačiť – stačí digitálna verzia.",
  freeTicketsTitle: "Lístky zadarmo a viac?", whatsappJoin: "Pripoj sa", whatsappDesc: "Staň sa súčasťou našej WhatsApp komunity.",
  moreCities: "Ďalšie mestá", moreCitiesDesc: "Získaj lístky do ďalších miest", kmAway: "km ďaleko",
  footerQuestion: "Otázky, problémy alebo žiadosti o rezerváciu?", footerContact: "Kontaktuj nás:",
  footerOrganizer: "Organizátor: Gimme Gimme Party.", imprint: "Impressum", privacy: "Ochrana súkromia", terms: "Obchodné podmienky",
  loading: "Načítavanie...",
  weekdays: ["Nedeľa","Pondelok","Utorok","Streda","Štvrtok","Piatok","Sobota"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Máj","Jún","Júl","Aug","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "TAKMER VYPREDANÉ", "84% schon weg": "84% už predaných", "FANLIEBLING": "OBĽÚBENEC FANÚŠIKOV" },
  ticketDescMap: { "EARLY BIRD TICKET": "Vstupné", "LAST CHANCE TICKET": "Zľavnený vstup · Vstup aj na vypredané akcie", "LAST MINUTE TICKET": "Bežný vstup", "DELUXE TICKET": "Platný lístok + Vstup bez radu cez VIP", "FAN TICKET": "VIP vstup + Exkluzívny náramok + LED veniec" },
};

const lt: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "NUO", clock: "VAL.", selectDate: "Pasirink datą",
  soldOutLabel: "Išparduota", reservedFor: "Rezervuota:", soldOutTitle: "IŠPARDUOTA",
  soldOutDesc: "Šis renginys, deja, išparduotas. Peržiūrėk kitas datas!",
  soldOutBadge: "IŠPARDUOTA", comingSoonLabel: "NETRUKUS",
  ticketsLoading: "Kraunami bilietai...", discountPlaceholder: "Įveskite nuolaidos kodą", discountApply: "Taikyti",
  discountApplied: "✓ Kodas bus patikrintas apmokėjimo metu", continueBtn: "TĘSTI", inclVat: "su PVM",
  eventInfoTitle: "Renginio informacija",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY - GERBEJU KONCERTAS!", "Mamma Mia Party svenciame didziausius ABBA hitus - kartu su JUMIS!", "Nuo 'Dancing Queen' iki 'Mamma Mia' ir 'Waterloo' - visi kultiniai hitai gyvai.", "APRANGOS KODAS", "Blizguciai, Mamma Mia arba ABBA tema! (Neprivaloma, bet sveikintina)", "Pradzia", " val."),
  admissionTitle: "Įėjimo informacija",
  admissionContent: "✅ Įėjimas nuo 18 metų – išimtys tik susitarus.\n\n✅ Šou prasideda, kai įeina didžioji dalis publikos.\n\n✅ Įėjimas paprastai trunka ne ilgiau nei 30 minučių.\n\n✅ Bilieto spausdinti nereikia – pakanka skaitmeninės versijos.",
  freeTicketsTitle: "Nemokami bilietai ir daugiau?", whatsappJoin: "Prisijunk dabar", whatsappDesc: "Tapk mūsų WhatsApp bendruomenės dalimi.",
  moreCities: "Daugiau miestų", moreCitiesDesc: "Įsigyk bilietus į kitus miestus", kmAway: "km",
  footerQuestion: "Klausimai, problemos ar rezervacijos užklausos?", footerContact: "Susisiekite su mumis:",
  footerOrganizer: "Organizatorius: Gimme Gimme Party.", imprint: "Teisinė info", privacy: "Privatumas", terms: "Sąlygos",
  loading: "Kraunama...",
  weekdays: ["Sekmadienis","Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis"],
  monthsShort: ["","Sau","Vas","Kov","Bal","Geg","Bir","Lie","Rgp","Rgs","Spa","Lap","Gru"],
  badgeMap: { "FAST AUSVERKAUFT": "BEVEIK IŠPARDUOTA", "84% schon weg": "84% jau parduota", "FANLIEBLING": "GERBĖJŲ FAVORITAS" },
  ticketDescMap: { "EARLY BIRD TICKET": "Įėjimo kaina", "LAST CHANCE TICKET": "Nuolaida · Įėjimas net į išparduotus renginius", "LAST MINUTE TICKET": "Įprastas įėjimas", "DELUXE TICKET": "Galiojantis bilietas + Įėjimas be eilės per VIP", "FAN TICKET": "VIP įėjimas + Ekskluzyvus kolekcinis dirželis + LED vainikas" },
};

const lv: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "NO", clock: "", selectDate: "Izvēlies datumu",
  soldOutLabel: "Izpārdots", reservedFor: "Rezervēts:", soldOutTitle: "IZPĀRDOTS",
  soldOutDesc: "Šis pasākums diemžēl ir izpārdots. Apskati citus datumus!",
  soldOutBadge: "IZPĀRDOTS", comingSoonLabel: "DRĪZUMĀ",
  ticketsLoading: "Ielādē biļetes...", discountPlaceholder: "Ievadi atlaides kodu", discountApply: "Piemērot",
  discountApplied: "✓ Kods tiks pārbaudīts maksājuma laikā", continueBtn: "TURPINĀT", inclVat: "ar PVN",
  eventInfoTitle: "Pasākuma informācija",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FANU KONCERTS!", "Mamma Mia Party svinam lielākos ABBA hitus – kopā ar JUMS!", "No \"Dancing Queen\" līdz \"Mamma Mia\" un \"Waterloo\" – visi kulta hiti dzīvajā.", "DRESS CODE", "Spīdumi, Mamma Mia vai ABBA tēma! (Nav obligāts, bet laipni gaidīts)", "Sākums", ""),
  admissionTitle: "Ieejas informācija",
  admissionContent: "✅ Ieeja no 18 gadiem – izņēmumi tikai pēc vienošanās.\n\n✅ Šovs sākas, kad lielākā daļa publikas ir ienākusi.\n\n✅ Ieeja parasti neaizņem vairāk par 30 minūtēm.\n\n✅ Biļeti nav jāizdrukā – pietiek ar digitālo versiju.",
  freeTicketsTitle: "Bezmaksas biļetes un vairāk?", whatsappJoin: "Pievienojies tagad", whatsappDesc: "Kļūsti par daļu no mūsu WhatsApp kopienas.",
  moreCities: "Vairāk pilsētu", moreCitiesDesc: "Iegādājies biļetes uz citām pilsētām", kmAway: "km",
  footerQuestion: "Jautājumi, problēmas vai rezervācijas pieprasījumi?", footerContact: "Sazinies ar mums:",
  footerOrganizer: "Organizators: Gimme Gimme Party.", imprint: "Juridiskā info", privacy: "Privātums", terms: "Noteikumi",
  loading: "Ielādē...",
  weekdays: ["Svētdiena","Pirmdiena","Otrdiena","Trešdiena","Ceturtdiena","Piektdiena","Sestdiena"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Mai","Jūn","Jūl","Aug","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "GANDRĪZ IZPĀRDOTS", "84% schon weg": "84% jau pārdoti", "FANLIEBLING": "FANU FAVORĪTS" },
  ticketDescMap: { "EARLY BIRD TICKET": "Ieejas cena", "LAST CHANCE TICKET": "Atlaide · Ieeja arī izpārdotos pasākumos", "LAST MINUTE TICKET": "Parastā ieeja", "DELUXE TICKET": "Derīga biļete + Ieeja bez rindas caur VIP", "FAN TICKET": "VIP ieeja + Ekskluzīva rokassprādze + LED vainags" },
};

const et: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "ALATES", clock: "", selectDate: "Vali oma kuupäev",
  soldOutLabel: "Välja müüdud", reservedFor: "Reserveeritud:", soldOutTitle: "VÄLJA MÜÜDUD",
  soldOutDesc: "See sündmus on kahjuks välja müüdud. Vaata teisi kuupäevi!",
  soldOutBadge: "VÄLJA MÜÜDUD", comingSoonLabel: "PEAGI",
  ticketsLoading: "Piletite laadimine...", discountPlaceholder: "Sisestage sooduskood", discountApply: "Rakenda",
  discountApplied: "✓ Kood kontrollitakse maksmisel", continueBtn: "EDASI", inclVat: "koos KM-ga",
  eventInfoTitle: "Sündmuse info",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – FÄNNIKONTSERT!", "Mamma Mia Partyl tähistame suurimaid ABBA hitte – koos TEIEGA!", "\"Dancing Queenist\" \"Mamma Miani\" ja \"Waterlooni\" – kõik kulthitid live'is.", "RIIETUS", "Sädelus, Mamma Mia või ABBA teema! (Pole kohustuslik, aga teretulnud)", "Algus", ""),
  admissionTitle: "Sissepääsu info",
  admissionContent: "✅ Sissepääs alates 18. eluaastast – erandid ainult kokkuleppel.\n\n✅ Šou algab, kui enamik publikust on sisse tulnud.\n\n✅ Sissepääs kestab tavaliselt mitte üle 30 minuti.\n\n✅ Piletit pole vaja välja printida – digitaalne versioon piisab.",
  freeTicketsTitle: "Tasuta piletid ja rohkem?", whatsappJoin: "Liitu nüüd", whatsappDesc: "Saa osaks meie WhatsApp kogukonnast.",
  moreCities: "Rohkem linnu", moreCitiesDesc: "Hangi piletid teistesse linnadesse", kmAway: "km kaugusel",
  footerQuestion: "Küsimused, probleemid või broneeringupäringud?", footerContact: "Võta meiega ühendust:",
  footerOrganizer: "Korraldaja: Gimme Gimme Party.", imprint: "Õiguslik teave", privacy: "Privaatsus", terms: "Tingimused",
  loading: "Laadimine...",
  weekdays: ["Pühapäev","Esmaspäev","Teisipäev","Kolmapäev","Neljapäev","Reede","Laupäev"],
  monthsShort: ["","Jaan","Veeb","Mär","Apr","Mai","Juun","Juul","Aug","Sep","Okt","Nov","Det"],
  badgeMap: { "FAST AUSVERKAUFT": "PEAAEGU VÄLJA MÜÜDUD", "84% schon weg": "84% juba müüdud", "FANLIEBLING": "FÄNNIDE LEMMIK" },
  ticketDescMap: { "EARLY BIRD TICKET": "Sissepääsu hind", "LAST CHANCE TICKET": "Soodushind · Sissepääs ka väljamüüdud sündmustele", "LAST MINUTE TICKET": "Tavahind", "DELUXE TICKET": "Kehtiv pilet + Sissepääs ilma järjekorrata VIP kaudu", "FAN TICKET": "VIP sissepääs + Eksklusiivne käevõru + LED pärg" },
};

const ru: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "С", clock: "", selectDate: "Выберите дату",
  soldOutLabel: "Распродано", reservedFor: "Зарезервировано:", soldOutTitle: "РАСПРОДАНО",
  soldOutDesc: "Это мероприятие, к сожалению, распродано. Посмотрите другие даты!",
  soldOutBadge: "РАСПРОДАНО", comingSoonLabel: "СКОРО",
  ticketsLoading: "Загрузка билетов...", discountPlaceholder: "Введите промокод", discountApply: "Применить",
  discountApplied: "✓ Код будет проверен при оплате", continueBtn: "ДАЛЕЕ", inclVat: "вкл. НДС",
  eventInfoTitle: "Информация о мероприятии",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – ФАНАТСКИЙ КОНЦЕРТ!", "На Mamma Mia Party мы отмечаем величайшие хиты ABBA – вместе с ВАМИ!", "От \"Dancing Queen\" до \"Mamma Mia\" и \"Waterloo\" – все культовые хиты вживую.", "ДРЕСС-КОД", "Блёстки, Mamma Mia или тема ABBA! (Не обязательно, но приветствуется)", "Начало", ""),
  admissionTitle: "Информация о входе",
  admissionContent: "✅ Вход с 18 лет – исключения только по договорённости.\n\n✅ Шоу начинается, когда войдёт большая часть зрителей.\n\n✅ Вход обычно занимает не более 30 минут.\n\n✅ Билет не нужно распечатывать – достаточно цифровой версии.",
  freeTicketsTitle: "Бесплатные билеты и многое другое?", whatsappJoin: "Присоединяйтесь", whatsappDesc: "Станьте частью нашего WhatsApp сообщества.",
  moreCities: "Больше городов", moreCitiesDesc: "Купите билеты в другие города", kmAway: "км",
  footerQuestion: "Вопросы, проблемы или запросы на бронирование?", footerContact: "Свяжитесь с нами:",
  footerOrganizer: "Организатор: Gimme Gimme Party.", imprint: "Правовая информация", privacy: "Конфиденциальность", terms: "Условия",
  loading: "Загрузка...",
  weekdays: ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
  monthsShort: ["","Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],
  badgeMap: { "FAST AUSVERKAUFT": "ПОЧТИ РАСПРОДАНО", "84% schon weg": "84% уже продано", "FANLIEBLING": "ФАВОРИТ ФАНАТОВ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Цена входа", "LAST CHANCE TICKET": "Скидка · Доступ даже на распроданные мероприятия", "LAST MINUTE TICKET": "Обычный вход", "DELUXE TICKET": "Действующий билет + Вход без очереди через VIP", "FAN TICKET": "VIP вход + Эксклюзивный браслет + LED венок" },
};

const uk: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "ВІД", clock: "", selectDate: "Обери дату",
  soldOutLabel: "Розпродано", reservedFor: "Зарезервовано:", soldOutTitle: "РОЗПРОДАНО",
  soldOutDesc: "Ця подія, на жаль, розпродана. Переглянь інші дати!",
  soldOutBadge: "РОЗПРОДАНО", comingSoonLabel: "НЕЗАБАРОМ",
  ticketsLoading: "Завантаження квитків...", discountPlaceholder: "Введіть код знижки", discountApply: "Застосувати",
  discountApplied: "✓ Код буде перевірено при оплаті", continueBtn: "ДАЛІ", inclVat: "з ПДВ",
  eventInfoTitle: "Інформація про подію",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – ФАНАТСЬКИЙ КОНЦЕРТ!", "На Mamma Mia Party святкуємо найбільші хіти ABBA – разом з ВАМИ!", "Від \"Dancing Queen\" до \"Mamma Mia\" та \"Waterloo\" – усі культові хіти наживо.", "ДРЕС-КОД", "Блискітки, Mamma Mia або тема ABBA! (Не обов'язково, але вітається)", "Початок", ""),
  admissionTitle: "Інформація про вхід",
  admissionContent: "✅ Вхід з 18 років – виключення лише за домовленістю.\n\n✅ Шоу починається, коли увійде більшість глядачів.\n\n✅ Вхід зазвичай займає не більше 30 хвилин.\n\n✅ Квиток не потрібно друкувати – достатньо цифрової версії.",
  freeTicketsTitle: "Безкоштовні квитки та більше?", whatsappJoin: "Приєднуйся", whatsappDesc: "Стань частиною нашої WhatsApp спільноти.",
  moreCities: "Більше міст", moreCitiesDesc: "Купуй квитки в інші міста", kmAway: "км",
  footerQuestion: "Запитання, проблеми або запити на бронювання?", footerContact: "Зв'яжіться з нами:",
  footerOrganizer: "Організатор: Gimme Gimme Party.", imprint: "Правова інформація", privacy: "Конфіденційність", terms: "Умови",
  loading: "Завантаження...",
  weekdays: ["Неділя","Понеділок","Вівторок","Середа","Четвер","П'ятниця","Субота"],
  monthsShort: ["","Січ","Лют","Бер","Кві","Тра","Чер","Лип","Сер","Вер","Жов","Лис","Гру"],
  badgeMap: { "FAST AUSVERKAUFT": "МАЙЖЕ РОЗПРОДАНО", "84% schon weg": "84% вже продано", "FANLIEBLING": "УЛЮБЛЕНЕЦЬ ФАНАТІВ" },
  ticketDescMap: { "EARLY BIRD TICKET": "Ціна входу", "LAST CHANCE TICKET": "Знижка · Доступ навіть на розпродані події", "LAST MINUTE TICKET": "Звичайний вхід", "DELUXE TICKET": "Дійсний квиток + Вхід без черги через VIP", "FAN TICKET": "VIP вхід + Ексклюзивний браслет + LED вінок" },
};

const sq: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "NGA", clock: "", selectDate: "Zgjidh datën tënde",
  soldOutLabel: "E shitur", reservedFor: "E rezervuar:", soldOutTitle: "E SHITUR",
  soldOutDesc: "Ky event fatkeqësisht është shitur. Shiko datat e tjera!",
  soldOutBadge: "E SHITUR", comingSoonLabel: "SË SHPEJTI",
  ticketsLoading: "Po ngarkohen biletat...", discountPlaceholder: "Fut kodin e zbritjes", discountApply: "Apliko",
  discountApplied: "✓ Kodi do të verifikohet në pagesë", continueBtn: "VAZHDO", inclVat: "me TVSH",
  eventInfoTitle: "Informacione mbi eventin",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – KONCERTI I FANSAVE!", "Në Mamma Mia Party festojmë hitet më të mëdha të ABBA – bashkë me JU!", "Nga \"Dancing Queen\" te \"Mamma Mia\" dhe \"Waterloo\" – të gjitha hitet kult live.", "DRESS CODE", "Shkëlqim, Mamma Mia ose temë ABBA! (Jo e detyrueshme, por e mirëpritur)", "Fillimi", ""),
  admissionTitle: "Informacione hyrjeje",
  admissionContent: "✅ Hyrje nga 18 vjeç – përjashtime vetëm me marrëveshje.\n\n✅ Show fillon kur pjesa më e madhe e publikut hyn.\n\n✅ Hyrja zakonisht nuk zgjat më shumë se 30 minuta.\n\n✅ Biletën nuk duhet ta printoni – mjafton versioni dixhital.",
  freeTicketsTitle: "Bileta falas dhe më shumë?", whatsappJoin: "Bashkohu tani", whatsappDesc: "Bëhu pjesë e komunitetit tonë WhatsApp.",
  moreCities: "Më shumë qytete", moreCitiesDesc: "Merr bileta për qytete të tjera", kmAway: "km larg",
  footerQuestion: "Pyetje, probleme ose kërkesa rezervimi?", footerContact: "Na kontaktoni:",
  footerOrganizer: "Organizatori: Gimme Gimme Party.", imprint: "Info ligjore", privacy: "Privatësia", terms: "Kushtet",
  loading: "Po ngarkohet...",
  weekdays: ["E Diel","E Hënë","E Martë","E Mërkurë","E Enjte","E Premte","E Shtunë"],
  monthsShort: ["","Jan","Shk","Mar","Pri","Maj","Qer","Kor","Gsh","Sht","Tet","Nën","Dhj"],
  badgeMap: { "FAST AUSVERKAUFT": "POTHUAJSE E SHITUR", "84% schon weg": "84% tashmë shitur", "FANLIEBLING": "FAVORIT I FANSAVE" },
  ticketDescMap: { "EARLY BIRD TICKET": "Çmimi i hyrjes", "LAST CHANCE TICKET": "Hyrje me zbritje · Akses edhe në evente të shitura", "LAST MINUTE TICKET": "Hyrje e rregullt", "DELUXE TICKET": "Biletë e vlefshme + Hyrje pa radhë përmes VIP", "FAN TICKET": "Hyrje VIP + Byzylyk ekskluziv + Kurorë LED" },
};

const bs: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "OD", clock: "", selectDate: "Odaberi datum",
  soldOutLabel: "Rasprodano", reservedFor: "Rezervisano za:", soldOutTitle: "RASPRODANO",
  soldOutDesc: "Ovaj događaj je nažalost rasprodan. Pogledaj druge datume!",
  soldOutBadge: "RASPRODANO", comingSoonLabel: "USKORO",
  ticketsLoading: "Učitavanje karata...", discountPlaceholder: "Unesi kod za popust", discountApply: "Primijeni",
  discountApplied: "✓ Kod će biti provjeren pri plaćanju", continueBtn: "NASTAVI", inclVat: "s PDV-om",
  eventInfoTitle: "Informacije o događaju",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY - FAN KONCERT!", "Na Mamma Mia Partyju slavimo najvece hitove ABBA-e - zajedno sa VAMA!", "Od 'Dancing Queen' preko 'Mamma Mia' do 'Waterloo' - svi kultni hitovi uzivo.", "DRESS CODE", "Sljokice, Mamma Mia ili ABBA tema! (Nije obavezno, ali je dobrodoslo)", "Pocetak", ""),
  admissionTitle: "Informacije o ulasku",
  admissionContent: "✅ Ulaz od 18 godina – izuzetci samo po dogovoru.\n\n✅ Show počinje kad većina publike uđe.\n\n✅ Ulaz obično ne traje duže od 30 minuta.\n\n✅ Kartu ne trebaš printati – dovoljna je digitalna verzija.",
  freeTicketsTitle: "Besplatne karte i više?", whatsappJoin: "Pridruži se sada", whatsappDesc: "Postani dio naše WhatsApp zajednice.",
  moreCities: "Više gradova", moreCitiesDesc: "Kupi karte za druge gradove", kmAway: "km daleko",
  footerQuestion: "Pitanja, problemi ili zahtjevi za rezervaciju?", footerContact: "Kontaktiraj nas:",
  footerOrganizer: "Organizator: Gimme Gimme Party.", imprint: "Impressum", privacy: "Privatnost", terms: "Uslovi korištenja",
  loading: "Učitavanje...",
  weekdays: ["Nedjelja","Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"],
  monthsShort: ["","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Avg","Sep","Okt","Nov","Dec"],
  badgeMap: { "FAST AUSVERKAUFT": "SKORO RASPRODANO", "84% schon weg": "84% već prodano", "FANLIEBLING": "OMILJENO" },
  ticketDescMap: { "EARLY BIRD TICKET": "Cijena ulaznice", "LAST CHANCE TICKET": "Snižen ulaz · Ulaz i na rasprodane događaje", "LAST MINUTE TICKET": "Regularan ulaz", "DELUXE TICKET": "Važeća karta + Ulaz bez reda kroz VIP", "FAN TICKET": "VIP ulaz + Ekskluzivna narukvica + LED vijenac" },
};

const ka: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "", clock: "სთ", selectDate: "აირჩიე თარიღი",
  soldOutLabel: "გაყიდულია", reservedFor: "დაჯავშნილია:", soldOutTitle: "გაყიდულია",
  soldOutDesc: "ეს ღონისძიება სამწუხაროდ გაყიდულია. ნახე სხვა თარიღები!",
  soldOutBadge: "გაყიდულია", comingSoonLabel: "მალე",
  ticketsLoading: "ბილეთების ჩატვირთვა...", discountPlaceholder: "შეიყვანეთ ფასდაკლების კოდი", discountApply: "გამოყენება",
  discountApplied: "✓ კოდი შემოწმდება გადახდისას", continueBtn: "გაგრძელება", inclVat: "დღგ-ით",
  eventInfoTitle: "ღონისძიების ინფორმაცია",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – ფანების კონცერტი!", "Mamma Mia Party-ზე ვზეიმობთ ABBA-ს უდიდეს ჰიტებს – თქვენთან ერთად!", "\"Dancing Queen\"-დან \"Mamma Mia\"-მდე და \"Waterloo\"-მდე – ყველა კულტური ჰიტი ლაივში.", "ᲓᲠᲔᲡ-ᲙᲝᲓᲘ", "ბრჭყვიალა, Mamma Mia ან ABBA თემა! (არ არის სავალდებულო, მაგრამ მისასალმებელია)", "დასაწყისი", " სთ"),
  admissionTitle: "შესვლის ინფორმაცია",
  admissionContent: "✅ შესვლა 18 წლიდან – გამონაკლისები მხოლოდ შეთანხმებით.\n\n✅ შოუ იწყება, როდესაც აუდიტორიის უმეტესობა შემოვა.\n\n✅ შესვლა ჩვეულებრივ 30 წუთზე მეტს არ იკავებს.\n\n✅ ბილეთის ამობეჭდვა არ არის საჭირო – ციფრული ვერსია საკმარისია.",
  freeTicketsTitle: "უფასო ბილეთები და მეტი?", whatsappJoin: "შემოგვიერთდი", whatsappDesc: "გახდი ჩვენი WhatsApp საზოგადოების ნაწილი.",
  moreCities: "მეტი ქალაქი", moreCitiesDesc: "შეიძინე ბილეთები სხვა ქალაქებში", kmAway: "კმ",
  footerQuestion: "კითხვები, პრობლემები ან ჯავშნის მოთხოვნები?", footerContact: "დაგვიკავშირდით:",
  footerOrganizer: "ორგანიზატორი: Gimme Gimme Party.", imprint: "იურიდიული ინფო", privacy: "კონფიდენციალურობა", terms: "პირობები",
  loading: "იტვირთება...",
  weekdays: ["კვირა","ორშაბათი","სამშაბათი","ოთხშაბათი","ხუთშაბათი","პარასკევი","შაბათი"],
  monthsShort: ["","იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"],
  badgeMap: { "FAST AUSVERKAUFT": "ᲗᲘᲗᲥᲛᲘᲡ ᲒᲐᲧᲘᲓᲣᲚᲘᲐ", "84% schon weg": "84% უკვე გაყიდულია", "FANLIEBLING": "ᲤᲐᲕᲝᲠᲘᲢᲘ" },
  ticketDescMap: { "EARLY BIRD TICKET": "შესვლის ფასი", "LAST CHANCE TICKET": "ფასდაკლებული შესვლა · წვდომა გაყიდულ ღონისძიებებზეც", "LAST MINUTE TICKET": "სტანდარტული შესვლა", "DELUXE TICKET": "მოქმედი ბილეთი + რიგის გარეშე VIP-ით", "FAN TICKET": "VIP შესვლა + ექსკლუზიური სამაჯური + LED გვირგვინი" },
};

const ja: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "", clock: "時", selectDate: "日付を選択",
  soldOutLabel: "完売", reservedFor: "予約済み:", soldOutTitle: "完売",
  soldOutDesc: "このイベントは残念ながら完売です。他の日程をご覧ください！",
  soldOutBadge: "完売", comingSoonLabel: "近日公開",
  ticketsLoading: "チケット読み込み中...", discountPlaceholder: "割引コードを入力", discountApply: "適用",
  discountApplied: "✓ コードはチェックアウト時に確認されます", continueBtn: "次へ", inclVat: "税込",
  eventInfoTitle: "イベント情報",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – ファンコンサート！", "Mamma Mia PartyではABBAの最大のヒット曲を皆さんと一緒にお祝いします！", "「Dancing Queen」から「Mamma Mia」「Waterloo」まで – 全ての名曲をライブで。", "ドレスコード", "グリッター、Mamma MiaまたはABBAテーマ！（必須ではありませんが歓迎です）", "開始", "時"),
  admissionTitle: "入場情報",
  admissionContent: "✅ 18歳以上 – 例外は会場との協議のみ。\n\n✅ ショーは観客の大半が入場してから開始します。\n\n✅ 入場は通常30分以内です。\n\n✅ チケットを印刷する必要はありません – デジタル版で十分です。",
  freeTicketsTitle: "無料チケット＆その他？", whatsappJoin: "今すぐ参加", whatsappDesc: "WhatsAppコミュニティに参加しよう。",
  moreCities: "他の都市", moreCitiesDesc: "他の都市のチケットを今すぐ入手", kmAway: "km",
  footerQuestion: "質問、問題、または予約リクエスト？", footerContact: "お問い合わせ:",
  footerOrganizer: "主催: Gimme Gimme Party.", imprint: "法的情報", privacy: "プライバシー", terms: "利用規約",
  loading: "読み込み中...",
  weekdays: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
  monthsShort: ["","1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  badgeMap: { "FAST AUSVERKAUFT": "残りわずか", "84% schon weg": "84%販売済み", "FANLIEBLING": "ファン人気" },
  ticketDescMap: { "EARLY BIRD TICKET": "入場料", "LAST CHANCE TICKET": "割引入場 · 完売イベントへのアクセスも可能", "LAST MINUTE TICKET": "通常入場", "DELUXE TICKET": "有効チケット + VIPから列なしで入場", "FAN TICKET": "VIP入場 + 限定リストバンド + LEDクラウン" },
};

const ko: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "", clock: "시", selectDate: "날짜를 선택하세요",
  soldOutLabel: "매진", reservedFor: "예약됨:", soldOutTitle: "매진",
  soldOutDesc: "이 이벤트는 안타깝게도 매진되었습니다. 다른 날짜를 확인하세요!",
  soldOutBadge: "매진", comingSoonLabel: "곧 출시",
  ticketsLoading: "티켓 로딩 중...", discountPlaceholder: "할인 코드 입력", discountApply: "적용",
  discountApplied: "✓ 코드는 결제 시 확인됩니다", continueBtn: "계속", inclVat: "부가세 포함",
  eventInfoTitle: "이벤트 정보",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – 팬 콘서트!", "Mamma Mia Party에서 ABBA의 최고 히트곡을 함께 축하합니다!", "\"Dancing Queen\"에서 \"Mamma Mia\"와 \"Waterloo\"까지 – 모든 명곡 라이브.", "드레스 코드", "글리터, Mamma Mia 또는 ABBA 테마! (필수는 아니지만 환영합니다)", "시작", "시"),
  admissionTitle: "입장 정보",
  admissionContent: "✅ 18세 이상 입장 – 예외는 장소와 협의 시에만.\n\n✅ 관객 대부분이 입장하면 쇼가 시작됩니다.\n\n✅ 입장은 보통 30분 이내입니다.\n\n✅ 티켓을 인쇄할 필요 없음 – 디지털 버전으로 충분합니다.",
  freeTicketsTitle: "무료 티켓 & 더 많은 혜택?", whatsappJoin: "지금 참여", whatsappDesc: "WhatsApp 커뮤니티에 참여하세요.",
  moreCities: "더 많은 도시", moreCitiesDesc: "다른 도시 티켓을 지금 구매하세요", kmAway: "km 거리",
  footerQuestion: "질문, 문제 또는 예약 요청?", footerContact: "문의하기:",
  footerOrganizer: "주최: Gimme Gimme Party.", imprint: "법적 정보", privacy: "개인정보", terms: "이용약관",
  loading: "로딩 중...",
  weekdays: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
  monthsShort: ["","1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  badgeMap: { "FAST AUSVERKAUFT": "거의 매진", "84% schon weg": "84% 판매 완료", "FANLIEBLING": "팬 인기" },
  ticketDescMap: { "EARLY BIRD TICKET": "입장료", "LAST CHANCE TICKET": "할인 입장 · 매진 이벤트에도 접근 가능", "LAST MINUTE TICKET": "일반 입장", "DELUXE TICKET": "유효 티켓 + VIP를 통한 줄 없는 입장", "FAN TICKET": "VIP 입장 + 한정 팔찌 + LED 크라운" },
};

const zh: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "", clock: "时", selectDate: "选择日期",
  soldOutLabel: "已售罄", reservedFor: "已预订:", soldOutTitle: "已售罄",
  soldOutDesc: "此活动很遗憾已售罄。查看其他日期吧！",
  soldOutBadge: "已售罄", comingSoonLabel: "即将推出",
  ticketsLoading: "加载票务中...", discountPlaceholder: "输入折扣码", discountApply: "应用",
  discountApplied: "✓ 代码将在结账时验证", continueBtn: "继续", inclVat: "含税",
  eventInfoTitle: "活动信息",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – 粉丝演唱会！", "在Mamma Mia Party上，我们与大家一起庆祝ABBA最伟大的金曲！", "从\"Dancing Queen\"到\"Mamma Mia\"和\"Waterloo\" – 所有经典金曲现场演出。", "着装要求", "亮片、Mamma Mia或ABBA主题！（非必须，但欢迎）", "开始", "时"),
  admissionTitle: "入场信息",
  admissionContent: "✅ 18岁以上入场 – 例外仅限与场地协商。\n\n✅ 大部分观众入场后演出开始。\n\n✅ 入场通常不超过30分钟。\n\n✅ 无需打印门票 – 手机电子版即可。",
  freeTicketsTitle: "免费票和更多？", whatsappJoin: "立即加入", whatsappDesc: "加入我们的WhatsApp社区。",
  moreCities: "更多城市", moreCitiesDesc: "立即购买其他城市的门票", kmAway: "公里",
  footerQuestion: "问题、疑问或预订请求？", footerContact: "联系我们:",
  footerOrganizer: "主办方: Gimme Gimme Party.", imprint: "法律信息", privacy: "隐私政策", terms: "条款与条件",
  loading: "加载中...",
  weekdays: ["周日","周一","周二","周三","周四","周五","周六"],
  monthsShort: ["","1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  badgeMap: { "FAST AUSVERKAUFT": "即将售罄", "84% schon weg": "84%已售出", "FANLIEBLING": "粉丝最爱" },
  ticketDescMap: { "EARLY BIRD TICKET": "门票价格", "LAST CHANCE TICKET": "优惠入场 · 即使售罄也可进入", "LAST MINUTE TICKET": "普通入场", "DELUXE TICKET": "有效门票 + VIP免排队入场", "FAN TICKET": "VIP入场 + 限量手环 + LED花冠" },
};

const ar: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "من", clock: "", selectDate: "اختر تاريخك",
  soldOutLabel: "نفذت", reservedFor: "محجوز لـ:", soldOutTitle: "نفذت",
  soldOutDesc: "هذا الحدث للأسف نفذ. تحقق من التواريخ الأخرى!",
  soldOutBadge: "نفذت", comingSoonLabel: "قريباً",
  ticketsLoading: "جاري تحميل التذاكر...", discountPlaceholder: "أدخل رمز الخصم", discountApply: "تطبيق",
  discountApplied: "✓ سيتم التحقق من الرمز عند الدفع", continueBtn: "متابعة", inclVat: "شامل الضريبة",
  eventInfoTitle: "معلومات الحدث",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – حفل المعجبين!", "في Mamma Mia Party نحتفل بأعظم أغاني ABBA – معكم!", "من \"Dancing Queen\" إلى \"Mamma Mia\" و\"Waterloo\" – كل الأغاني الأيقونية مباشرة.", "قواعد اللباس", "لمعان، Mamma Mia أو موضوع ABBA! (غير إلزامي، لكن مرحب به)", "البداية", ""),
  admissionTitle: "معلومات الدخول",
  admissionContent: "✅ الدخول من 18 سنة – استثناءات فقط بالاتفاق.\n\n✅ يبدأ العرض عند دخول غالبية الجمهور.\n\n✅ الدخول عادة لا يستغرق أكثر من 30 دقيقة.\n\n✅ لا حاجة لطباعة التذكرة – النسخة الرقمية كافية.",
  freeTicketsTitle: "تذاكر مجانية والمزيد؟", whatsappJoin: "انضم الآن", whatsappDesc: "كن جزءاً من مجتمعنا على واتساب.",
  moreCities: "المزيد من المدن", moreCitiesDesc: "احصل على تذاكر لمدن أخرى الآن", kmAway: "كم",
  footerQuestion: "أسئلة، مشاكل أو طلبات حجز؟", footerContact: "تواصل معنا:",
  footerOrganizer: "المنظم: Gimme Gimme Party.", imprint: "معلومات قانونية", privacy: "الخصوصية", terms: "الشروط والأحكام",
  loading: "جاري التحميل...",
  weekdays: ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
  monthsShort: ["","يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
  badgeMap: { "FAST AUSVERKAUFT": "شبه نفذت", "84% schon weg": "84% بيعت بالفعل", "FANLIEBLING": "المفضل لدى المعجبين" },
  ticketDescMap: { "EARLY BIRD TICKET": "سعر الدخول", "LAST CHANCE TICKET": "دخول مخفض · وصول حتى للأحداث المنفذة", "LAST MINUTE TICKET": "دخول عادي", "DELUXE TICKET": "تذكرة صالحة + دخول بدون طابور عبر VIP", "FAN TICKET": "دخول VIP + سوار حصري + تاج LED" },
};

const th: BaseTranslations = {
  tourSubtitle: "MAMMA MIA / ABBA TOUR", from: "เริ่ม", clock: "น.", selectDate: "เลือกวันที่",
  soldOutLabel: "ขายหมด", reservedFor: "จองแล้ว:", soldOutTitle: "ขายหมด",
  soldOutDesc: "อีเวนต์นี้ขายหมดแล้ว ดูวันอื่นได้เลย!",
  soldOutBadge: "ขายหมด", comingSoonLabel: "เร็วๆ นี้",
  ticketsLoading: "กำลังโหลดตั๋ว...", discountPlaceholder: "ใส่รหัสส่วนลด", discountApply: "ใช้",
  discountApplied: "✓ รหัสจะถูกตรวจสอบเมื่อชำระเงิน", continueBtn: "ถัดไป", inclVat: "รวม VAT",
  eventInfoTitle: "ข้อมูลอีเวนต์",
  eventInfoContent: makeEventInfo("MAMMA MIA PARTY – คอนเสิร์ตแฟนๆ!", "ที่ Mamma Mia Party เราฉลองเพลงฮิตที่สุดของ ABBA – ร่วมกับพวกคุณ!", "จาก \"Dancing Queen\" ถึง \"Mamma Mia\" และ \"Waterloo\" – เพลงฮิตทั้งหมดสด.", "เดรสโค้ด", "กลิตเตอร์, Mamma Mia หรือธีม ABBA! (ไม่บังคับ แต่ยินดีต้อนรับ)", "เริ่ม", " น."),
  admissionTitle: "ข้อมูลการเข้างาน",
  admissionContent: "✅ เข้างานตั้งแต่ 18 ปี – ข้อยกเว้นตามการตกลงเท่านั้น.\n\n✅ โชว์เริ่มเมื่อผู้ชมส่วนใหญ่เข้ามาแล้ว.\n\n✅ การเข้างานใช้เวลาไม่เกิน 30 นาที.\n\n✅ ไม่ต้องปริ้นท์ตั๋ว – เวอร์ชันดิจิทัลเพียงพอ.",
  freeTicketsTitle: "ตั๋วฟรีและอื่นๆ?", whatsappJoin: "เข้าร่วมเลย", whatsappDesc: "เป็นส่วนหนึ่งของชุมชน WhatsApp.",
  moreCities: "เมืองอื่นๆ", moreCitiesDesc: "ซื้อตั๋วเมืองอื่นเลย", kmAway: "กม.",
  footerQuestion: "คำถาม ปัญหา หรือคำขอจอง?", footerContact: "ติดต่อเรา:",
  footerOrganizer: "ผู้จัด: Gimme Gimme Party.", imprint: "ข้อมูลกฎหมาย", privacy: "ความเป็นส่วนตัว", terms: "ข้อกำหนดและเงื่อนไข",
  loading: "กำลังโหลด...",
  weekdays: ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"],
  monthsShort: ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."],
  badgeMap: { "FAST AUSVERKAUFT": "เกือบหมดแล้ว", "84% schon weg": "ขายแล้ว 84%", "FANLIEBLING": "แฟนชื่นชอบ" },
  ticketDescMap: { "EARLY BIRD TICKET": "ราคาเข้างาน", "LAST CHANCE TICKET": "เข้างานราคาพิเศษ · เข้าได้แม้งานขายหมด", "LAST MINUTE TICKET": "เข้างานปกติ", "DELUXE TICKET": "ตั๋วใช้ได้ + เข้าไม่ต้องต่อคิวผ่าน VIP", "FAN TICKET": "เข้า VIP + สายรัดข้อมือพิเศษ + มงกุฎ LED" },
};

/* ─── All translations map (neutralized branding) ─── */
const rawTranslations: Record<LangCode, BaseTranslations> = {
  de, nl, fr, en, pl, hr, pt, it, es, cs, da, sv, no, fi,
  hu, ro, bg, el, tr, sr, sl, sk, lt, lv, et, ru, uk, sq, bs, ka, ja, ko, zh, ar, th,
};

// Override branding to be neutral for all languages
const baseTranslations = Object.fromEntries(
  Object.entries(rawTranslations).map(([lang, t]) => [lang, {
    ...t,
    tourSubtitle: "",
    footerOrganizer: "partyticket.app",
  }])
) as Record<LangCode, BaseTranslations>;

/* ─── City → Language mapping ─── */
const CITY_LANG: Record<string, LangCode> = {
  // Netherlands
  Amsterdam: "nl", Rotterdam: "nl", Utrecht: "nl", Eindhoven: "nl", DenHaag: "nl", Groningen: "nl",
  // Belgium (Dutch-speaking)
  Antwerpen: "nl", Gent: "nl", Brugge: "nl",
  // Belgium (French-speaking)
  Bruxelles: "fr", Liège: "fr", Namur: "fr", Charleroi: "fr",
  // France
  Paris: "fr", Lyon: "fr", Marseille: "fr", Toulouse: "fr", Nice: "fr", Bordeaux: "fr", Strasbourg: "fr",
  "Le Havre": "fr", Mathay: "fr", Lille: "fr", Montpellier: "fr", Nantes: "fr", Rennes: "fr",
  // Luxembourg
  Luxembourg: "fr",
  // Italy
  Milano: "it", Roma: "it", Napoli: "it", Torino: "it", Firenze: "it", Bologna: "it", Venezia: "it", Verona: "it", Palermo: "it", Genova: "it", Bari: "it", Catania: "it",
  // Spain
  Madrid: "es", Barcelona: "es", Valencia: "es", Sevilla: "es", Málaga: "es", Bilbao: "es", Zaragoza: "es", Palma: "es", "Las Palmas": "es", Ibiza: "es",
  // Portugal
  Lisboa: "pt", Porto: "pt", Faro: "pt",
  // Brazil
  "São Paulo": "pt", "Rio de Janeiro": "pt", Brasília: "pt", Salvador: "pt", Curitiba: "pt",
  // Poland
  Krakow: "pl", Warszawa: "pl", Gdańsk: "pl", Wrocław: "pl", Poznań: "pl", Łódź: "pl", Katowice: "pl",
  // Czech Republic
  Praha: "cs", Brno: "cs", Ostrava: "cs", Plzeň: "cs",
  // Slovakia
  Bratislava: "sk", Košice: "sk",
  // Hungary
  Budapest: "hu", Debrecen: "hu", Szeged: "hu",
  // Romania
  București: "ro", Cluj: "ro", Timișoara: "ro", Iași: "ro",
  // Bulgaria
  Sofia: "bg", Plovdiv: "bg", Varna: "bg",
  // Croatia
  Zagreb: "hr", Split: "hr", Dubrovnik: "hr", Zadar: "hr", Rijeka: "hr",
  // Serbia
  Beograd: "sr", "Novi Sad": "sr", Niš: "sr",
  // Bosnia
  Sarajevo: "bs", "Banja Luka": "bs", Mostar: "bs",
  // Slovenia
  Ljubljana: "sl", Maribor: "sl",
  // Greece
  Athina: "el", Thessaloniki: "el", Heraklion: "el",
  // Turkey
  Istanbul: "tr", Ankara: "tr", Izmir: "tr", Antalya: "tr", Bodrum: "tr",
  // Denmark
  København: "da", Aarhus: "da", Odense: "da", Aalborg: "da",
  // Sweden
  Stockholm: "sv", Göteborg: "sv", Malmö: "sv", Uppsala: "sv",
  // Norway
  Oslo: "no", Bergen: "no", Trondheim: "no", Stavanger: "no",
  // Finland
  Helsinki: "fi", Tampere: "fi", Turku: "fi",
  // Lithuania
  Vilnius: "lt", Kaunas: "lt",
  // Latvia
  Riga: "lv", Liepāja: "lv",
  // Estonia
  Tallinn: "et", Tartu: "et",
  // Russia
  Moskva: "ru", "Sankt-Peterburg": "ru",
  // Ukraine
  Kyiv: "uk", Lviv: "uk", Odesa: "uk", Kharkiv: "uk",
  // Albania
  Tirana: "sq", Durrës: "sq",
  // Georgia
  Tbilisi: "ka", Batumi: "ka",
  // Japan
  Tokyo: "ja", Osaka: "ja", Yokohama: "ja",
  // South Korea
  Seoul: "ko", Busan: "ko",
  // China
  Shanghai: "zh", Beijing: "zh", Shenzhen: "zh",
  // Arabic-speaking
  Dubai: "ar", AbuDhabi: "ar", Riyadh: "ar", Doha: "ar",
  // Thailand
  Bangkok: "th", ChiangMai: "th", Phuket: "th",
  // UK / Ireland / International English
  London: "en", Manchester: "en", Birmingham: "en", Dublin: "en", Edinburgh: "en", Glasgow: "en",
  // USA
  NewYork: "en", LosAngeles: "en", Chicago: "en", Miami: "en", SanFrancisco: "en",
  // Australia
  Sydney: "en", Melbourne: "en",
};

export const getLangForCity = (city: string): LangCode => CITY_LANG[city] || "de";

export const getTranslations = (city: string): Translations => {
  const lang = getLangForCity(city);
  const base = baseTranslations[lang];
  const checkout = checkoutI18n[lang] || checkoutI18n.de;
  return { ...base, ...checkout } as Translations;
};

export const getCurrencyForCity = (city: string): string => {
  // City-specific overrides first (some countries share languages but differ in currency)
  const cityUpper = city.toUpperCase();
  if (["ZÜRICH", "ZURICH", "BERN", "BASEL", "GENF", "GENEVA", "LUZERN", "LUCERNE", "LAUSANNE", "WINTERTHUR", "ST. GALLEN"].some(c => cityUpper.includes(c))) return "CHF";
  if (["LONDON", "MANCHESTER", "BIRMINGHAM", "LIVERPOOL", "EDINBURGH", "GLASGOW", "BRISTOL", "LEEDS", "CARDIFF", "BELFAST"].some(c => cityUpper.includes(c))) return "GBP";
  if (["SÃO PAULO", "SAO PAULO", "RIO DE JANEIRO", "BRASILIA", "SALVADOR", "FORTALEZA", "CURITIBA", "BELO HORIZONTE"].some(c => cityUpper.includes(c))) return "BRL";
  if (["NEW YORK", "LOS ANGELES", "CHICAGO", "MIAMI", "SAN FRANCISCO", "HOUSTON", "DALLAS", "BOSTON", "SEATTLE", "LAS VEGAS", "WASHINGTON"].some(c => cityUpper.includes(c))) return "USD";
  if (["TORONTO", "MONTREAL", "VANCOUVER", "CALGARY", "OTTAWA"].some(c => cityUpper.includes(c))) return "CAD";
  if (["SYDNEY", "MELBOURNE", "BRISBANE", "PERTH", "ADELAIDE"].some(c => cityUpper.includes(c))) return "AUD";
  if (["TOKYO", "OSAKA", "KYOTO", "YOKOHAMA"].some(c => cityUpper.includes(c))) return "JPY";
  if (["DUBAI", "ABU DHABI"].some(c => cityUpper.includes(c))) return "AED";

  const lang = getLangForCity(city);
  switch (lang) {
    case "pl": return "PLN";
    case "cs": return "CZK";
    case "hu": return "HUF";
    case "ro": return "RON";
    case "bg": return "BGN";
    case "da": return "DKK";
    case "no": return "NOK";
    case "sv": return "SEK";
    case "tr": return "TRY";
    case "ru": return "RUB";
    case "uk": return "UAH";
    case "ja": return "JPY";
    case "ko": return "KRW";
    case "zh": return "CNY";
    case "th": return "THB";
    case "sq": return "ALL";
    case "ka": return "GEL";
    case "hr": case "bs": case "sr": case "sl": case "sk": case "lt": case "lv": case "et": case "fi":
    case "el": case "pt": case "it": case "es": case "fr": case "nl": case "de": case "en":
      return "EUR";
    default: return "EUR";
  }
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    EUR: "€", USD: "$", GBP: "£", CHF: "CHF", PLN: "zł", CZK: "Kč", HUF: "Ft",
    RON: "lei", BGN: "лв", DKK: "kr", NOK: "kr", SEK: "kr", TRY: "₺", RUB: "₽",
    UAH: "₴", JPY: "¥", KRW: "₩", CNY: "¥", AED: "د.إ", THB: "฿", ALL: "L",
    GEL: "₾", BRL: "R$", CAD: "CA$", AUD: "A$",
  };
  return symbols[currency] || currency;
};

// Mollie-supported countries – everything else goes to Stripe
const MOLLIE_CURRENCIES = new Set(["EUR", "CHF", "GBP", "PLN", "CZK", "HUF", "RON", "BGN", "DKK", "NOK", "SEK"]);

/** Returns "mollie" for European core markets, "stripe" for the rest */
export const getPaymentProvider = (currency: string): "mollie" | "stripe" => {
  return MOLLIE_CURRENCIES.has(currency) ? "mollie" : "stripe";
};

// Approximate exchange rates from EUR (updated periodically)
const EUR_RATES: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, PLN: 4.32, CZK: 25.2, HUF: 395,
  RON: 4.97, BGN: 1.96, DKK: 7.46, NOK: 11.5, SEK: 11.2, TRY: 35.5, RUB: 98,
  UAH: 43, JPY: 163, KRW: 1450, CNY: 7.85, AED: 3.97, THB: 37.5, ALL: 104,
  GEL: 2.95, BRL: 5.45, CAD: 1.48, AUD: 1.66,
};

/** Convert EUR price to local currency and format with local decimal separator */
export const convertPrice = (eurPrice: number, currency: string, lang: LangCode): string => {
  if (currency === "EUR") return eurPrice.toFixed(2).replace(".", ",");
  const rate = EUR_RATES[currency] || 1;
  const converted = eurPrice * rate;
  // Use comma for most European languages, dot for English/Asian
  const useDot = ["en", "ja", "ko", "zh", "th"].includes(lang);
  if (currency === "JPY" || currency === "KRW") return Math.round(converted).toLocaleString("de-DE");
  return useDot ? converted.toFixed(2) : converted.toFixed(2).replace(".", ",");
};

export const translateBadge = (badge: string, t: Translations): string => {
  return t.badgeMap[badge] || badge;
};

export const translateTicketDesc = (ticketName: string, fallbackDesc: string, t: Translations): string => {
  return t.ticketDescMap[ticketName] || fallbackDesc;
};

/* ─── Global / Landing Page i18n ─── */
export interface GlobalTranslations {
  // Navbar
  navHome: string;
  navDatesTickets: string;
  navExperience: string;
  navCollaboration: string;
  navFaqSupport: string;
  navTicketRebooking: string;
  navMyTickets: string;
  navTickets: string;
  // Erleben dropdown
  navForWho: string;
  navMedia: string;
  navBlog: string;
  // Zusammenarbeit dropdown
  navBookUs: string;
  navRegisterLocation: string;
  navPartner: string;
  navInfluencer: string;
  navJobs: string;
  // Landing page
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  heroTicketBtn: string;
  trustCities: string;
  trustCountries: string;
  trustFollowers: string;
  trustFans: string;
  whatIsTitle1: string;
  whatIsTitle2: string;
  whatIsDesc: string;
  feat3hParty: string;
  featLiveDj: string;
  featGlitter: string;
  featFans: string;
  countriesTitle1: string;
  countriesTitle2: string;
  countriesDesc: string;
  countryNames: Record<string, string>;
  forWhomTitle1: string;
  forWhomTitle2: string;
  forWhomDesc: string;
  audJga: string;
  audJgaDesc: string;
  audBirthday: string;
  audBirthdayDesc: string;
  audGirlsNight: string;
  audGirlsNightDesc: string;
  audGroups: string;
  audGroupsDesc: string;
  audFans: string;
  audFansDesc: string;
  countdownNext: string;
  countdownEvent: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  countdownTicketsFor: string;
  countdownSecure: string;
  upcomingTitle1: string;
  upcomingTitle2: string;
  upcomingAllDates: string;
  expectTitle1: string;
  expectTitle2: string;
  expectDesc: string;
  expectLiveDj: string;
  expectLiveDjDesc: string;
  expectCrew: string;
  expectCrewDesc: string;
  expectGlitter: string;
  expectGlitterDesc: string;
  expectGiveaways: string;
  expectGiveawaysDesc: string;
  expectSingAlong: string;
  expectSingAlongDesc: string;
  expectUnforgettable: string;
  expectUnforgettableDesc: string;
  ticketCatTitle1: string;
  ticketCatTitle2: string;
  ticketCatDesc: string;
  ticketCatPopular: string;
  ticketCatSecure: string;
  ticketRegular: string;
  ticketRegularDesc: string;
  ticketDeluxe: string;
  ticketDeluxeDesc: string;
  ticketFan: string;
  ticketFanDesc: string;
  vibesTitle1: string;
  vibesTitle2: string;
  videoTitle1: string;
  videoTitle2: string;
  videoDesc: string;
  reviewsTitle1: string;
  reviewsTitle2: string;
  newsletterTitle1: string;
  newsletterTitle2: string;
  newsletterDesc: string;
  newsletterPlaceholder: string;
  newsletterSubmit: string;
  newsletterThanks: string;
  whatsappJoinGroup: string;
  // Footer
  footerAbout: string;
  footerAboutDesc: string;
  footerLinks: string;
  footerLegal: string;
  footerSocial: string;
  footerImprint: string;
  footerPrivacy: string;
  footerTerms: string;
  footerContact: string;
  footerAboutUs: string;
  footerFaq: string;
  // Meine Tickets page
  myTicketsTitle: string;
  myTicketsSubtitle: string;
  myTicketsSearch: string;
  myTicketsSearchBtn: string;
  myTicketsNone: string;
  myTicketsNoneHint: string;
  myTicketsEnterEmail: string;
  myTicketsValid: string;
  myTicketsCheckedIn: string;
  myTicketsPaid: string;
  myTicketsOrderedAt: string;
  // Checkout save info
  saveInfoLabel: string;
}

const globalDe: GlobalTranslations = {
  navHome: "Startseite", navDatesTickets: "Events", navExperience: "Erleben", navCollaboration: "Zusammenarbeit", navFaqSupport: "FAQ & Support", navTicketRebooking: "Ticket Umbuchung", navMyTickets: "Meine Tickets", navTickets: "Tickets",
  navForWho: "Für wen?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "Uns Buchen!", navRegisterLocation: "Location anmelden", navPartner: "Partner werden", navInfluencer: "Influencer", navJobs: "Jobs",
  heroTitle: "party", heroSubtitle: "ticket", heroDesc: "Dein Ticketshop für die besten Events & Partys. Über 150 Städte, 13 Länder.", heroTicketBtn: "Tickets sichern",
  trustCities: "STÄDTE", trustCountries: "LÄNDER", trustFollowers: "FOLLOWER", trustFans: "FANS",
  whatIsTitle1: "Was ist", whatIsTitle2: "partyticket?", whatIsDesc: "Die Plattform für unvergessliche Events! Finde Partys, Konzerte und Shows in deiner Nähe – von verschiedenen Veranstaltern, alles an einem Ort.",
  feat3hParty: "Events in 150+ Städten", featLiveDj: "Verschiedene Veranstalter", featGlitter: "Einfach & sicher buchen", featFans: "250.000+ zufriedene Gäste",
  countriesTitle1: "Wir sind in", countriesTitle2: "13 Ländern", countriesDesc: "Events und Partys in ganz Europa – und darüber hinaus.",
  countryNames: { DE: "Deutschland", AT: "Österreich", CH: "Schweiz", NL: "Niederlande", FR: "Frankreich", LU: "Luxemburg", BE: "Belgien", PL: "Polen", CZ: "Tschechien", IT: "Italien", ES: "Spanien", HR: "Kroatien", BR: "Brasilien" },
  forWhomTitle1: "Für wen ist", forWhomTitle2: "partyticket?", forWhomDesc: "Egal ob JGA, Geburtstag oder einfach eine geile Nacht – bei uns findest du das passende Event!",
  audJga: "JGA / Bachelorette", audJgaDesc: "Die perfekte Feier mit den Mädels vor dem großen Tag.", audBirthday: "Geburtstage", audBirthdayDesc: "Feier deinen Geburtstag auf eine einzigartige und unvergessliche Art.", audGirlsNight: "Girls Night Out", audGirlsNightDesc: "Versammelt die Truppe und feiert die Nacht eures Lebens.", audGroups: "Gruppen", audGroupsDesc: "Spezielle Angebote für Gruppen ab 10 Personen.", audFans: "Party-Fans", audFansDesc: "Für alle, die gute Musik und Stimmung lieben!",
  countdownNext: "NÄCHSTES", countdownEvent: "EVENT", countdownDays: "Tage", countdownHours: "Stunden", countdownMinutes: "Minuten", countdownSeconds: "Sekunden", countdownTicketsFor: "Tickets für", countdownSecure: "sichern",
  upcomingTitle1: "KOMMENDE", upcomingTitle2: "TERMINE", upcomingAllDates: "Alle Termine anzeigen",
  expectTitle1: "WAS DICH", expectTitle2: "ERWARTET", expectDesc: "Jedes Event ist ein einzigartiges Erlebnis voller Musik, Emotionen und Party.",
  expectLiveDj: "Live DJ", expectLiveDjDesc: "Die besten Hits – non-stop zum Tanzen.", expectCrew: "Crew & Performer", expectCrewDesc: "Professionelle Entertainer auf der Bühne.", expectGlitter: "Einzigartiges Erlebnis", expectGlitterDesc: "Jedes Event hat sein eigenes Konzept.", expectGiveaways: "Give-Aways", expectGiveawaysDesc: "Überraschungen und Geschenke bei vielen Events.", expectSingAlong: "Unvergesslich", expectSingAlongDesc: "Momente, die du nie vergessen wirst.", expectUnforgettable: "Für jeden etwas", expectUnforgettableDesc: "Von Motto-Partys bis Open Airs – finde dein Event.",
  ticketCatTitle1: "TICKET", ticketCatTitle2: "KATEGORIEN", ticketCatDesc: "Wähle dein Erlebnis – von Regular bis VIP.", ticketCatPopular: "BELIEBT", ticketCatSecure: "Jetzt sichern",
  ticketRegular: "Regular-Ticket", ticketRegularDesc: "Eintritt", ticketDeluxe: "Deluxe-Ticket", ticketDeluxeDesc: "Eintritt + bevorzugter Einlass", ticketFan: "VIP-Ticket", ticketFanDesc: "VIP-Eingang + Extras",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Erlebe die Stimmung unserer Events in diesen Highlights.",
  reviewsTitle1: "DAS SAGEN UNSERE", reviewsTitle2: "GÄSTE",
  newsletterTitle1: "BLEIB", newsletterTitle2: "UPGEDATED", newsletterDesc: "Neue Termine, exklusive Angebote und Behind-the-Scenes direkt in dein Postfach.", newsletterPlaceholder: "Deine E-Mail Adresse", newsletterSubmit: "Anmelden", newsletterThanks: "🎉 Danke! Du bist dabei.", whatsappJoinGroup: "WhatsApp Gruppe beitreten",
  footerAbout: "Über uns", footerAboutDesc: "Dein Ticketshop für die besten Events. Über 150 Städte, 13 Länder.", footerLinks: "Links", footerLegal: "Rechtliches", footerSocial: "Social Media",
  footerImprint: "Impressum", footerPrivacy: "Datenschutz", footerTerms: "AGB", footerContact: "Kontakt", footerAboutUs: "Über uns", footerFaq: "FAQ",
  myTicketsTitle: "Meine Tickets", myTicketsSubtitle: "Finde deine gekauften Tickets", myTicketsSearch: "Deine E-Mail-Adresse eingeben...", myTicketsSearchBtn: "Suchen", myTicketsNone: "Keine Tickets für diese E-Mail gefunden.", myTicketsNoneHint: "Stelle sicher, dass du die gleiche E-Mail wie bei der Bestellung verwendest.", myTicketsEnterEmail: "Gib deine E-Mail-Adresse ein, um deine Tickets zu finden.", myTicketsValid: "Gültig", myTicketsCheckedIn: "Eingecheckt", myTicketsPaid: "Bezahlt", myTicketsOrderedAt: "Bestellt am",
  saveInfoLabel: "Kontoinfos speichern",
};

const globalEn: GlobalTranslations = {
  navHome: "Home", navDatesTickets: "Dates & Tickets", navExperience: "Experience", navCollaboration: "Collaborate", navFaqSupport: "FAQ & Support", navTicketRebooking: "Ticket Rebooking", navMyTickets: "My Tickets", navTickets: "Tickets",
  navForWho: "For whom?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "Book Us!", navRegisterLocation: "Register Location", navPartner: "Become a Partner", navInfluencer: "Influencer", navJobs: "Jobs",
  heroTitle: "party", heroSubtitle: "ticket", heroDesc: "Your ticket shop for the best events & parties. Over 150 cities, 13 countries.", heroTicketBtn: "Get Tickets",
  trustCities: "CITIES", trustCountries: "COUNTRIES", trustFollowers: "FOLLOWERS", trustFans: "FANS",
  whatIsTitle1: "What is", whatIsTitle2: "partyticket?", whatIsDesc: "The platform for unforgettable events! Find parties, concerts and shows near you – from various organizers, all in one place.",
  feat3hParty: "Events in 150+ cities", featLiveDj: "Various organizers", featGlitter: "Easy & secure booking", featFans: "250,000+ happy guests",
  countriesTitle1: "We are in", countriesTitle2: "13 countries", countriesDesc: "Events and parties across Europe – and beyond.",
  countryNames: { DE: "Germany", AT: "Austria", CH: "Switzerland", NL: "Netherlands", FR: "France", LU: "Luxembourg", BE: "Belgium", PL: "Poland", CZ: "Czech Republic", IT: "Italy", ES: "Spain", HR: "Croatia", BR: "Brazil" },
  forWhomTitle1: "Who is", forWhomTitle2: "partyticket for?", forWhomDesc: "Whether it's a hen party, birthday or just an amazing night out – find the perfect event!",
  audJga: "Hen Party", audJgaDesc: "The perfect celebration before the big day.", audBirthday: "Birthdays", audBirthdayDesc: "Celebrate your birthday in a unique and unforgettable way.", audGirlsNight: "Girls Night Out", audGirlsNightDesc: "Gather the crew and party the night away.", audGroups: "Groups", audGroupsDesc: "Special offers for groups of 10+.", audFans: "Party Lovers", audFansDesc: "For everyone who loves great music and vibes!",
  countdownNext: "NEXT", countdownEvent: "EVENT", countdownDays: "Days", countdownHours: "Hours", countdownMinutes: "Minutes", countdownSeconds: "Seconds", countdownTicketsFor: "Tickets for", countdownSecure: "get now",
  upcomingTitle1: "UPCOMING", upcomingTitle2: "DATES", upcomingAllDates: "View all dates",
  expectTitle1: "WHAT TO", expectTitle2: "EXPECT", expectDesc: "Every event is a unique experience full of music, emotions and party.",
  expectLiveDj: "Live DJ", expectLiveDjDesc: "The best hits – non-stop dancing.", expectCrew: "Crew & Performers", expectCrewDesc: "Professional entertainers on stage.", expectGlitter: "Unique Experience", expectGlitterDesc: "Every event has its own concept.", expectGiveaways: "Give-Aways", expectGiveawaysDesc: "Surprises and gifts at many events.", expectSingAlong: "Unforgettable", expectSingAlongDesc: "Moments you'll never forget.", expectUnforgettable: "Something for everyone", expectUnforgettableDesc: "From themed parties to open airs – find your event.",
  ticketCatTitle1: "TICKET", ticketCatTitle2: "CATEGORIES", ticketCatDesc: "Choose your experience – from Regular to VIP.", ticketCatPopular: "POPULAR", ticketCatSecure: "Get now",
  ticketRegular: "Regular Ticket", ticketRegularDesc: "Entry ticket", ticketDeluxe: "Deluxe Ticket", ticketDeluxeDesc: "Entry + priority admission", ticketFan: "VIP Ticket", ticketFanDesc: "VIP entrance + extras",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Experience the atmosphere of our events in these highlights.",
  reviewsTitle1: "WHAT OUR", reviewsTitle2: "GUESTS SAY",
  newsletterTitle1: "STAY", newsletterTitle2: "UPDATED", newsletterDesc: "New dates, exclusive offers and behind-the-scenes straight to your inbox.", newsletterPlaceholder: "Your email address", newsletterSubmit: "Subscribe", newsletterThanks: "🎉 Thanks! You're in.", whatsappJoinGroup: "Join WhatsApp Group",
  footerAbout: "About us", footerAboutDesc: "Your ticket shop for the best events. Over 150 cities, 13 countries.", footerLinks: "Links", footerLegal: "Legal", footerSocial: "Social Media",
  footerImprint: "Imprint", footerPrivacy: "Privacy", footerTerms: "Terms", footerContact: "Contact", footerAboutUs: "About us", footerFaq: "FAQ",
  myTicketsTitle: "My Tickets", myTicketsSubtitle: "Find your purchased tickets", myTicketsSearch: "Enter your email address...", myTicketsSearchBtn: "Search", myTicketsNone: "No tickets found for this email.", myTicketsNoneHint: "Make sure you use the same email as when you ordered.", myTicketsEnterEmail: "Enter your email to find your tickets.", myTicketsValid: "Valid", myTicketsCheckedIn: "Checked in", myTicketsPaid: "Paid", myTicketsOrderedAt: "Ordered on",
  saveInfoLabel: "Save account info",
};

const globalNl: GlobalTranslations = {
  navHome: "Home", navDatesTickets: "Data & Tickets", navExperience: "Beleef", navCollaboration: "Samenwerken", navFaqSupport: "FAQ & Support", navTicketRebooking: "Ticket Omboeken", navMyTickets: "Mijn Tickets", navTickets: "Tickets",
  navForWho: "Voor wie?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "Boek ons!", navRegisterLocation: "Locatie aanmelden", navPartner: "Word Partner", navInfluencer: "Influencer", navJobs: "Jobs",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "De grootste ABBA sing-along partytour van Europa. Meer dan 250.000 fans wereldwijd.", heroTicketBtn: "Tickets kopen",
  trustCities: "STEDEN", trustCountries: "LANDEN", trustFollowers: "VOLGERS", trustFans: "FANS",
  whatIsTitle1: "Wat is de", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "Het grootste ABBA-feest ter wereld! Een unieke sing-along ervaring met de nummers die generaties hebben gevormd.",
  feat3hParty: "3+ uur feest", featLiveDj: "Live DJ & artiesten", featGlitter: "Glitter & accessoires inbegrepen", featFans: "250.000+ fans wereldwijd",
  countriesTitle1: "We zijn in", countriesTitle2: "13 landen", countriesDesc: "De grootste ABBA sing-along partytour van Europa – en daarbuiten.",
  countryNames: { DE: "Duitsland", AT: "Oostenrijk", CH: "Zwitserland", NL: "Nederland", FR: "Frankrijk", LU: "Luxemburg", BE: "België", PL: "Polen", CZ: "Tsjechië", IT: "Italië", ES: "Spanje", HR: "Kroatië", BR: "Brazilië" },
  forWhomTitle1: "Voor wie is", forWhomTitle2: "het feest?", forWhomDesc: "Het GIMME GIMME feest is voor iedereen die van ABBA houdt!",
  audJga: "Vrijgezellenfeest", audJgaDesc: "Het perfecte feest met de meiden.", audBirthday: "Verjaardagen", audBirthdayDesc: "Vier je verjaardag op een unieke manier.", audGirlsNight: "Girls Night Out", audGirlsNightDesc: "Verzamel de crew en zing de nummers die je liefhebt.", audGroups: "Groepen", audGroupsDesc: "Speciale aanbiedingen voor groepen van 10+.", audFans: "Fans van alle generaties", audFansDesc: "ABBA is tijdloos – fans van alle leeftijden welkom!",
  countdownNext: "VOLGEND", countdownEvent: "EVENEMENT", countdownDays: "Dagen", countdownHours: "Uren", countdownMinutes: "Minuten", countdownSeconds: "Seconden", countdownTicketsFor: "Tickets voor", countdownSecure: "kopen",
  upcomingTitle1: "AANKOMENDE", upcomingTitle2: "DATA", upcomingAllDates: "Alle data bekijken",
  expectTitle1: "WAT JE KUNT", expectTitle2: "VERWACHTEN", expectDesc: "Elke tourstop is een unieke ervaring vol muziek, emoties en feest.",
  expectLiveDj: "Live DJ", expectLiveDjDesc: "De beste ABBA hits – non-stop.", expectCrew: "Crew & Artiesten", expectCrewDesc: "Professionele dansers op het podium.", expectGlitter: "Glitter & Accessories", expectGlitterDesc: "LED-haarbanden, glitterstations en meer.", expectGiveaways: "Give-Aways", expectGiveawaysDesc: "Verrassingen bij elke tourstop.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Alle ABBA klassiekers om mee te zingen.", expectUnforgettable: "Onvergetelijk", expectUnforgettableDesc: "3+ uur feest en onvergetelijke momenten.",
  ticketCatTitle1: "TICKET", ticketCatTitle2: "CATEGORIEËN", ticketCatDesc: "Kies je ervaring.", ticketCatPopular: "POPULAIR", ticketCatSecure: "Nu kopen",
  ticketRegular: "Regular Ticket", ticketRegularDesc: "Toegangskaart", ticketDeluxe: "Deluxe Ticket", ticketDeluxeDesc: "Toegang + voorrang", ticketFan: "Fan Ticket", ticketFanDesc: "VIP-ingang + LED-haarband + polsband",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Beleef de sfeer van onze shows.",
  reviewsTitle1: "WAT ONZE", reviewsTitle2: "GASTEN ZEGGEN",
  newsletterTitle1: "BLIJF", newsletterTitle2: "OP DE HOOGTE", newsletterDesc: "Nieuwe data, exclusieve aanbiedingen en behind-the-scenes.", newsletterPlaceholder: "Je e-mailadres", newsletterSubmit: "Aanmelden", newsletterThanks: "🎉 Bedankt! Je bent erbij.", whatsappJoinGroup: "WhatsApp groep",
  footerAbout: "Over ons", footerAboutDesc: "De grootste ABBA sing-along partytour.", footerLinks: "Links", footerLegal: "Juridisch", footerSocial: "Social Media",
  footerImprint: "Colofon", footerPrivacy: "Privacy", footerTerms: "Voorwaarden", footerContact: "Contact", footerAboutUs: "Over ons", footerFaq: "FAQ",
  myTicketsTitle: "Mijn Tickets", myTicketsSubtitle: "Vind je gekochte tickets", myTicketsSearch: "Voer je e-mailadres in...", myTicketsSearchBtn: "Zoeken", myTicketsNone: "Geen tickets gevonden.", myTicketsNoneHint: "Gebruik hetzelfde e-mailadres als bij je bestelling.", myTicketsEnterEmail: "Voer je e-mail in om je tickets te vinden.", myTicketsValid: "Geldig", myTicketsCheckedIn: "Ingecheckt", myTicketsPaid: "Betaald", myTicketsOrderedAt: "Besteld op",
  saveInfoLabel: "Accountgegevens opslaan",
};

const globalFr: GlobalTranslations = {
  navHome: "Accueil", navDatesTickets: "Dates & Billets", navExperience: "Découvrir", navCollaboration: "Collaboration", navFaqSupport: "FAQ & Support", navTicketRebooking: "Échange de billets", navMyTickets: "Mes Billets", navTickets: "Billets",
  navForWho: "Pour qui?", navMedia: "Médias", navBlog: "Blog",
  navBookUs: "Réservez-nous!", navRegisterLocation: "Inscrire un lieu", navPartner: "Devenir Partenaire", navInfluencer: "Influenceur", navJobs: "Emplois",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "La plus grande tournée ABBA sing-along d'Europe. Plus de 250 000 fans dans le monde.", heroTicketBtn: "Acheter des billets",
  trustCities: "VILLES", trustCountries: "PAYS", trustFollowers: "ABONNÉS", trustFans: "FANS",
  whatIsTitle1: "Qu'est-ce que la", whatIsTitle2: "GIMME GIMME PARTY ?", whatIsDesc: "La plus grande fête ABBA au monde ! Une expérience sing-along unique avec les chansons qui ont marqué des générations.",
  feat3hParty: "3+ heures de fête", featLiveDj: "DJ live & artistes", featGlitter: "Paillettes & accessoires inclus", featFans: "250 000+ fans dans le monde",
  countriesTitle1: "Nous sommes dans", countriesTitle2: "13 pays", countriesDesc: "La plus grande tournée sing-along ABBA d'Europe – et au-delà.",
  countryNames: { DE: "Allemagne", AT: "Autriche", CH: "Suisse", NL: "Pays-Bas", FR: "France", LU: "Luxembourg", BE: "Belgique", PL: "Pologne", CZ: "Tchéquie", IT: "Italie", ES: "Espagne", HR: "Croatie", BR: "Brésil" },
  forWhomTitle1: "Pour qui est", forWhomTitle2: "la fête ?", forWhomDesc: "La GIMME GIMME PARTY est pour tous ceux qui aiment ABBA !",
  audJga: "EVJF", audJgaDesc: "La fête parfaite avant le grand jour.", audBirthday: "Anniversaires", audBirthdayDesc: "Fêtez votre anniversaire de manière unique.", audGirlsNight: "Soirée entre filles", audGirlsNightDesc: "Rassemblez le groupe et chantez vos chansons préférées.", audGroups: "Groupes", audGroupsDesc: "Offres spéciales pour les groupes de 10+.", audFans: "Fans de toutes générations", audFansDesc: "ABBA est intemporel – fans de tous âges bienvenus !",
  countdownNext: "PROCHAIN", countdownEvent: "ÉVÉNEMENT", countdownDays: "Jours", countdownHours: "Heures", countdownMinutes: "Minutes", countdownSeconds: "Secondes", countdownTicketsFor: "Billets pour", countdownSecure: "acheter",
  upcomingTitle1: "PROCHAINES", upcomingTitle2: "DATES", upcomingAllDates: "Voir toutes les dates",
  expectTitle1: "CE QUI VOUS", expectTitle2: "ATTEND", expectDesc: "Chaque étape est une expérience unique pleine de musique et de fête.",
  expectLiveDj: "DJ Live", expectLiveDjDesc: "Les meilleurs hits ABBA – non-stop.", expectCrew: "Crew & Artistes", expectCrewDesc: "Danseurs professionnels sur scène.", expectGlitter: "Paillettes & Accessoires", expectGlitterDesc: "Bandeaux LED, stations paillettes et plus.", expectGiveaways: "Cadeaux", expectGiveawaysDesc: "Surprises à chaque étape.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Tous les classiques ABBA à chanter.", expectUnforgettable: "Inoubliable", expectUnforgettableDesc: "3+ heures de fête et moments inoubliables.",
  ticketCatTitle1: "CATÉGORIES", ticketCatTitle2: "DE BILLETS", ticketCatDesc: "Choisissez votre expérience.", ticketCatPopular: "POPULAIRE", ticketCatSecure: "Acheter",
  ticketRegular: "Billet Regular", ticketRegularDesc: "Billet d'entrée", ticketDeluxe: "Billet Deluxe", ticketDeluxeDesc: "Entrée + accès prioritaire", ticketFan: "Billet Fan", ticketFanDesc: "Entrée VIP + bandeau LED + bracelet exclusif",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Vivez l'ambiance de nos shows.",
  reviewsTitle1: "CE QUE DISENT NOS", reviewsTitle2: "INVITÉS",
  newsletterTitle1: "RESTEZ", newsletterTitle2: "INFORMÉ", newsletterDesc: "Nouvelles dates, offres exclusives et coulisses.", newsletterPlaceholder: "Votre adresse e-mail", newsletterSubmit: "S'inscrire", newsletterThanks: "🎉 Merci ! Vous êtes inscrit.", whatsappJoinGroup: "Rejoindre le groupe WhatsApp",
  footerAbout: "À propos", footerAboutDesc: "La plus grande tournée ABBA sing-along.", footerLinks: "Liens", footerLegal: "Mentions légales", footerSocial: "Réseaux sociaux",
  footerImprint: "Mentions légales", footerPrivacy: "Confidentialité", footerTerms: "CGV", footerContact: "Contact", footerAboutUs: "À propos", footerFaq: "FAQ",
  myTicketsTitle: "Mes Billets", myTicketsSubtitle: "Trouvez vos billets achetés", myTicketsSearch: "Entrez votre adresse e-mail...", myTicketsSearchBtn: "Chercher", myTicketsNone: "Aucun billet trouvé.", myTicketsNoneHint: "Utilisez la même adresse e-mail que lors de votre commande.", myTicketsEnterEmail: "Entrez votre e-mail pour trouver vos billets.", myTicketsValid: "Valide", myTicketsCheckedIn: "Enregistré", myTicketsPaid: "Payé", myTicketsOrderedAt: "Commandé le",
  saveInfoLabel: "Enregistrer les infos",
};

const globalPl: GlobalTranslations = {
  navHome: "Strona główna", navDatesTickets: "Terminy & Bilety", navExperience: "Przeżyj", navCollaboration: "Współpraca", navFaqSupport: "FAQ & Wsparcie", navTicketRebooking: "Zmiana biletu", navMyTickets: "Moje Bilety", navTickets: "Bilety",
  navForWho: "Dla kogo?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "Zarezerwuj nas!", navRegisterLocation: "Zarejestruj lokal", navPartner: "Zostań Partnerem", navInfluencer: "Influencer", navJobs: "Praca",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "Największa trasa koncertowa ABBA sing-along w Europie. Ponad 250 000 fanów na całym świecie.", heroTicketBtn: "Kup bilety",
  trustCities: "MIAST", trustCountries: "KRAJÓW", trustFollowers: "OBSERWUJĄCYCH", trustFans: "FANÓW",
  whatIsTitle1: "Czym jest", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "Największa impreza ABBA na świecie! Unikalne przeżycie sing-along z piosenkami, które ukształtowały pokolenia.",
  feat3hParty: "3+ godziny zabawy", featLiveDj: "Live DJ & artyści", featGlitter: "Brokat i akcesoria w cenie", featFans: "250 000+ fanów",
  countriesTitle1: "Jesteśmy w", countriesTitle2: "13 krajach", countriesDesc: "Największa trasa ABBA sing-along w Europie.",
  countryNames: { DE: "Niemcy", AT: "Austria", CH: "Szwajcaria", NL: "Holandia", FR: "Francja", LU: "Luksemburg", BE: "Belgia", PL: "Polska", CZ: "Czechy", IT: "Włochy", ES: "Hiszpania", HR: "Chorwacja", BR: "Brazylia" },
  forWhomTitle1: "Dla kogo jest", forWhomTitle2: "impreza?", forWhomDesc: "GIMME GIMME PARTY jest dla wszystkich, którzy kochają ABBA!",
  audJga: "Wieczór panieński", audJgaDesc: "Idealna impreza przed wielkim dniem.", audBirthday: "Urodziny", audBirthdayDesc: "Świętuj urodziny w wyjątkowy sposób.", audGirlsNight: "Dziewczyny na mieście", audGirlsNightDesc: "Zbierz ekipę i śpiewaj ulubione piosenki.", audGroups: "Grupy", audGroupsDesc: "Oferty specjalne dla grup 10+.", audFans: "Fani wszystkich pokoleń", audFansDesc: "ABBA jest ponadczasowa – fani w każdym wieku!",
  countdownNext: "NASTĘPNE", countdownEvent: "WYDARZENIE", countdownDays: "Dni", countdownHours: "Godziny", countdownMinutes: "Minuty", countdownSeconds: "Sekundy", countdownTicketsFor: "Bilety na", countdownSecure: "kup",
  upcomingTitle1: "NADCHODZĄCE", upcomingTitle2: "TERMINY", upcomingAllDates: "Zobacz wszystkie terminy",
  expectTitle1: "CO CIĘ", expectTitle2: "CZEKA", expectDesc: "Każdy przystanek to unikalne przeżycie pełne muzyki i zabawy.",
  expectLiveDj: "Live DJ", expectLiveDjDesc: "Najlepsze hity ABBA – non-stop.", expectCrew: "Crew & Artyści", expectCrewDesc: "Profesjonalni tancerze na scenie.", expectGlitter: "Brokat & Akcesoria", expectGlitterDesc: "Opaski LED, stacje z brokatem i więcej.", expectGiveaways: "Upominki", expectGiveawaysDesc: "Niespodzianki na każdym przystanku.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Wszystkie klasyki ABBA do wspólnego śpiewania.", expectUnforgettable: "Niezapomniane", expectUnforgettableDesc: "3+ godziny zabawy i niezapomnianych chwil.",
  ticketCatTitle1: "KATEGORIE", ticketCatTitle2: "BILETÓW", ticketCatDesc: "Wybierz swoje przeżycie.", ticketCatPopular: "POPULARNE", ticketCatSecure: "Kup teraz",
  ticketRegular: "Bilet Regular", ticketRegularDesc: "Bilet wstępu", ticketDeluxe: "Bilet Deluxe", ticketDeluxeDesc: "Wstęp + priorytetowe wejście", ticketFan: "Bilet Fan", ticketFanDesc: "Wejście VIP + opaska LED + bransoletka",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Poczuj atmosferę naszych pokazów.",
  reviewsTitle1: "CO MÓWIĄ NASI", reviewsTitle2: "GOŚCIE",
  newsletterTitle1: "BĄDŹ NA", newsletterTitle2: "BIEŻĄCO", newsletterDesc: "Nowe terminy, ekskluzywne oferty i kulisy.", newsletterPlaceholder: "Twój adres e-mail", newsletterSubmit: "Zapisz się", newsletterThanks: "🎉 Dzięki! Jesteś na liście.", whatsappJoinGroup: "Dołącz do grupy WhatsApp",
  footerAbout: "O nas", footerAboutDesc: "Największa trasa ABBA sing-along.", footerLinks: "Linki", footerLegal: "Prawne", footerSocial: "Social Media",
  footerImprint: "Impressum", footerPrivacy: "Prywatność", footerTerms: "Regulamin", footerContact: "Kontakt", footerAboutUs: "O nas", footerFaq: "FAQ",
  myTicketsTitle: "Moje Bilety", myTicketsSubtitle: "Znajdź swoje bilety", myTicketsSearch: "Wpisz swój adres e-mail...", myTicketsSearchBtn: "Szukaj", myTicketsNone: "Nie znaleziono biletów.", myTicketsNoneHint: "Upewnij się, że używasz tego samego e-maila.", myTicketsEnterEmail: "Wpisz e-mail, aby znaleźć bilety.", myTicketsValid: "Ważny", myTicketsCheckedIn: "Zarejestrowany", myTicketsPaid: "Opłacony", myTicketsOrderedAt: "Zamówiony",
  saveInfoLabel: "Zapisz dane konta",
};

const globalEs: GlobalTranslations = {
  navHome: "Inicio", navDatesTickets: "Fechas y Entradas", navExperience: "Experiencia", navCollaboration: "Colaboración", navFaqSupport: "FAQ y Soporte", navTicketRebooking: "Cambio de entrada", navMyTickets: "Mis Entradas", navTickets: "Entradas",
  navForWho: "¿Para quién?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "¡Resérvanos!", navRegisterLocation: "Registrar local", navPartner: "Ser Socio", navInfluencer: "Influencer", navJobs: "Empleo",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "La mayor gira de fiestas ABBA sing-along de Europa. Más de 250.000 fans en todo el mundo.", heroTicketBtn: "Comprar entradas",
  trustCities: "CIUDADES", trustCountries: "PAÍSES", trustFollowers: "SEGUIDORES", trustFans: "FANS",
  whatIsTitle1: "¿Qué es la", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "¡La fiesta de ABBA más grande del mundo! Una experiencia sing-along única con las canciones que marcaron generaciones.",
  feat3hParty: "3+ horas de fiesta", featLiveDj: "DJ en vivo y artistas", featGlitter: "Purpurina y accesorios incluidos", featFans: "250.000+ fans en todo el mundo",
  countriesTitle1: "Estamos en", countriesTitle2: "13 países", countriesDesc: "La mayor gira ABBA sing-along de Europa – y más allá.",
  countryNames: { DE: "Alemania", AT: "Austria", CH: "Suiza", NL: "Países Bajos", FR: "Francia", LU: "Luxemburgo", BE: "Bélgica", PL: "Polonia", CZ: "Chequia", IT: "Italia", ES: "España", HR: "Croacia", BR: "Brasil" },
  forWhomTitle1: "¿Para quién es", forWhomTitle2: "la fiesta?", forWhomDesc: "¡La GIMME GIMME PARTY es para todos los que aman a ABBA!",
  audJga: "Despedida de soltera", audJgaDesc: "La fiesta perfecta antes del gran día.", audBirthday: "Cumpleaños", audBirthdayDesc: "Celebra tu cumpleaños de forma única e inolvidable.", audGirlsNight: "Noche de chicas", audGirlsNightDesc: "Reúne a la pandilla y canta las canciones que os encantan.", audGroups: "Grupos", audGroupsDesc: "Ofertas especiales para grupos de 10+.", audFans: "Fans de todas las generaciones", audFansDesc: "ABBA es atemporal – ¡fans de todas las edades son bienvenidos!",
  countdownNext: "PRÓXIMO", countdownEvent: "EVENTO", countdownDays: "Días", countdownHours: "Horas", countdownMinutes: "Minutos", countdownSeconds: "Segundos", countdownTicketsFor: "Entradas para", countdownSecure: "comprar",
  upcomingTitle1: "PRÓXIMAS", upcomingTitle2: "FECHAS", upcomingAllDates: "Ver todas las fechas",
  expectTitle1: "QUÉ TE", expectTitle2: "ESPERA", expectDesc: "Cada parada del tour es una experiencia única llena de música, emociones y fiesta.",
  expectLiveDj: "DJ en vivo", expectLiveDjDesc: "Los mejores hits de ABBA – sin parar.", expectCrew: "Crew y artistas", expectCrewDesc: "Bailarines profesionales en el escenario.", expectGlitter: "Purpurina y accesorios", expectGlitterDesc: "Diademas LED, estaciones de purpurina y más.", expectGiveaways: "Regalos", expectGiveawaysDesc: "Sorpresas en cada parada del tour.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Todos los clásicos de ABBA para cantar juntos.", expectUnforgettable: "Inolvidable", expectUnforgettableDesc: "3+ horas de fiesta, emociones y momentos inolvidables.",
  ticketCatTitle1: "CATEGORÍAS", ticketCatTitle2: "DE ENTRADAS", ticketCatDesc: "Elige tu experiencia.", ticketCatPopular: "POPULAR", ticketCatSecure: "Comprar ahora",
  ticketRegular: "Entrada Regular", ticketRegularDesc: "Entrada de acceso", ticketDeluxe: "Entrada Deluxe", ticketDeluxeDesc: "Entrada + acceso prioritario", ticketFan: "Entrada Fan", ticketFanDesc: "Entrada VIP + diadema LED + pulsera exclusiva",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Vive el ambiente de nuestros shows.",
  reviewsTitle1: "LO QUE DICEN NUESTROS", reviewsTitle2: "INVITADOS",
  newsletterTitle1: "MANTENTE", newsletterTitle2: "AL DÍA", newsletterDesc: "Nuevas fechas, ofertas exclusivas y detrás de cámaras.", newsletterPlaceholder: "Tu correo electrónico", newsletterSubmit: "Suscribirse", newsletterThanks: "🎉 ¡Gracias! Ya estás dentro.", whatsappJoinGroup: "Únete al grupo WhatsApp",
  footerAbout: "Sobre nosotros", footerAboutDesc: "La mayor gira ABBA sing-along. Más de 150 ciudades, 13 países, una misión: hacer bailar al mundo.", footerLinks: "Enlaces", footerLegal: "Legal", footerSocial: "Redes Sociales",
  footerImprint: "Aviso legal", footerPrivacy: "Privacidad", footerTerms: "Condiciones", footerContact: "Contacto", footerAboutUs: "Sobre nosotros", footerFaq: "FAQ",
  myTicketsTitle: "Mis Entradas", myTicketsSubtitle: "Encuentra tus entradas compradas", myTicketsSearch: "Introduce tu correo electrónico...", myTicketsSearchBtn: "Buscar", myTicketsNone: "No se encontraron entradas para este correo.", myTicketsNoneHint: "Asegúrate de usar el mismo correo que al comprar.", myTicketsEnterEmail: "Introduce tu correo para encontrar tus entradas.", myTicketsValid: "Válida", myTicketsCheckedIn: "Registrada", myTicketsPaid: "Pagada", myTicketsOrderedAt: "Pedida el",
  saveInfoLabel: "Guardar datos de cuenta",
};

const globalIt: GlobalTranslations = {
  navHome: "Home", navDatesTickets: "Date e Biglietti", navExperience: "Esperienza", navCollaboration: "Collaborazione", navFaqSupport: "FAQ e Supporto", navTicketRebooking: "Cambio biglietto", navMyTickets: "I miei Biglietti", navTickets: "Biglietti",
  navForWho: "Per chi?", navMedia: "Media", navBlog: "Blog",
  navBookUs: "Prenotaci!", navRegisterLocation: "Registra locale", navPartner: "Diventa Partner", navInfluencer: "Influencer", navJobs: "Lavoro",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "Il più grande tour di feste ABBA sing-along d'Europa. Oltre 250.000 fan nel mondo.", heroTicketBtn: "Acquista biglietti",
  trustCities: "CITTÀ", trustCountries: "PAESI", trustFollowers: "FOLLOWER", trustFans: "FAN",
  whatIsTitle1: "Cos'è la", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "La più grande festa ABBA al mondo! Un'esperienza sing-along unica con le canzoni che hanno segnato generazioni.",
  feat3hParty: "3+ ore di festa", featLiveDj: "DJ dal vivo e artisti", featGlitter: "Glitter e accessori inclusi", featFans: "250.000+ fan nel mondo",
  countriesTitle1: "Siamo in", countriesTitle2: "13 paesi", countriesDesc: "Il più grande tour ABBA sing-along d'Europa – e oltre.",
  countryNames: { DE: "Germania", AT: "Austria", CH: "Svizzera", NL: "Paesi Bassi", FR: "Francia", LU: "Lussemburgo", BE: "Belgio", PL: "Polonia", CZ: "Cechia", IT: "Italia", ES: "Spagna", HR: "Croazia", BR: "Brasile" },
  forWhomTitle1: "Per chi è", forWhomTitle2: "la festa?", forWhomDesc: "La GIMME GIMME PARTY è per tutti quelli che amano gli ABBA!",
  audJga: "Addio al nubilato", audJgaDesc: "La festa perfetta prima del grande giorno.", audBirthday: "Compleanni", audBirthdayDesc: "Festeggia il tuo compleanno in modo unico.", audGirlsNight: "Serata tra ragazze", audGirlsNightDesc: "Riunisci il gruppo e cantate le canzoni che amate.", audGroups: "Gruppi", audGroupsDesc: "Offerte speciali per gruppi da 10+.", audFans: "Fan di tutte le generazioni", audFansDesc: "Gli ABBA sono eterni – fan di tutte le età benvenuti!",
  countdownNext: "PROSSIMO", countdownEvent: "EVENTO", countdownDays: "Giorni", countdownHours: "Ore", countdownMinutes: "Minuti", countdownSeconds: "Secondi", countdownTicketsFor: "Biglietti per", countdownSecure: "acquista",
  upcomingTitle1: "PROSSIME", upcomingTitle2: "DATE", upcomingAllDates: "Vedi tutte le date",
  expectTitle1: "COSA TI", expectTitle2: "ASPETTA", expectDesc: "Ogni tappa del tour è un'esperienza unica piena di musica e festa.",
  expectLiveDj: "DJ dal vivo", expectLiveDjDesc: "I migliori successi ABBA – non-stop.", expectCrew: "Crew e artisti", expectCrewDesc: "Ballerini professionisti sul palco.", expectGlitter: "Glitter e accessori", expectGlitterDesc: "Cerchietti LED, stazioni glitter e altro.", expectGiveaways: "Omaggi", expectGiveawaysDesc: "Sorprese ad ogni tappa.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Tutti i classici ABBA da cantare insieme.", expectUnforgettable: "Indimenticabile", expectUnforgettableDesc: "3+ ore di festa e momenti indimenticabili.",
  ticketCatTitle1: "CATEGORIE", ticketCatTitle2: "BIGLIETTI", ticketCatDesc: "Scegli la tua esperienza.", ticketCatPopular: "POPOLARE", ticketCatSecure: "Acquista ora",
  ticketRegular: "Biglietto Regular", ticketRegularDesc: "Biglietto d'ingresso", ticketDeluxe: "Biglietto Deluxe", ticketDeluxeDesc: "Ingresso + accesso prioritario", ticketFan: "Biglietto Fan", ticketFanDesc: "Ingresso VIP + cerchietto LED + braccialetto esclusivo",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Vivi l'atmosfera dei nostri show.",
  reviewsTitle1: "COSA DICONO I NOSTRI", reviewsTitle2: "OSPITI",
  newsletterTitle1: "RESTA", newsletterTitle2: "AGGIORNATO", newsletterDesc: "Nuove date, offerte esclusive e dietro le quinte.", newsletterPlaceholder: "La tua email", newsletterSubmit: "Iscriviti", newsletterThanks: "🎉 Grazie! Sei dentro.", whatsappJoinGroup: "Unisciti al gruppo WhatsApp",
  footerAbout: "Chi siamo", footerAboutDesc: "Il più grande tour ABBA sing-along.", footerLinks: "Link", footerLegal: "Legale", footerSocial: "Social Media",
  footerImprint: "Note legali", footerPrivacy: "Privacy", footerTerms: "Condizioni", footerContact: "Contatti", footerAboutUs: "Chi siamo", footerFaq: "FAQ",
  myTicketsTitle: "I miei Biglietti", myTicketsSubtitle: "Trova i tuoi biglietti acquistati", myTicketsSearch: "Inserisci la tua email...", myTicketsSearchBtn: "Cerca", myTicketsNone: "Nessun biglietto trovato per questa email.", myTicketsNoneHint: "Assicurati di usare la stessa email dell'acquisto.", myTicketsEnterEmail: "Inserisci la tua email per trovare i biglietti.", myTicketsValid: "Valido", myTicketsCheckedIn: "Registrato", myTicketsPaid: "Pagato", myTicketsOrderedAt: "Ordinato il",
  saveInfoLabel: "Salva dati account",
};

const globalPt: GlobalTranslations = {
  navHome: "Início", navDatesTickets: "Datas e Bilhetes", navExperience: "Experiência", navCollaboration: "Colaboração", navFaqSupport: "FAQ e Suporte", navTicketRebooking: "Troca de bilhete", navMyTickets: "Meus Bilhetes", navTickets: "Bilhetes",
  navForWho: "Para quem?", navMedia: "Mídia", navBlog: "Blog",
  navBookUs: "Reserve-nos!", navRegisterLocation: "Registar local", navPartner: "Ser Parceiro", navInfluencer: "Influencer", navJobs: "Empregos",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "A maior tour de festas ABBA sing-along da Europa. Mais de 250.000 fãs em todo o mundo.", heroTicketBtn: "Comprar bilhetes",
  trustCities: "CIDADES", trustCountries: "PAÍSES", trustFollowers: "SEGUIDORES", trustFans: "FÃS",
  whatIsTitle1: "O que é a", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "A maior festa ABBA do mundo! Uma experiência sing-along única com as músicas que marcaram gerações.",
  feat3hParty: "3+ horas de festa", featLiveDj: "DJ ao vivo e artistas", featGlitter: "Glitter e acessórios incluídos", featFans: "250.000+ fãs no mundo",
  countriesTitle1: "Estamos em", countriesTitle2: "13 países", countriesDesc: "A maior tour ABBA sing-along da Europa – e além.",
  countryNames: { DE: "Alemanha", AT: "Áustria", CH: "Suíça", NL: "Países Baixos", FR: "França", LU: "Luxemburgo", BE: "Bélgica", PL: "Polónia", CZ: "Chéquia", IT: "Itália", ES: "Espanha", HR: "Croácia", BR: "Brasil" },
  forWhomTitle1: "Para quem é", forWhomTitle2: "a festa?", forWhomDesc: "A GIMME GIMME PARTY é para todos que amam ABBA!",
  audJga: "Despedida de solteira", audJgaDesc: "A festa perfeita antes do grande dia.", audBirthday: "Aniversários", audBirthdayDesc: "Celebre o seu aniversário de forma única.", audGirlsNight: "Noite de meninas", audGirlsNightDesc: "Reúna o grupo e cantem as músicas que adoram.", audGroups: "Grupos", audGroupsDesc: "Ofertas especiais para grupos de 10+.", audFans: "Fãs de todas as gerações", audFansDesc: "ABBA é atemporal – fãs de todas as idades são bem-vindos!",
  countdownNext: "PRÓXIMO", countdownEvent: "EVENTO", countdownDays: "Dias", countdownHours: "Horas", countdownMinutes: "Minutos", countdownSeconds: "Segundos", countdownTicketsFor: "Bilhetes para", countdownSecure: "comprar",
  upcomingTitle1: "PRÓXIMAS", upcomingTitle2: "DATAS", upcomingAllDates: "Ver todas as datas",
  expectTitle1: "O QUE TE", expectTitle2: "ESPERA", expectDesc: "Cada paragem da tour é uma experiência única cheia de música e festa.",
  expectLiveDj: "DJ ao vivo", expectLiveDjDesc: "Os melhores hits ABBA – sem parar.", expectCrew: "Crew e artistas", expectCrewDesc: "Dançarinos profissionais no palco.", expectGlitter: "Glitter e acessórios", expectGlitterDesc: "Tiaras LED, estações de glitter e mais.", expectGiveaways: "Brindes", expectGiveawaysDesc: "Surpresas em cada paragem.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Todos os clássicos ABBA para cantar juntos.", expectUnforgettable: "Inesquecível", expectUnforgettableDesc: "3+ horas de festa e momentos inesquecíveis.",
  ticketCatTitle1: "CATEGORIAS", ticketCatTitle2: "DE BILHETES", ticketCatDesc: "Escolha a sua experiência.", ticketCatPopular: "POPULAR", ticketCatSecure: "Comprar agora",
  ticketRegular: "Bilhete Regular", ticketRegularDesc: "Bilhete de entrada", ticketDeluxe: "Bilhete Deluxe", ticketDeluxeDesc: "Entrada + acesso prioritário", ticketFan: "Bilhete Fan", ticketFanDesc: "Entrada VIP + tiara LED + pulseira exclusiva",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Viva o ambiente dos nossos shows.",
  reviewsTitle1: "O QUE DIZEM OS NOSSOS", reviewsTitle2: "CONVIDADOS",
  newsletterTitle1: "FIQUE", newsletterTitle2: "ATUALIZADO", newsletterDesc: "Novas datas, ofertas exclusivas e bastidores.", newsletterPlaceholder: "O seu email", newsletterSubmit: "Subscrever", newsletterThanks: "🎉 Obrigado! Já está dentro.", whatsappJoinGroup: "Entrar no grupo WhatsApp",
  footerAbout: "Sobre nós", footerAboutDesc: "A maior tour ABBA sing-along.", footerLinks: "Links", footerLegal: "Legal", footerSocial: "Redes Sociais",
  footerImprint: "Aviso legal", footerPrivacy: "Privacidade", footerTerms: "Termos", footerContact: "Contacto", footerAboutUs: "Sobre nós", footerFaq: "FAQ",
  myTicketsTitle: "Meus Bilhetes", myTicketsSubtitle: "Encontre os seus bilhetes", myTicketsSearch: "Introduza o seu email...", myTicketsSearchBtn: "Procurar", myTicketsNone: "Nenhum bilhete encontrado.", myTicketsNoneHint: "Certifique-se de usar o mesmo email da compra.", myTicketsEnterEmail: "Introduza o email para encontrar os bilhetes.", myTicketsValid: "Válido", myTicketsCheckedIn: "Registado", myTicketsPaid: "Pago", myTicketsOrderedAt: "Encomendado em",
  saveInfoLabel: "Guardar dados da conta",
};

const globalHr: GlobalTranslations = {
  navHome: "Početna", navDatesTickets: "Datumi i Ulaznice", navExperience: "Doživljaj", navCollaboration: "Suradnja", navFaqSupport: "FAQ i Podrška", navTicketRebooking: "Promjena ulaznice", navMyTickets: "Moje Ulaznice", navTickets: "Ulaznice",
  navForWho: "Za koga?", navMedia: "Mediji", navBlog: "Blog",
  navBookUs: "Rezerviraj nas!", navRegisterLocation: "Prijavi lokaciju", navPartner: "Postani Partner", navInfluencer: "Influencer", navJobs: "Posao",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "Najveća ABBA sing-along party turneja u Europi. Preko 250.000 fanova širom svijeta.", heroTicketBtn: "Kupi ulaznice",
  trustCities: "GRADOVA", trustCountries: "ZEMALJA", trustFollowers: "PRATITELJA", trustFans: "FANOVA",
  whatIsTitle1: "Što je", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "Najveća ABBA zabava na svijetu! Jedinstveno sing-along iskustvo s pjesmama koje su obilježile generacije.",
  feat3hParty: "3+ sata zabave", featLiveDj: "DJ uživo i izvođači", featGlitter: "Šljokice i dodaci uključeni", featFans: "250.000+ fanova",
  countriesTitle1: "Prisutni smo u", countriesTitle2: "13 zemalja", countriesDesc: "Najveća ABBA sing-along turneja u Europi – i šire.",
  countryNames: { DE: "Njemačka", AT: "Austrija", CH: "Švicarska", NL: "Nizozemska", FR: "Francuska", LU: "Luksemburg", BE: "Belgija", PL: "Poljska", CZ: "Češka", IT: "Italija", ES: "Španjolska", HR: "Hrvatska", BR: "Brazil" },
  forWhomTitle1: "Za koga je", forWhomTitle2: "zabava?", forWhomDesc: "GIMME GIMME PARTY je za sve koji vole ABBA!",
  audJga: "Djevojačka večer", audJgaDesc: "Savršena zabava prije velikog dana.", audBirthday: "Rođendani", audBirthdayDesc: "Proslavi rođendan na jedinstven način.", audGirlsNight: "Cura večer", audGirlsNightDesc: "Skupi ekipu i pjevajte pjesme koje volite.", audGroups: "Grupe", audGroupsDesc: "Posebne ponude za grupe od 10+.", audFans: "Fanovi svih generacija", audFansDesc: "ABBA je bezvremenska – dobrodošli fanovi svih uzrasta!",
  countdownNext: "SLJEDEĆI", countdownEvent: "DOGAĐAJ", countdownDays: "Dana", countdownHours: "Sati", countdownMinutes: "Minuta", countdownSeconds: "Sekundi", countdownTicketsFor: "Ulaznice za", countdownSecure: "kupi",
  upcomingTitle1: "NADOLAZEĆI", upcomingTitle2: "DATUMI", upcomingAllDates: "Pogledaj sve datume",
  expectTitle1: "ŠTO TE", expectTitle2: "ČEKA", expectDesc: "Svaki stop turneje je jedinstveno iskustvo puno glazbe i zabave.",
  expectLiveDj: "DJ uživo", expectLiveDjDesc: "Najbolji ABBA hitovi – non-stop.", expectCrew: "Crew i izvođači", expectCrewDesc: "Profesionalni plesači na pozornici.", expectGlitter: "Šljokice i dodaci", expectGlitterDesc: "LED trakice, stanice za šljokice i više.", expectGiveaways: "Pokloni", expectGiveawaysDesc: "Iznenađenja na svakom stopu.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Svi ABBA klasici za pjevanje zajedno.", expectUnforgettable: "Nezaboravno", expectUnforgettableDesc: "3+ sata zabave i nezaboravnih trenutaka.",
  ticketCatTitle1: "KATEGORIJE", ticketCatTitle2: "ULAZNICA", ticketCatDesc: "Odaberi svoje iskustvo.", ticketCatPopular: "POPULARNO", ticketCatSecure: "Kupi sada",
  ticketRegular: "Regular Ulaznica", ticketRegularDesc: "Ulaznica", ticketDeluxe: "Deluxe Ulaznica", ticketDeluxeDesc: "Ulaz + prioritetni pristup", ticketFan: "Fan Ulaznica", ticketFanDesc: "VIP ulaz + LED traka + ekskluzivna narukvica",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Doživi atmosferu naših showova.",
  reviewsTitle1: "ŠTO KAŽU NAŠI", reviewsTitle2: "GOSTI",
  newsletterTitle1: "BUDI U", newsletterTitle2: "TOKU", newsletterDesc: "Novi datumi, ekskluzivne ponude i iza kulisa.", newsletterPlaceholder: "Tvoj email", newsletterSubmit: "Pretplati se", newsletterThanks: "🎉 Hvala! Unutra si.", whatsappJoinGroup: "Pridruži se WhatsApp grupi",
  footerAbout: "O nama", footerAboutDesc: "Najveća ABBA sing-along turneja.", footerLinks: "Linkovi", footerLegal: "Pravno", footerSocial: "Društvene mreže",
  footerImprint: "Impressum", footerPrivacy: "Privatnost", footerTerms: "Uvjeti", footerContact: "Kontakt", footerAboutUs: "O nama", footerFaq: "FAQ",
  myTicketsTitle: "Moje Ulaznice", myTicketsSubtitle: "Pronađi svoje kupljene ulaznice", myTicketsSearch: "Unesi svoj email...", myTicketsSearchBtn: "Traži", myTicketsNone: "Nema ulaznica za ovaj email.", myTicketsNoneHint: "Koristi isti email kao pri kupnji.", myTicketsEnterEmail: "Unesi email za pronalaženje ulaznica.", myTicketsValid: "Važeća", myTicketsCheckedIn: "Registrirana", myTicketsPaid: "Plaćena", myTicketsOrderedAt: "Naručeno",
  saveInfoLabel: "Spremi podatke računa",
};

const globalCs: GlobalTranslations = {
  navHome: "Domů", navDatesTickets: "Termíny a Vstupenky", navExperience: "Zážitek", navCollaboration: "Spolupráce", navFaqSupport: "FAQ a Podpora", navTicketRebooking: "Přeobjednání", navMyTickets: "Moje Vstupenky", navTickets: "Vstupenky",
  navForWho: "Pro koho?", navMedia: "Média", navBlog: "Blog",
  navBookUs: "Rezervujte nás!", navRegisterLocation: "Zaregistrovat místo", navPartner: "Staňte se partnerem", navInfluencer: "Influencer", navJobs: "Práce",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "Největší ABBA sing-along party turné v Evropě. Přes 250 000 fanoušků po celém světě.", heroTicketBtn: "Koupit vstupenky",
  trustCities: "MĚST", trustCountries: "ZEMÍ", trustFollowers: "SLEDUJÍCÍCH", trustFans: "FANOUŠKŮ",
  whatIsTitle1: "Co je", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "Největší ABBA párty na světě! Jedinečný sing-along zážitek s písničkami, které poznamenaly generace.",
  feat3hParty: "3+ hodiny zábavy", featLiveDj: "Live DJ a umělci", featGlitter: "Glitry a doplňky v ceně", featFans: "250 000+ fanoušků",
  countriesTitle1: "Jsme v", countriesTitle2: "13 zemích", countriesDesc: "Největší ABBA sing-along turné v Evropě – a dále.",
  countryNames: { DE: "Německo", AT: "Rakousko", CH: "Švýcarsko", NL: "Nizozemsko", FR: "Francie", LU: "Lucembursko", BE: "Belgie", PL: "Polsko", CZ: "Česko", IT: "Itálie", ES: "Španělsko", HR: "Chorvatsko", BR: "Brazílie" },
  forWhomTitle1: "Pro koho je", forWhomTitle2: "párty?", forWhomDesc: "GIMME GIMME PARTY je pro všechny, kdo milují ABBA!",
  audJga: "Rozlučka se svobodou", audJgaDesc: "Perfektní oslava před velkým dnem.", audBirthday: "Narozeniny", audBirthdayDesc: "Oslavte narozeniny jedinečně.", audGirlsNight: "Dívčí večer", audGirlsNightDesc: "Svolejte partu a zpívejte písničky, které milujete.", audGroups: "Skupiny", audGroupsDesc: "Speciální nabídky pro skupiny 10+.", audFans: "Fanoušci všech generací", audFansDesc: "ABBA je nadčasová – fanoušci všech věků jsou vítáni!",
  countdownNext: "DALŠÍ", countdownEvent: "AKCE", countdownDays: "Dní", countdownHours: "Hodin", countdownMinutes: "Minut", countdownSeconds: "Sekund", countdownTicketsFor: "Vstupenky na", countdownSecure: "koupit",
  upcomingTitle1: "NADCHÁZEJÍCÍ", upcomingTitle2: "TERMÍNY", upcomingAllDates: "Zobrazit všechny termíny",
  expectTitle1: "CO TĚ", expectTitle2: "ČEKÁ", expectDesc: "Každá zastávka turné je jedinečný zážitek plný hudby a zábavy.",
  expectLiveDj: "Live DJ", expectLiveDjDesc: "Nejlepší ABBA hity – non-stop.", expectCrew: "Crew a umělci", expectCrewDesc: "Profesionální tanečníci na jevišti.", expectGlitter: "Glitry a doplňky", expectGlitterDesc: "LED čelenky, glitter stanice a více.", expectGiveaways: "Dárky", expectGiveawaysDesc: "Překvapení na každé zastávce.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Všechny ABBA klasiky ke zpívání.", expectUnforgettable: "Nezapomenutelné", expectUnforgettableDesc: "3+ hodiny zábavy a nezapomenutelných momentů.",
  ticketCatTitle1: "KATEGORIE", ticketCatTitle2: "VSTUPENEK", ticketCatDesc: "Vyberte si svůj zážitek.", ticketCatPopular: "OBLÍBENÉ", ticketCatSecure: "Koupit teď",
  ticketRegular: "Regular Vstupenka", ticketRegularDesc: "Vstupné", ticketDeluxe: "Deluxe Vstupenka", ticketDeluxeDesc: "Vstup + přednostní přístup", ticketFan: "Fan Vstupenka", ticketFanDesc: "VIP vstup + LED čelenka + exkluzivní náramek",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Zažijte atmosféru našich show.",
  reviewsTitle1: "CO ŘÍKAJÍ NAŠI", reviewsTitle2: "HOSTÉ",
  newsletterTitle1: "BUĎTE V", newsletterTitle2: "OBRAZE", newsletterDesc: "Nové termíny, exkluzivní nabídky a zákulisí.", newsletterPlaceholder: "Váš email", newsletterSubmit: "Odebírat", newsletterThanks: "🎉 Díky! Jste v tom.", whatsappJoinGroup: "Připojit se k WhatsApp skupině",
  footerAbout: "O nás", footerAboutDesc: "Největší ABBA sing-along turné.", footerLinks: "Odkazy", footerLegal: "Právní", footerSocial: "Sociální sítě",
  footerImprint: "Impressum", footerPrivacy: "Ochrana dat", footerTerms: "Podmínky", footerContact: "Kontakt", footerAboutUs: "O nás", footerFaq: "FAQ",
  myTicketsTitle: "Moje Vstupenky", myTicketsSubtitle: "Najděte své zakoupené vstupenky", myTicketsSearch: "Zadejte svůj email...", myTicketsSearchBtn: "Hledat", myTicketsNone: "Žádné vstupenky nenalezeny.", myTicketsNoneHint: "Použijte stejný email jako při objednávce.", myTicketsEnterEmail: "Zadejte email pro nalezení vstupenek.", myTicketsValid: "Platná", myTicketsCheckedIn: "Registrována", myTicketsPaid: "Zaplacena", myTicketsOrderedAt: "Objednáno",
  saveInfoLabel: "Uložit údaje účtu",
};

const globalTr: GlobalTranslations = {
  navHome: "Ana Sayfa", navDatesTickets: "Tarihler ve Biletler", navExperience: "Deneyim", navCollaboration: "İşbirliği", navFaqSupport: "SSS ve Destek", navTicketRebooking: "Bilet Değişikliği", navMyTickets: "Biletlerim", navTickets: "Biletler",
  navForWho: "Kimin için?", navMedia: "Medya", navBlog: "Blog",
  navBookUs: "Bizi Ayırtın!", navRegisterLocation: "Mekan Kaydet", navPartner: "Partner Ol", navInfluencer: "Influencer", navJobs: "İş",
  heroTitle: "GIMME GIMME", heroSubtitle: "THE ULTIMATE ABBA NIGHT", heroDesc: "Avrupa'nın en büyük ABBA sing-along parti turu. Dünyada 250.000'den fazla fan.", heroTicketBtn: "Bilet Al",
  trustCities: "ŞEHİR", trustCountries: "ÜLKE", trustFollowers: "TAKİPÇİ", trustFans: "FAN",
  whatIsTitle1: "Nedir", whatIsTitle2: "GIMME GIMME PARTY?", whatIsDesc: "Dünyanın en büyük ABBA partisi! Nesillere damga vuran şarkılarla benzersiz bir sing-along deneyimi.",
  feat3hParty: "3+ saat parti", featLiveDj: "Canlı DJ ve sanatçılar", featGlitter: "Simler ve aksesuarlar dahil", featFans: "250.000+ fan dünya genelinde",
  countriesTitle1: "Biz", countriesTitle2: "13 ülkedeyiz", countriesDesc: "Avrupa'nın en büyük ABBA sing-along turu – ve ötesinde.",
  countryNames: { DE: "Almanya", AT: "Avusturya", CH: "İsviçre", NL: "Hollanda", FR: "Fransa", LU: "Lüksemburg", BE: "Belçika", PL: "Polonya", CZ: "Çekya", IT: "İtalya", ES: "İspanya", HR: "Hırvatistan", BR: "Brezilya" },
  forWhomTitle1: "Parti kimin", forWhomTitle2: "için?", forWhomDesc: "GIMME GIMME PARTY ABBA'yı seven herkes için!",
  audJga: "Bekarlığa Veda", audJgaDesc: "Büyük günden önce mükemmel kutlama.", audBirthday: "Doğum Günleri", audBirthdayDesc: "Doğum gününü benzersiz bir şekilde kutla.", audGirlsNight: "Kız Gecesi", audGirlsNightDesc: "Ekibi topla ve sevdiğiniz şarkıları söyleyin.", audGroups: "Gruplar", audGroupsDesc: "10+ kişilik gruplar için özel teklifler.", audFans: "Tüm nesillerin fanları", audFansDesc: "ABBA zamansızdır – her yaştan fan hoş geldiniz!",
  countdownNext: "SONRAKİ", countdownEvent: "ETKİNLİK", countdownDays: "Gün", countdownHours: "Saat", countdownMinutes: "Dakika", countdownSeconds: "Saniye", countdownTicketsFor: "Biletler:", countdownSecure: "al",
  upcomingTitle1: "YAKLAŞAN", upcomingTitle2: "TARİHLER", upcomingAllDates: "Tüm tarihleri gör",
  expectTitle1: "SENİ NE", expectTitle2: "BEKLİYOR", expectDesc: "Her tur durağı müzik ve parti dolu benzersiz bir deneyim.",
  expectLiveDj: "Canlı DJ", expectLiveDjDesc: "En iyi ABBA hitleri – aralıksız.", expectCrew: "Crew ve sanatçılar", expectCrewDesc: "Sahnede profesyonel dansçılar.", expectGlitter: "Simler ve aksesuarlar", expectGlitterDesc: "LED taçlar, sim istasyonları ve daha fazlası.", expectGiveaways: "Hediyeler", expectGiveawaysDesc: "Her durakta sürprizler.", expectSingAlong: "Sing-Along", expectSingAlongDesc: "Birlikte söylemek için tüm ABBA klasikleri.", expectUnforgettable: "Unutulmaz", expectUnforgettableDesc: "3+ saat parti ve unutulmaz anlar.",
  ticketCatTitle1: "BİLET", ticketCatTitle2: "KATEGORİLERİ", ticketCatDesc: "Deneyimini seç.", ticketCatPopular: "POPÜLER", ticketCatSecure: "Şimdi al",
  ticketRegular: "Regular Bilet", ticketRegularDesc: "Giriş bileti", ticketDeluxe: "Deluxe Bilet", ticketDeluxeDesc: "Giriş + öncelikli erişim", ticketFan: "Fan Bilet", ticketFanDesc: "VIP giriş + LED taç + özel bileklik",
  vibesTitle1: "PARTY", vibesTitle2: "VIBES", videoTitle1: "PARTY", videoTitle2: "VIBES", videoDesc: "Showlarımızın atmosferini yaşa.",
  reviewsTitle1: "MİSAFİRLERİMİZ NE", reviewsTitle2: "DİYOR",
  newsletterTitle1: "GÜNCEL", newsletterTitle2: "KAL", newsletterDesc: "Yeni tarihler, özel teklifler ve kamera arkası.", newsletterPlaceholder: "E-posta adresiniz", newsletterSubmit: "Abone ol", newsletterThanks: "🎉 Teşekkürler! İçeridesin.", whatsappJoinGroup: "WhatsApp grubuna katıl",
  footerAbout: "Hakkımızda", footerAboutDesc: "En büyük ABBA sing-along turu.", footerLinks: "Bağlantılar", footerLegal: "Hukuki", footerSocial: "Sosyal Medya",
  footerImprint: "Yasal Bilgi", footerPrivacy: "Gizlilik", footerTerms: "Koşullar", footerContact: "İletişim", footerAboutUs: "Hakkımızda", footerFaq: "SSS",
  myTicketsTitle: "Biletlerim", myTicketsSubtitle: "Satın aldığınız biletleri bulun", myTicketsSearch: "E-postanızı girin...", myTicketsSearchBtn: "Ara", myTicketsNone: "Bu e-posta için bilet bulunamadı.", myTicketsNoneHint: "Siparişteki aynı e-postayı kullanın.", myTicketsEnterEmail: "Biletlerinizi bulmak için e-posta girin.", myTicketsValid: "Geçerli", myTicketsCheckedIn: "Kaydedildi", myTicketsPaid: "Ödendi", myTicketsOrderedAt: "Sipariş tarihi",
  saveInfoLabel: "Hesap bilgilerini kaydet",
};

const globalTranslationsMap: Record<string, GlobalTranslations> = {
  de: globalDe, en: globalEn, nl: globalNl, fr: globalFr, pl: globalPl,
  es: globalEs, it: globalIt, pt: globalPt, hr: globalHr, cs: globalCs, tr: globalTr,
};

// Fallback chain: supported language → English → German
const globalFallback = (lang: LangCode): GlobalTranslations => {
  return globalTranslationsMap[lang] || globalTranslationsMap.en || globalDe;
};

/** Detect browser language and return global translations */
export const getBrowserLang = (): LangCode => {
  const nav = typeof navigator !== "undefined" ? navigator.language || "" : "";
  const short = nav.split("-")[0].toLowerCase() as LangCode;
  // Return detected language if we have translations, otherwise fall back to German
  if (globalTranslationsMap[short]) return short;
  return "de";
};

export const getGlobalTranslations = (lang?: LangCode): GlobalTranslations => {
  const l = lang || getBrowserLang();
  return globalFallback(l);
};
