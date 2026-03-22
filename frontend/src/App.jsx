import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORAGE HELPERS (persistent localStorage) ───────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
  del: (k) => { try { localStorage.removeItem(k); } catch { } },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];
const SUBJECTS_FIXED = {
  "6": ["Mathematics", "Science", "Social Science", "Hindi", "English"],
  "7": ["Mathematics", "Science", "Social Science", "Hindi", "English"],
  "8": ["Mathematics", "Science", "Social Science", "Hindi", "English"],
  "9": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  "10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  "11": ["Physics", "Chemistry", "Mathematics", "Biology", "History", "Economics", "Hindi", "English"],
  "12": ["Physics", "Chemistry", "Mathematics", "Biology", "History", "Economics", "Hindi", "English"],
};
// Chapter map is now fully admin-driven via the Chapter Manager tab
const CHAPTER_MAP = {};

// ─── BILINGUAL SUGGESTIONS (per subject, per language) ───────────────────────
const SUGGESTIONS = {
  en: {
    Physics: ["Explain Newton's second law with formula", "Difference between speed and velocity", "What is work-energy theorem?"],
    Chemistry: ["What is valency and how is it determined?", "Explain structure of an atom", "Difference between ionic and covalent bonds"],
    Mathematics: ["Explain Pythagorean theorem with proof", "Difference between relation and function", "How to solve quadratic equations?"],
    Biology: ["Explain photosynthesis step by step", "What is cell theory?", "Difference between mitosis and meiosis"],
    Science: ["Difference between physical and chemical change", "Explain structure of an atom", "What is law of conservation of mass?"],
    "Social Science": ["Causes of the French Revolution", "What was the impact of colonialism on forests?", "Explain the rise of Nazism"],
    History: ["What are the key features of Harappan civilisation?", "Explain the caste system in ancient India", "Who were the early kings of India?"],
    Economics: ["What is the meaning of development?", "Explain primary, secondary and tertiary sectors", "What is globalisation?"],
    Hindi: ["दो बैलों की कथा का सारांश लिखो", "ल्हासा की ओर पाठ के मुख्य बिंदु", "प्रेमचंद के फटे जूते का भाव"],
    English: ["Summarise 'The Fun They Had'", "What is the theme of 'The Sound of Music'?", "Character analysis in 'A Truly Beautiful Mind'"],
    Sanskrit: ["भारतीवसन्तगीतिः का अर्थ समझाएं", "स्वर्णकाकः पाठ का सारांश", "गोदोहनम् के मुख्य पात्र"],
    default: ["Summarise the key concepts of this chapter", "What are the most important formulas?", "Give me exam-important points"],
  },
  hi: {
    Physics: ["Newton के द्वितीय गति नियम को सूत्र सहित समझाएं", "चाल और वेग में क्या अंतर है?", "कार्य-ऊर्जा प्रमेय क्या है?"],
    Chemistry: ["संयोजकता क्या होती है और कैसे निर्धारित होती है?", "परमाणु की संरचना समझाएं", "आयनिक और सहसंयोजक बंध में अंतर"],
    Mathematics: ["पाइथागोरस प्रमेय को उदाहरण सहित सिद्ध करें", "संबंध और फलन में क्या अंतर है?", "द्विघात समीकरण हल करने की विधि"],
    Biology: ["प्रकाश संश्लेषण की प्रक्रिया चरण-दर-चरण समझाएं", "कोशिका सिद्धांत क्या है?", "समसूत्री और अर्धसूत्री विभाजन में अंतर"],
    Science: ["भौतिक और रासायनिक परिवर्तन में अंतर बताएं", "परमाणु की संरचना समझाएं", "द्रव्यमान संरक्षण का नियम क्या है?"],
    "Social Science": ["फ्रांसीसी क्रांति के कारण क्या थे?", "वनों पर उपनिवेशवाद का क्या प्रभाव पड़ा?", "नाजीवाद के उदय की व्याख्या करें"],
    History: ["हड़प्पा सभ्यता की मुख्य विशेषताएं क्या हैं?", "प्राचीन भारत में जाति व्यवस्था की व्याख्या करें", "भारत के प्रारंभिक राजाओं का परिचय दें"],
    Economics: ["विकास का क्या अर्थ है?", "प्राथमिक, द्वितीयक और तृतीयक क्षेत्र समझाएं", "वैश्वीकरण क्या है?"],
    Hindi: ["दो बैलों की कथा का सारांश लिखो", "ल्हासा की ओर पाठ के मुख्य बिंदु बताएं", "प्रेमचंद के फटे जूते का केंद्रीय भाव"],
    English: ["'The Fun They Had' का सारांश हिंदी में दें", "'The Sound of Music' का मुख्य विषय क्या है?", "'A Truly Beautiful Mind' के पात्रों का विश्लेषण"],
    Sanskrit: ["भारतीवसन्तगीतिः का सरल अर्थ समझाएं", "स्वर्णकाकः पाठ का सारांश बताएं", "गोदोहनम् के मुख्य पात्र कौन हैं?"],
    default: ["इस अध्याय के मुख्य विषय समझाएं", "सबसे महत्वपूर्ण सूत्र कौन से हैं?", "परीक्षा के लिए जरूरी बिंदु बताएं"],
  }
};

// ─── FULL TRANSLATIONS ────────────────────────────────────────────────────────
const TR = {
  en: {
    // nav/landing
    brand: "Shiksha AI", startBtn: "Start Learning", adminBtn: "Admin",
    langToggle: "हिंदी", tagline: "BUILT FOR RURAL INDIA",
    heroLine1: "For Every Student", heroLine2: "in India",
    heroSub: "Smart AI tutor delivering formatted answers — with formulas, bullet points & chapter citations. Low data. Near-zero cost.",
    problemLabel: "THE PROBLEM", problemTitle: "What's Holding Students Back",
    solutionLabel: "OUR SOLUTION", solutionTitle: "How Shiksha AI Fixes It",
    featLabel: "FEATURES", featTitle: "Everything You Need",
    pipelineLabel: "AI PIPELINE", pipelineTitle: "Retrieval-Augmented Generation",
    ctaTitle: "Ready to Start Learning?",
    ctaSub: "No sign-up. No subscription. Pick your class, choose a subject, and ask anything.",
    footerBy: "Built with ❤️ for rural India · © 2025",
    // stats
    stats: [["6–12", "Classes"], ["10+", "Subjects"], ["~₹0.01", "Per Query"], ["<50KB", "Per Answer"]],
    // problems
    problems: [
      { icon: "💸", title: "Expensive Subscriptions", desc: "ChatGPT costs ₹1,600/month — unaffordable for most rural families." },
      { icon: "📶", title: "Poor Connectivity", desc: "Heavy AI apps fail on 2G or slow mobile data connections." },
      { icon: "📚", title: "Off-Curriculum Answers", desc: "Generic AI ignores NCERT and state board curricula." },
    ],
    solutions: [
      { icon: "🎯", title: "Curriculum-First AI", desc: "Answers grounded in NCERT & state board chapters — always." },
      { icon: "✂️", title: "Context Pruning", desc: "Only top 3–5 relevant text chunks sent to AI — saves data." },
      { icon: "₹", title: "Near-Zero Cost", desc: "Smart caching + small model = ~₹0.01 per question." },
    ],
    features: [
      { icon: "🧠", title: "RAG Pipeline" }, { icon: "📖", title: "Chapter Citation" },
      { icon: "📐", title: "Formula Rendering" }, { icon: "🌐", title: "Hindi + English" },
      { icon: "📱", title: "Mobile-First" }, { icon: "⚡", title: "Query Cache" },
    ],
    pipeline: [
      { n: "01", icon: "❓", l: "Student asks" }, null,
      { n: "02", icon: "🔍", l: "Vector search" }, null,
      { n: "03", icon: "✂️", l: "Top 3–5 chunks" }, null,
      { n: "04", icon: "🤖", l: "AI answers" },
    ],
    // dashboard
    backBtn: "← Back", historyTitle: "History", historyEmpty: "No history yet",
    classLabel: "Class", subjectLabel: "Subject", aiReady: "AI Ready",
    tryAsking: "Try asking", sendBtn: "Send ➤", sending: "Generating structured answer…",
    inputPlaceholder: "Ask anything from your textbook… (Enter to send)",
    footerHint: "⚡ Only top 3–5 chunks sent to AI · Answers include formulas, steps & chapter reference",
    cached: "⚡ cached",
    welcomeMsg: (cls, sub) => {
      const subjectLines = {
        Physics: `> Ask me anything — **Newton's laws**, **optics**, **thermodynamics**, circuit problems, derivations. I'll walk you through it step by step with formulas and real examples.`,
        Chemistry: `> Ask about **reactions**, **periodic table**, **bonding**, **thermodynamics**, or any concept. I'll give you balanced equations, mechanisms, and structured explanations.`,
        Mathematics: `> Ask me to solve problems, prove theorems, or explain **algebra**, **geometry**, **calculus**, or **trigonometry** — with full working steps.`,
        Biology: `> Ask about **cells**, **genetics**, **ecosystems**, **human physiology**, or any life science topic. Expect clear diagrams in text, classification tables, and process breakdowns.`,
        Science: `> Ask about **matter**, **forces**, **chemical reactions**, **life processes**, or **light & electricity**. I'll explain with real-world Indian examples and step-by-step reasoning.`,
        "Social Science": `> Ask about **history events**, **geography concepts**, **civics**, or **economics** from your textbook. I'll give you structured answers with timelines, causes, and key terms.`,
        History: `> Ask about **civilisations**, **empires**, **colonial rule**, **independence movements** — anything from your history textbook. Expect timelines, key figures, and cause-effect analysis.`,
        Economics: `> Ask about **development**, **sectors**, **money & banking**, **globalisation**, or **consumer rights**. I'll explain with Indian data, examples, and structured points.`,
        Hindi: `> अपनी पाठ्यपुस्तक से कोई भी प्रश्न पूछें — **पाठ का सारांश**, **पात्र-चित्रण**, **भाव**, **व्याकरण**, या **कविता की व्याख्या**। उत्तर सरल, बिंदुवार और परीक्षा-उपयोगी होगा।`,
        English: `> Ask about **story summaries**, **character analysis**, **themes**, **grammar**, or **poem meanings**. I'll give you clear, exam-ready answers with textual evidence.`,
        Sanskrit: `> पाठ का अर्थ, **शब्द-रूप**, **धातु-रूप**, **अनुवाद**, या **सारांश** — कुछ भी पूछें। उत्तर सरल हिंदी और संस्कृत में मिलेगा।`,
      };
      const line = subjectLines[sub] || `> Ask any question from your textbook. I'll give you a structured answer with **formulas**, numbered steps, bullet points, and a chapter reference.`;
      return `**Hello!** 🙏 I'm Shiksha AI — your Class **${cls}** **${sub}** tutor.\n\n${line}`;
    },
    errorMsg: "Sorry, an error occurred. Please try again.",
    // admin
    adminTitle: "Admin Access", adminSub: "Shiksha AI Management Panel",
    loginBtn: "Login →", backHome: "← Back to Home",
    demoHint: "Demo credentials:",
    usernameLabel: "USERNAME", passwordLabel: "PASSWORD",
    onlineLabel: "ONLINE", logoutBtn: "Logout",
    statsLabels: ["Textbooks", "Classes", "Chapters", "Cache Rate"],
    tabs: [{ id: "students", l: "🎒 Students" }, { id: "books", l: "📚 Textbooks" }, { id: "chapters", l: "📖 Chapters" }, { id: "upload", l: "⬆️ Upload PDF" }, { id: "stats", l: "📊 Usage Stats" }, { id: "admins", l: "👤 Manage Admins" }],
    uploadedTitle: "Uploaded Textbooks", uploadNewBtn: "+ Upload New",
    tableHeaders: ["Title", "Class", "Subject", "Chapters", "Uploaded", "Actions"],
    deleteBtn: "Delete", viewBtn: "View",
    uploadTitle: "Upload Textbook PDF",
    pipelineSteps: [
      { i: "📄", t: "PDF Extraction", d: "PyMuPDF extracts raw text preserving structure" },
      { i: "✂️", t: "Text Chunking", d: "~500 word chunks with 50-word overlap" },
      { i: "🔢", t: "Embedding Generation", d: "text-embedding-3-small (1536 dims)" },
      { i: "🗄️", t: "Vector Storage", d: "Stored in FAISS/Pinecone with chapter metadata" },
      { i: "⚡", t: "Index Refresh", d: "Search index updated automatically" },
    ],
    pipelineTitle2: "📋 Processing Pipeline",
    aiConfigTitle: "🤖 AI Configuration",
    healthTitle: "📊 System Health",
    dropLabel: "Drop PDF here or click to browse",
    dropSub: "NCERT & state board PDFs · up to 50 MB",
    processing: "Processing PDF…",
    processNote: "Extracting text → Chunking → Generating embeddings → Storing vectors…",
    manageAdmins: "Manage Admin Accounts",
    addAdmin: "Add Admin",
    adminUserLabel: "Username", adminPassLabel: "Password",
    noAdmins: "No additional admins",
    confirmDelete: "Are you sure you want to delete this admin?",
    credentialError: "Invalid username or password.",
    viewBookTitle: "View Textbook",
  },
  hi: {
    brand: "शिक्षा AI", startBtn: "पढ़ना शुरू करें", adminBtn: "एडमिन",
    langToggle: "English", tagline: "ग्रामीण भारत के लिए",
    heroLine1: "भारत के हर छात्र के लिए", heroLine2: "किफायती AI शिक्षक",
    heroSub: "स्मार्ट AI ट्यूटर — पाठ्यपुस्तक-आधारित उत्तर, सूत्र, बिंदु और अध्याय संदर्भ सहित। कम डेटा। लगभग मुफ्त।",
    problemLabel: "समस्या", problemTitle: "छात्रों के सामने चुनौतियाँ",
    solutionLabel: "समाधान", solutionTitle: "Shiksha AI कैसे मदद करता है",
    featLabel: "विशेषताएँ", featTitle: "सब कुछ जो आपको चाहिए",
    pipelineLabel: "AI पाइपलाइन", pipelineTitle: "Retrieval-Augmented Generation",
    ctaTitle: "आज ही पढ़ना शुरू करें?",
    ctaSub: "कोई साइन-अप नहीं। कोई सदस्यता नहीं। बस अपनी कक्षा और विषय चुनें और पूछें।",
    footerBy: "ग्रामीण भारत के लिए ❤️ से बनाया · © 2025",
    stats: [["6–12", "कक्षाएँ"], ["10+", "विषय"], ["~₹0.01", "प्रति प्रश्न"], ["<50KB", "प्रति उत्तर"]],
    problems: [
      { icon: "💸", title: "महँगी सदस्यता", desc: "ChatGPT ₹1,600/माह — ग्रामीण परिवारों के लिए बहुत महँगा।" },
      { icon: "📶", title: "खराब इंटरनेट", desc: "भारी AI ऐप्स 2G या धीमे इंटरनेट पर काम नहीं करते।" },
      { icon: "📚", title: "सिलेबस से बाहर उत्तर", desc: "सामान्य AI NCERT और राज्य बोर्ड सिलेबस को नजरअंदाज करता है।" },
    ],
    solutions: [
      { icon: "🎯", title: "पाठ्यक्रम-प्रथम AI", desc: "उत्तर हमेशा NCERT और राज्य बोर्ड के अध्यायों पर आधारित।" },
      { icon: "✂️", title: "Context Pruning", desc: "केवल 3–5 प्रासंगिक chunks AI को भेजे जाते हैं — डेटा बचत।" },
      { icon: "₹", title: "लगभग मुफ्त", desc: "स्मार्ट कैशिंग + छोटा मॉडल = ~₹0.01 प्रति प्रश्न।" },
    ],
    features: [
      { icon: "🧠", title: "RAG पाइपलाइन" }, { icon: "📖", title: "अध्याय संदर्भ" },
      { icon: "📐", title: "सूत्र प्रदर्शन" }, { icon: "🌐", title: "हिंदी + English" },
      { icon: "📱", title: "मोबाइल-फर्स्ट" }, { icon: "⚡", title: "क्वेरी कैश" },
    ],
    pipeline: [
      { n: "01", icon: "❓", l: "छात्र प्रश्न पूछता है" }, null,
      { n: "02", icon: "🔍", l: "वेक्टर सर्च" }, null,
      { n: "03", icon: "✂️", l: "Top 3–5 Chunks" }, null,
      { n: "04", icon: "🤖", l: "AI उत्तर देता है" },
    ],
    backBtn: "← वापस", historyTitle: "इतिहास", historyEmpty: "अभी कोई प्रश्न नहीं",
    classLabel: "कक्षा", subjectLabel: "विषय", aiReady: "AI तैयार है",
    tryAsking: "ये पूछकर देखें", sendBtn: "भेजें ➤", sending: "उत्तर तैयार हो रहा है…",
    inputPlaceholder: "अपना प्रश्न यहाँ लिखें… (Enter दबाएं भेजने के लिए)",
    footerHint: "⚡ केवल 3–5 प्रासंगिक chunks AI को भेजे जाते हैं · उत्तर में सूत्र, बिंदु और अध्याय संदर्भ",
    cached: "⚡ कैश्ड",
    welcomeMsg: (cls, sub) => {
      const subjectLines = {
        Physics: `> **न्यूटन के नियम**, **प्रकाशिकी**, **ऊष्मागतिकी**, सर्किट समस्याएँ, या कोई भी व्युत्पत्ति — सूत्र और वास्तविक उदाहरण के साथ चरण-दर-चरण समझाऊँगा।`,
        Chemistry: `> **रासायनिक अभिक्रियाएँ**, **आवर्त सारणी**, **रासायनिक बंध**, या **ऊष्मागतिकी** — संतुलित समीकरण और स्पष्ट तंत्र के साथ उत्तर मिलेगा।`,
        Mathematics: `> **बीजगणित**, **ज्यामिति**, **कलन**, या **त्रिकोणमिति** — कोई भी समस्या पूछें, पूरे हल के साथ समझाऊँगा।`,
        Biology: `> **कोशिका**, **आनुवंशिकता**, **पारिस्थितिकी**, **मानव शरीर** — कोई भी जीव विज्ञान का प्रश्न पूछें। वर्गीकरण, प्रक्रिया और तुलना के साथ उत्तर मिलेगा।`,
        Science: `> **पदार्थ**, **बल**, **रासायनिक अभिक्रियाएँ**, **जीवन प्रक्रियाएँ**, **प्रकाश और विद्युत** — भारतीय उदाहरणों के साथ स्पष्ट उत्तर मिलेगा।`,
        "Social Science": `> **इतिहास**, **भूगोल**, **नागरिकशास्त्र**, या **अर्थशास्त्र** — पाठ्यपुस्तक से कुछ भी पूछें। समयरेखा, कारण-प्रभाव और मुख्य बिंदुओं के साथ उत्तर मिलेगा।`,
        History: `> **सभ्यताएँ**, **साम्राज्य**, **औपनिवेशिक शासन**, **स्वतंत्रता आंदोलन** — समयरेखा, प्रमुख व्यक्तित्व और विश्लेषण के साथ उत्तर मिलेगा।`,
        Economics: `> **विकास**, **क्षेत्र**, **मुद्रा व बैंकिंग**, **वैश्वीकरण**, **उपभोक्ता अधिकार** — भारतीय आँकड़ों और उदाहरणों के साथ बिंदुवार उत्तर मिलेगा।`,
        Hindi: `> **पाठ का सारांश**, **पात्र-चित्रण**, **केंद्रीय भाव**, **व्याकरण**, या **कविता की व्याख्या** — कोई भी प्रश्न पूछें। उत्तर सरल, बिंदुवार और परीक्षा-उपयोगी होगा।`,
        English: `> Ask about **story summaries**, **character analysis**, **themes**, **grammar**, or **poem meanings** in Hindi or English. I'll give you clear, exam-ready answers.`,
        Sanskrit: `> पाठ का **अर्थ**, **शब्द-रूप**, **धातु-रूप**, **अनुवाद**, या **सारांश** — कुछ भी पूछें। उत्तर सरल हिंदी और संस्कृत में मिलेगा।`,
      };
      const line = subjectLines[sub] || `> अपनी पाठ्यपुस्तक से कोई भी प्रश्न पूछें। उत्तर में **सूत्र**, क्रमांकित चरण, बुलेट बिंदु और अध्याय संदर्भ शामिल होंगे।`;
      return `**नमस्ते!** 🙏 मैं Shiksha AI हूँ — कक्षा **${cls}** **${sub}** का आपका AI शिक्षक।\n\n${line}`;
    },
    errorMsg: "माफ़ करें, कोई त्रुटि हुई। कृपया पुनः प्रयास करें।",
    adminTitle: "एडमिन लॉगिन", adminSub: "Shiksha AI प्रबंधन पैनल",
    loginBtn: "लॉगिन →", backHome: "← होम पर वापस",
    demoHint: "डेमो लॉगिन:",
    usernameLabel: "यूज़रनेम", passwordLabel: "पासवर्ड",
    onlineLabel: "ऑनलाइन", logoutBtn: "लॉगआउट",
    statsLabels: ["पाठ्यपुस्तकें", "कक्षाएँ", "अध्याय", "कैश दर"],
    tabs: [{ id: "students", l: "🎒 छात्र" }, { id: "books", l: "📚 पाठ्यपुस्तकें" }, { id: "chapters", l: "📖 अध्याय" }, { id: "upload", l: "⬆️ PDF अपलोड" }, { id: "stats", l: "📊 उपयोग आँकड़े" }, { id: "admins", l: "👤 एडमिन प्रबंधन" }],
    uploadedTitle: "अपलोड की गई पाठ्यपुस्तकें", uploadNewBtn: "+ नई अपलोड करें",
    tableHeaders: ["शीर्षक", "कक्षा", "विषय", "अध्याय", "अपलोड तिथि", "कार्रवाई"],
    deleteBtn: "हटाएं", viewBtn: "देखें",
    uploadTitle: "पाठ्यपुस्तक PDF अपलोड करें",
    pipelineSteps: [
      { i: "📄", t: "PDF निष्कर्षण", d: "PyMuPDF कच्चा पाठ निकालता है" },
      { i: "✂️", t: "टेक्स्ट चंकिंग", d: "~500 शब्दों के टुकड़े, 50 शब्द ओवरलैप" },
      { i: "🔢", t: "एम्बेडिंग निर्माण", d: "text-embedding-3-small (1536 dims)" },
      { i: "🗄️", t: "वेक्टर स्टोरेज", d: "FAISS/Pinecone में मेटाडेटा सहित संग्रहीत" },
      { i: "⚡", t: "इंडेक्स अपडेट", d: "सर्च इंडेक्स स्वतः अपडेट होता है" },
    ],
    pipelineTitle2: "📋 प्रोसेसिंग पाइपलाइन",
    aiConfigTitle: "🤖 AI कॉन्फ़िगरेशन",
    healthTitle: "📊 सिस्टम स्वास्थ्य",
    dropLabel: "PDF यहाँ छोड़ें या क्लिक करके चुनें",
    dropSub: "NCERT और राज्य बोर्ड PDF · अधिकतम 50 MB",
    processing: "PDF प्रोसेस हो रही है…",
    processNote: "पाठ निकालना → टुकड़े करना → एम्बेडिंग बनाना → वेक्टर स्टोर…",
    manageAdmins: "एडमिन खाते प्रबंधित करें",
    addAdmin: "एडमिन जोड़ें",
    adminUserLabel: "यूज़रनेम", adminPassLabel: "पासवर्ड",
    noAdmins: "कोई अतिरिक्त एडमिन नहीं",
    confirmDelete: "क्या आप इस एडमिन को हटाना चाहते हैं?",
    credentialError: "गलत यूज़रनेम या पासवर्ड।",
    viewBookTitle: "पाठ्यपुस्तक देखें",
  }
};

const SYSTEM_PROMPT = `You are Shiksha AI, an expert tutor aligned with NCERT and Indian state board syllabi for Classes 6-12.

STRICT FORMATTING RULES:
1. Begin with one direct answer sentence.
2. Use **bold** for all key terms, names, and important words.
3. For step-by-step or ordered content, use numbered lists: 1. 2. 3.
4. For properties, types, or features, use bullet lists: - item
5. For every formula, use this exact format on its own line: FORMULA: [formula here]
6. Use > prefix for definitions or important notes (blockquote).
7. Use ## for section headings when the answer has 2+ distinct parts.
8. Include a real Indian everyday example labeled: **Example:** [example]
9. Keep total response under 280 words.
10. End EVERY response with exactly: ---\nChapter reference: [chapter name]

Be precise, curriculum-accurate, and student-friendly.`;

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#0d1117;--ink2:#3d4a5c;--ink3:#7a8799;
  --navy:#0f2044;--navy2:#162d5e;
  --saffron:#e8650a;--saffron2:#ff8533;
  --jade:#0e9e6e;--jade-light:#e6f7f2;
  --cream:#fffdf7;--paper:#f7f5f0;
  --border:#e4e0d8;--border2:#ccc7bc;
  --white:#ffffff;
  --shadow:0 2px 8px rgba(13,17,23,.06),0 8px 32px rgba(13,17,23,.08);
  --shadow-lg:0 8px 24px rgba(13,17,23,.10),0 24px 64px rgba(13,17,23,.12);
  --font-ui:'Sora',sans-serif;
  --font-serif:'DM Serif Display',serif;
  --font-mono:'JetBrains Mono',monospace;
  --font-deva:'Noto Sans Devanagari',sans-serif;
}
body{font-family:var(--font-ui);background:var(--paper);color:var(--ink)}
.deva{font-family:var(--font-deva)!important}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse2{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideRight{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes msgIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes dot{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}}
@keyframes borderGlow{0%,100%{box-shadow:0 0 0 0 rgba(232,101,10,.3)}50%{box-shadow:0 0 0 8px rgba(232,101,10,0)}}
@keyframes modalIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.fu{animation:fadeUp .5s ease both}
.fu1{animation:fadeUp .5s .1s ease both}
.fu2{animation:fadeUp .5s .2s ease both}
.fu3{animation:fadeUp .5s .3s ease both}
.fu4{animation:fadeUp .5s .42s ease both}
/* ── Answer Markdown Styles ── */
.ans-wrap{font-size:14.5px;line-height:1.82;color:var(--ink);font-family:var(--font-ui)}
.ans-wrap h2{font-family:var(--font-ui);font-weight:700;font-size:11.5px;color:var(--navy);text-transform:uppercase;letter-spacing:.08em;margin:16px 0 7px;padding-bottom:5px;border-bottom:2px solid var(--saffron);display:inline-block}
.ans-wrap p{margin:5px 0}
.ans-wrap strong{color:var(--navy);font-weight:700}
.ans-wrap .ul-list{margin:8px 0;display:flex;flex-direction:column;gap:5px;list-style:none;padding:0}
.ans-wrap .ul-list li{display:flex;gap:9px;align-items:flex-start}
.ans-wrap .ul-list li .bullet{color:var(--saffron);font-size:9px;margin-top:6px;flex-shrink:0;font-weight:900}
.ans-wrap .ol-list{margin:8px 0;display:flex;flex-direction:column;gap:6px;list-style:none;padding:0}
.ans-wrap .ol-list li{display:flex;gap:10px;align-items:flex-start}
.ans-wrap .ol-list li .step-num{background:var(--navy);color:white;font-size:10.5px;font-weight:700;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px;flex-shrink:0}
.ans-wrap .formula-wrap{background:var(--navy);color:#c9e4ff;border-radius:11px;padding:12px 16px;margin:11px 0;font-family:var(--font-mono);font-size:14px;font-weight:600;border-left:4px solid var(--saffron);letter-spacing:.03em;box-shadow:0 3px 12px rgba(15,32,68,.2)}
.ans-wrap .formula-label{font-size:9.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--saffron2);font-family:var(--font-ui);margin-bottom:4px;font-weight:800}
.ans-wrap .bq{background:linear-gradient(135deg,#fff8f0,#fff2e4);border-left:3px solid var(--saffron);border-radius:0 10px 10px 0;padding:10px 14px;margin:10px 0;color:var(--ink2);font-style:italic;font-size:14px}
.ans-wrap .example-wrap{background:var(--jade-light);border:1px solid #9ddfc8;border-radius:10px;padding:11px 15px;margin:10px 0;font-size:13.5px}
.ans-wrap .example-wrap .ex-label{font-size:10px;font-weight:800;color:var(--jade);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
.ans-wrap hr{border:none;border-top:1px dashed var(--border2);margin:14px 0}
.ans-wrap code{font-family:var(--font-mono);font-size:12.5px;background:#f0ede8;padding:1px 6px;border-radius:4px;color:var(--saffron)}
`;

// ─── ANSWER RENDERER ─────────────────────────────────────────────────────────
function AnswerRenderer({ text, isHindi }) {
  const renderInline = (txt) => {
    const BACKTICK = "\x60";
    const parts = txt.split(/(\*\*[^*]+\*\*|\x60[^\x60]+\x60)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith(BACKTICK) && p.endsWith(BACKTICK)) return <code key={i}>{p.slice(1, -1)}</code>;
      return p;
    });
  };
  const lines = text.split("\n");
  const out = []; let olBuf = [], ulBuf = [];
  const flushOl = (k) => { if (!olBuf.length) return; out.push(<ol key={k} className="ol-list">{olBuf.map((t, j) => <li key={j}><span className="step-num">{j + 1}</span><span>{renderInline(t)}</span></li>)}</ol>); olBuf = []; };
  const flushUl = (k) => { if (!ulBuf.length) return; out.push(<ul key={k} className="ul-list">{ulBuf.map((t, j) => <li key={j}><span className="bullet">◆</span><span>{renderInline(t)}</span></li>)}</ul>); ulBuf = []; };
  const flush = (k) => { flushOl(k + "o"); flushUl(k + "u"); };
  lines.forEach((line, i) => {
    const t = line.trim(); if (!t) return;
    if (t === "---") { flush(i); out.push(<hr key={i} />); return; }
    if (t.startsWith("## ")) { flush(i); out.push(<h2 key={i}>{t.slice(3)}</h2>); return; }
    if (t.startsWith("FORMULA:")) { flush(i); const f = t.replace(/^FORMULA:\s*/, ""); out.push(<div key={i} className="formula-wrap"><div className="formula-label">Formula</div>{f}</div>); return; }
    if (t.startsWith("> ")) { flush(i); out.push(<div key={i} className="bq">{renderInline(t.slice(2))}</div>); return; }
    if (t.startsWith("**Example:")) { flush(i); const b = t.replace(/^\*\*Example:\*?\*?\s*/, ""); out.push(<div key={i} className="example-wrap"><div className="ex-label">📍 Example</div><span>{renderInline(b || t)}</span></div>); return; }
    const olM = t.match(/^(\d+)\.\s+(.*)/); if (olM) { flushUl(i); olBuf.push(olM[2]); return; }
    if (t.startsWith("- ") || t.startsWith("* ")) { flushOl(i); ulBuf.push(t.slice(2)); return; }
    flush(i); out.push(<p key={i}>{renderInline(t)}</p>);
  });
  flush("end");
  return <div className={`ans-wrap${isHindi ? " deva" : ""}`}>{out}</div>;
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function Spinner({ s = 18, light = true }) {
  return <div style={{ width: s, height: s, border: `2.5px solid ${light ? "rgba(255,255,255,.25)" : "var(--border)"}`, borderTopColor: light ? "white" : "var(--navy)", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />;
}
function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3600); return () => clearTimeout(t); }, [onClose]);
  const col = { success: "#0e9e6e", error: "#dc2626", info: "#0ea5e9" }[type];
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--white)",
      border: `1px solid var(--border)`, borderLeft: `4px solid ${col}`, borderRadius: 12,
      padding: "13px 18px", boxShadow: "var(--shadow-lg)", animation: "slideRight .3s ease",
      maxWidth: 340, display: "flex", alignItems: "center", gap: 10
    }}>
      <span style={{ fontSize: 16 }}>{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
      <span style={{ fontSize: 13, color: "var(--ink)", fontFamily: "var(--font-ui)" }}>{message}</span>
    </div>
  );
}
function Badge({ children, color = "blue" }) {
  const m = { blue: { bg: "#dbeafe", t: "#1d4ed8" }, green: { bg: "#dcfce7", t: "#15803d" }, amber: { bg: "#fef9c3", t: "#a16207" }, red: { bg: "#fee2e2", t: "#b91c1c" }, navy: { bg: "#dde8ff", t: "#0f2044" }, orange: { bg: "#ffedd5", t: "#c2410c" } };
  const c = m[color] || m.blue;
  return <span style={{ background: c.bg, color: c.t, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-ui)", letterSpacing: ".03em" }}>{children}</span>;
}

// ─── PDF VIEWER — PDF.js canvas renderer ─────────────────────────────────────
function PdfCanvasViewer({ dataUrl }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Step 1: load PDF.js script dynamically
  const ensurePdfJs = useCallback(() => new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(s);
  }), []);

  // Step 2: load document from base64 dataUrl
  useEffect(() => {
    if (!dataUrl) { setLoading(false); return; }
    setLoading(true); setError(null); setPage(1);
    ensurePdfJs().then(lib => {
      // Strip the data:application/pdf;base64, prefix
      const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      return lib.getDocument({ data: atob(b64) }).promise;
    }).then(pdf => {
      pdfDocRef.current = pdf;
      setPageCount(pdf.numPages);
      setLoading(false);
    }).catch(err => {
      setError("Could not open PDF: " + err.message);
      setLoading(false);
    });
  }, [dataUrl, ensurePdfJs]);

  // Step 3: render a page whenever page number changes
  useEffect(() => {
    if (loading || error || !pdfDocRef.current || !canvasRef.current) return;
    if (renderTaskRef.current) { renderTaskRef.current.cancel(); }
    pdfDocRef.current.getPage(page).then(pdfPage => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: 1.5 * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = (viewport.width / dpr) + "px";
      canvas.style.height = (viewport.height / dpr) + "px";
      const ctx = canvas.getContext("2d");
      const task = pdfPage.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      task.promise.catch(e => { if (e && e.name !== "RenderingCancelledException") console.warn(e); });
    }).catch(e => console.warn(e));
  }, [page, loading, error]);

  if (!dataUrl) return (
    <div style={{ padding: "32px", textAlign: "center", background: "var(--paper)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 8 }}>No PDF file attached</div>
      <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>This is a pre-loaded sample entry.<br />Delete it and re-upload the actual PDF to view it here.</div>
    </div>
  );
  if (loading) return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--saffron)",
        borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px"
      }} />
      <div style={{ color: "var(--ink3)", fontSize: 14, fontWeight: 500 }}>Loading PDF viewer…</div>
      <div style={{ color: "var(--ink3)", fontSize: 12, marginTop: 6 }}>Fetching PDF.js engine from CDN</div>
    </div>
  );
  if (error) return (
    <div style={{ padding: "20px", background: "#fee2e2", borderRadius: 12, textAlign: "center", color: "#b91c1c", fontSize: 14, lineHeight: 1.6 }}>
      ⚠️ {error}
    </div>
  );
  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        background: "var(--paper)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)"
      }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
          style={{
            background: page <= 1 ? "var(--border)" : "var(--navy)", color: page <= 1 ? "var(--ink3)" : "white",
            border: "none", borderRadius: 7, padding: "6px 14px", fontWeight: 700, fontSize: 13,
            cursor: page <= 1 ? "default" : "pointer", transition: "background .15s"
          }}>← Prev</button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>
          Page {page} of {pageCount}
        </span>
        <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}
          style={{
            background: page >= pageCount ? "var(--border)" : "var(--navy)", color: page >= pageCount ? "var(--ink3)" : "white",
            border: "none", borderRadius: 7, padding: "6px 14px", fontWeight: 700, fontSize: 13,
            cursor: page >= pageCount ? "default" : "pointer", transition: "background .15s"
          }}>Next →</button>
      </div>
      {/* Canvas */}
      <div style={{ background: "#3c3c3c", borderRadius: 10, padding: 14, display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <canvas ref={canvasRef} style={{ borderRadius: 4, boxShadow: "0 4px 24px rgba(0,0,0,.4)", maxWidth: "100%" }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--ink3)" }}>
        Use Prev / Next to navigate • Rendered by PDF.js
      </div>
    </div>
  );
}

// ─── BOOK VIEWER MODAL ────────────────────────────────────────────────────────
function BookViewer({ book, onClose }) {
  const [viewMode, setViewMode] = useState(book.pdfDataUrl ? "pdf" : "chapters");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,.65)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--white)", borderRadius: 20, width: "100%", maxWidth: 840,
        maxHeight: "92vh", display: "flex", flexDirection: "column",
        animation: "modalIn .25s ease", boxShadow: "0 32px 80px rgba(0,0,0,.35)"
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--navy)" }}>📘 {book.title}</div>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>
              Class {book.cls} · {book.subject} · {book.chapters} chapters · {book.uploaded}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "var(--paper)", border: "1px solid var(--border)",
            borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "var(--ink2)", lineHeight: 1
          }}>✕</button>
        </div>
        <div style={{ padding: "10px 22px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4, flexShrink: 0 }}>
          {[{ id: "pdf", label: "📄 PDF Viewer", dis: !book.pdfDataUrl }, { id: "chapters", label: "📋 Chapter List", dis: false }].map(tb => (
            <button key={tb.id} onClick={() => !tb.dis && setViewMode(tb.id)} disabled={tb.dis}
              style={{
                background: viewMode === tb.id ? "linear-gradient(135deg,var(--navy),var(--navy2))" : tb.dis ? "var(--paper)" : "none",
                color: viewMode === tb.id ? "white" : tb.dis ? "var(--ink3)" : "var(--ink2)",
                border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "var(--font-ui)",
                fontWeight: 700, fontSize: 13, cursor: tb.dis ? "not-allowed" : "pointer", opacity: tb.dis ? 0.5 : 1
              }}>
              {tb.label}
            </button>
          ))}
          {!book.pdfDataUrl && <span style={{ fontSize: 12, color: "var(--ink3)", alignSelf: "center", marginLeft: 8 }}>💡 Re-upload to enable PDF view</span>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {viewMode === "pdf" && <PdfCanvasViewer dataUrl={book.pdfDataUrl} />}
          {viewMode === "chapters" && (
            <div style={{ background: "var(--paper)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginBottom: 14, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>All Chapters</div>
              {(CHAPTER_MAP[book.subject] || []).concat(
                Array.from({ length: Math.max(0, book.chapters - (CHAPTER_MAP[book.subject] || []).length) },
                  (_, i) => "Chapter " + (((CHAPTER_MAP[book.subject] || []).length) + i + 1))
              ).map((ch, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--navy),var(--navy2))",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{ch}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════
//  AUTH HELPERS
// ════════════════════════════════════════════════════════
const getStudents = () => LS.get("shiksha_students", []);
const saveStudents = (s) => LS.set("shiksha_students", s);
const getTeachers  = () => LS.get("shiksha_teachers",  [{ id: "root", name: "Admin Teacher", username: "admin", password: "shiksha123", isRoot: true }]);
const saveTeachers = (t) => LS.set("shiksha_teachers",  t);

// ════════════════════════════════════════════════════════
//  ROLE SELECTION — redesigned landing page
// ════════════════════════════════════════════════════════
function RolePage({ onStudent, onTeacher, lang, setLang }) {
  const isHi = lang === "hi";
  const stats = [
    { n: "6–12", l: isHi ? "कक्षाएँ" : "Classes" },
    { n: "10+",  l: isHi ? "विषय"   : "Subjects" },
    { n: "₹0",   l: isHi ? "लागत"   : "Cost" },
    { n: "2s",   l: isHi ? "उत्तर"  : "Avg Answer" },
  ];
  const features = [
    { icon: "🧠", t: isHi ? "NCERT-आधारित" : "NCERT-Aligned",       d: isHi ? "हर उत्तर पाठ्यपुस्तक से" : "Every answer from your textbook" },
    { icon: "📐", t: isHi ? "सूत्र रेंडरिंग" : "Formula Rendering",  d: isHi ? "गणित और विज्ञान के सूत्र" : "Math & science formulas rendered" },
    { icon: "🌐", t: isHi ? "द्विभाषी"      : "Hindi + English",     d: isHi ? "हिंदी और अंग्रेज़ी दोनों" : "Ask in Hindi or English" },
    { icon: "⚡", t: isHi ? "तेज़ कैश"      : "Smart Cache",         d: isHi ? "दोबारा पूछने पर तुरंत जवाब" : "Repeat questions answered instantly" },
    { icon: "📱", t: isHi ? "मोबाइल-फर्स्ट" : "Mobile-First",        d: isHi ? "2G पर भी काम करता है" : "Works even on 2G connections" },
    { icon: "🔒", t: isHi ? "शिक्षक नियंत्रण" : "Teacher Control",   d: isHi ? "शिक्षक छात्र एक्सेस देते हैं" : "Teacher-gated student access" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "var(--font-ui)", overflowX: "hidden" }}>
      <style>{G}</style>
      <style>{`
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        .role-card:hover .role-cta { transform: translateX(4px); }
        .role-cta { transition: transform .2s; display:inline-block; }
        .feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; }
        .stat-item { text-align:center; }
        @media(max-width:600px){ .hero-grid{flex-direction:column;} .role-cards{flex-direction:column;} }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(255,253,247,.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", padding: "0 clamp(20px,5vw,64px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: "0 2px 8px rgba(15,32,68,.28)", animation: "floatY 3s ease-in-out infinite" }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: 19, background: "linear-gradient(90deg,var(--navy),var(--navy2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Shiksha AI</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setLang(isHi ? "en" : "hi")} style={{ background: "none", border: "1.5px solid var(--border2)", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "var(--ink2)", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor="var(--navy)"} onMouseLeave={e => e.currentTarget.style.borderColor="var(--border2)"}>
            {isHi ? "English" : "हिंदी"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "clamp(64px,10vh,100px) clamp(20px,5vw,72px) 0", maxWidth: 1160, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center", justifyContent: "space-between" }} className="hero-grid">

        {/* Left copy */}
        <div style={{ flex: "1 1 420px", textAlign: "left" }}>
          <div className="fu" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg,#fff2e8,#ffecd8)", border: "1px solid #f9c99a", borderRadius: 30, padding: "5px 18px", fontSize: 11.5, fontWeight: 700, color: "var(--saffron)", marginBottom: 24, letterSpacing: ".06em" }}>
            🇮🇳 {isHi ? "ग्रामीण भारत के लिए बनाया गया" : "BUILT FOR RURAL INDIA"}
          </div>
          <h1 className="fu1" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(38px,5.5vw,62px)", lineHeight: 1.06, color: "var(--navy)", marginBottom: 20 }}>
            {isHi ? <>भारत के हर<br /><span style={{ background: "linear-gradient(90deg,var(--saffron),var(--saffron2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>छात्र के लिए</span></> : <>For Every<br /><span style={{ background: "linear-gradient(90deg,var(--saffron),var(--saffron2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Student in India</span></>}
          </h1>
          <p className="fu2" style={{ fontSize: 16, color: "var(--ink2)", lineHeight: 1.78, marginBottom: 36, maxWidth: 500 }}>
            {isHi ? "AI ट्यूटर जो NCERT पाठ्यपुस्तकों से जवाब देता है — सूत्र, बिंदु और अध्याय संदर्भ के साथ।" : "Smart AI tutor delivering answers grounded in NCERT textbooks — with formulas, bullet points & chapter citations."}
          </p>

          {/* Stats row */}
          <div className="fu3" style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingTop: 28, borderTop: "1px solid var(--border)", marginBottom: 8 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-item">
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--navy)", fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink3)", fontWeight: 500, marginTop: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — role cards */}
        <div className="fu2" style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>
            {isHi ? "आप कौन हैं?" : "Choose your role"}
          </div>

          {/* Student card */}
          <div className="role-card" onClick={onStudent} style={{ background: "linear-gradient(135deg,#fffaf5 0%,#fff5ec 100%)", border: "2px solid #f9c99a", borderRadius: 20, padding: "24px 26px", cursor: "pointer", transition: "all .25s", boxShadow: "0 4px 20px rgba(232,101,10,.1)", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 14px 36px rgba(232,101,10,.2)"; e.currentTarget.style.borderColor="var(--saffron)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 20px rgba(232,101,10,.1)"; e.currentTarget.style.borderColor="#f9c99a"; }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 3px 10px rgba(232,101,10,.3)" }}>🎒</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)" }}>{isHi ? "छात्र" : "Student"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--saffron)", fontWeight: 600 }}>{isHi ? "लॉगिन / साइनअप" : "Login / Sign Up"}</div>
                </div>
              </div>
              <div style={{ fontSize: 22, color: "var(--saffron)" }} className="role-cta">→</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, paddingLeft: 2 }}>
              {isHi ? "प्रश्न पूछें, PDF देखें। शिक्षक की मंज़ूरी के बाद एक्सेस मिलता है।" : "Ask questions & read PDFs. Access unlocked after your teacher approves you."}
            </div>
          </div>

          {/* Teacher card */}
          <div className="role-card" onClick={onTeacher} style={{ background: "linear-gradient(135deg,#f0f4ff 0%,#e8eeff 100%)", border: "2px solid #c7d4f5", borderRadius: 20, padding: "24px 26px", cursor: "pointer", transition: "all .25s", boxShadow: "0 4px 20px rgba(15,32,68,.08)", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 14px 36px rgba(15,32,68,.18)"; e.currentTarget.style.borderColor="var(--navy)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 20px rgba(15,32,68,.08)"; e.currentTarget.style.borderColor="#c7d4f5"; }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 3px 10px rgba(15,32,68,.3)" }}>👩‍🏫</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)" }}>{isHi ? "शिक्षक" : "Teacher"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--navy2)", fontWeight: 600 }}>{isHi ? "लॉगिन / साइनअप" : "Login / Sign Up"}</div>
                </div>
              </div>
              <div style={{ fontSize: 22, color: "var(--navy)" }} className="role-cta">→</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, paddingLeft: 2 }}>
              {isHi ? "PDF अपलोड करें, अध्याय बनाएं, छात्रों को मंज़ूरी दें।" : "Upload PDFs, manage chapters, approve students."}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ maxWidth: 1160, margin: "80px auto 0", padding: "0 clamp(20px,5vw,72px)" }}>
        <div className="fu2" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--saffron)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>{isHi ? "विशेषताएँ" : "FEATURES"}</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3.5vw,38px)", color: "var(--navy)", lineHeight: 1.15 }}>
            {isHi ? "जो चाहिए, वो सब यहाँ है" : "Everything You Need"}
          </h2>
        </div>
        <div className="feat-grid fu3">
          {features.map((f, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 10px rgba(0,0,0,.04)", transition: "all .22s", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.09)"; e.currentTarget.style.borderColor="var(--saffron)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor="var(--border)"; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--navy)", marginBottom: 5 }}>{f.t}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ margin: "72px clamp(20px,5vw,72px) 0", background: "linear-gradient(135deg,var(--navy) 0%,#1a3a6e 100%)", borderRadius: 24, padding: "56px clamp(24px,5vw,72px)", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", justifyContent: "space-between", boxShadow: "0 16px 48px rgba(15,32,68,.22)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,36px)", color: "white", marginBottom: 10, lineHeight: 1.2 }}>
            {isHi ? "आज ही पढ़ना शुरू करें?" : "Ready to Start Learning?"}
          </h2>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 15, maxWidth: 420, lineHeight: 1.72 }}>
            {isHi ? "कोई सदस्यता नहीं। कोई sign-up fee नहीं। बस अपना role चुनें और शुरू करें।" : "No subscription. No sign-up fee. Just pick your role and get started."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <button onClick={onStudent} style={{ background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(232,101,10,.4)", transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform="none"}>
            🎒 {isHi ? "छात्र →" : "Student →"}
          </button>
          <button onClick={onTeacher} style={{ background: "rgba(255,255,255,.1)", color: "white", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "14px 28px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all .2s", backdropFilter: "blur(8px)" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.2)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.1)"}>
            👩‍🏫 {isHi ? "शिक्षक →" : "Teacher →"}
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ margin: "64px 0 0", padding: "24px clamp(20px,5vw,72px)", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎓</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink2)" }}>Shiksha AI</span>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--ink3)" }}>Built with ❤️ for rural India · © 2025</span>
        <span style={{ fontSize: 12, color: "var(--ink3)" }}>{isHi ? "कोई विज्ञापन नहीं · कोई subscription नहीं" : "No ads · No subscription"}</span>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  TEACHER AUTH — login / signup
// ════════════════════════════════════════════════════════
function TeacherAuth({ onBack, onEnter, lang }) {
  const isHi = lang === "hi";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [err, setErr] = useState("");

  const handleLogin = () => {
    setErr("");
    const teachers = getTeachers();
    const found = teachers.find(t => t.username === form.username && t.password === form.password);
    if (!found) { setErr(isHi ? "गलत यूज़रनेम या पासवर्ड।" : "Incorrect username or password."); return; }
    LS.set("shiksha_admin_session", { username: found.username, time: Date.now() });
    onEnter(found);
  };

  const handleSignup = () => {
    setErr("");
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setErr(isHi ? "सभी फ़ील्ड भरें।" : "Please fill all fields."); return;
    }
    if (form.password.length < 6) {
      setErr(isHi ? "पासवर्ड कम से कम 6 अक्षर का हो।" : "Password must be at least 6 characters."); return;
    }
    const teachers = getTeachers();
    if (teachers.find(t => t.username === form.username)) {
      setErr(isHi ? "यह username पहले से मौजूद है।" : "Username already taken."); return;
    }
    const newTeacher = { id: Date.now(), name: form.name.trim(), username: form.username.trim(), password: form.password, isRoot: false };
    saveTeachers([...teachers, newTeacher]);
    LS.set("shiksha_admin_session", { username: form.username.trim(), time: Date.now() });
    onEnter(newTeacher);
  };

  const inp = { width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 13px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)", color: "var(--ink)", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-ui)", padding: 24 }}>
      <style>{G}</style>
      <div style={{ background: "var(--white)", borderRadius: 20, padding: "40px 36px", maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.1)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👩‍🏫</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)" }}>{isHi ? "शिक्षक पोर्टल" : "Teacher Portal"}</div>
            <div style={{ fontSize: 12, color: "var(--ink3)" }}>Shiksha AI</div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "var(--paper)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, background: mode === m ? "var(--white)" : "transparent", border: "none", borderRadius: 8, padding: "8px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, color: mode === m ? "var(--navy)" : "var(--ink3)", cursor: "pointer", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .18s" }}>
              {m === "login" ? (isHi ? "लॉगिन" : "Login") : (isHi ? "साइनअप" : "Sign Up")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "पूरा नाम" : "Full Name"}</label>
              <input style={inp} placeholder={isHi ? "शिक्षक का नाम" : "Your name"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "यूज़रनेम" : "Username"}</label>
            <input style={inp} placeholder="username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "पासवर्ड" : "Password"}</label>
            <input type="password" style={inp} placeholder="••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
              onFocus={e => e.target.style.borderColor = "var(--navy)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
        </div>

        {mode === "login" && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--paper)", borderRadius: 8, fontSize: 12, color: "var(--ink3)" }}>
            💡 {isHi ? "डिफ़ॉल्ट: admin / shiksha123" : "Default credentials: admin / shiksha123"}
          </div>
        )}

        {err && <div style={{ marginTop: 12, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#b91c1c" }}>{err}</div>}

        <button onClick={mode === "login" ? handleLogin : handleSignup} style={{ marginTop: 18, width: "100%", background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 10, padding: "12px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 3px 12px rgba(15,32,68,.28)" }}>
          {mode === "login" ? (isHi ? "लॉगिन →" : "Login →") : (isHi ? "अकाउंट बनाएं →" : "Create Account →")}
        </button>
        <button onClick={onBack} style={{ marginTop: 10, width: "100%", background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-ui)", padding: "6px" }}>← {isHi ? "वापस" : "Back"}</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  STUDENT AUTH
// ════════════════════════════════════════════════════════
function StudentAuth({ onBack, onEnter, lang }) {
  const isHi = lang === "hi";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", username: "", password: "", cls: "10" });
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = () => {
    setErr("");
    const students = getStudents();
    const found = students.find(s => s.username === form.username && s.password === form.password);
    if (!found) { setErr(isHi ? "गलत यूज़रनेम या पासवर्ड।" : "Incorrect username or password."); return; }
    if (found.status === "pending") { setPending(true); return; }
    if (found.status === "rejected") { setErr(isHi ? "Request अस्वीकार हुई। अपने शिक्षक से बात करें।" : "Your request was rejected. Contact your teacher."); return; }
    LS.set("shiksha_student_session", { id: found.id, username: found.username, name: found.name, cls: found.cls });
    onEnter(found);
  };

  const handleSignup = () => {
    setErr("");
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setErr(isHi ? "सभी फ़ील्ड भरें।" : "Please fill all fields."); return;
    }
    const students = getStudents();
    if (students.find(s => s.username === form.username)) {
      setErr(isHi ? "यह username पहले से मौजूद है।" : "Username already taken."); return;
    }
    const newStudent = { id: Date.now(), name: form.name.trim(), username: form.username.trim(), password: form.password, cls: form.cls, status: "pending", joinedAt: new Date().toISOString() };
    saveStudents([...students, newStudent]);
    setPending(true);
  };

  if (pending) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-ui)", padding: 24 }}>
      <style>{G}</style>
      <div style={{ background: "var(--white)", borderRadius: 20, padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,.1)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--navy)", marginBottom: 12 }}>{isHi ? "मंज़ूरी का इंतज़ार" : "Awaiting Approval"}</h2>
        <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 28 }}>
          {isHi ? "आपकी request शिक्षक को भेज दी गई है। मंज़ूरी मिलने के बाद लॉगिन करें।" : "Your request has been sent to your teacher. Log in once they approve you."}
        </p>
        <button onClick={onBack} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 22px", fontSize: 13, cursor: "pointer", color: "var(--ink2)", fontFamily: "var(--font-ui)" }}>← {isHi ? "वापस" : "Go Back"}</button>
      </div>
    </div>
  );

  const inp = { width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 13px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)", color: "var(--ink)", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-ui)", padding: 24 }}>
      <style>{G}</style>
      <div style={{ background: "var(--white)", borderRadius: 20, padding: "40px 36px", maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.1)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎒</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)" }}>{isHi ? "छात्र पोर्टल" : "Student Portal"}</div>
            <div style={{ fontSize: 12, color: "var(--ink3)" }}>Shiksha AI</div>
          </div>
        </div>
        <div style={{ display: "flex", background: "var(--paper)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, background: mode === m ? "var(--white)" : "transparent", border: "none", borderRadius: 8, padding: "8px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, color: mode === m ? "var(--navy)" : "var(--ink3)", cursor: "pointer", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .18s" }}>
              {m === "login" ? (isHi ? "लॉगिन" : "Login") : (isHi ? "साइनअप" : "Sign Up")}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "पूरा नाम" : "Full Name"}</label>
              <input style={inp} placeholder={isHi ? "आपका नाम" : "Your name"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onFocus={e => e.target.style.borderColor = "var(--saffron)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "यूज़रनेम" : "Username"}</label>
            <input style={inp} placeholder="username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onFocus={e => e.target.style.borderColor = "var(--saffron)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "पासवर्ड" : "Password"}</label>
            <input type="password" style={inp} placeholder="••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
              onFocus={e => e.target.style.borderColor = "var(--saffron)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{isHi ? "कक्षा" : "Class"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.cls} onChange={e => setForm(f => ({ ...f, cls: e.target.value }))}>
                {CLASSES.map(c => <option key={c} value={c}>{isHi ? `कक्षा ${c}` : `Class ${c}`}</option>)}
              </select>
            </div>
          )}
        </div>
        {err && <div style={{ marginTop: 12, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#b91c1c" }}>{err}</div>}
        <button onClick={mode === "login" ? handleLogin : handleSignup} style={{ marginTop: 18, width: "100%", background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", color: "white", border: "none", borderRadius: 10, padding: "12px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 3px 12px rgba(232,101,10,.3)" }}>
          {mode === "login" ? (isHi ? "लॉगिन →" : "Login →") : (isHi ? "Request भेजें →" : "Send Request →")}
        </button>
        <button onClick={onBack} style={{ marginTop: 10, width: "100%", background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-ui)", padding: "6px" }}>← {isHi ? "वापस" : "Back"}</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  STUDENT HOME — Q&A or View PDFs choice
// ════════════════════════════════════════════════════════
function StudentHome({ student, lang, setLang, onQA, onPDFs, onLogout }) {
  const isHi = lang === "hi";
  const books = LS.get("shiksha_books", []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "var(--font-ui)" }}>
      <style>{G}</style>
      <nav style={{ padding: "0 clamp(20px,5vw,56px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--white)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: 17, background: "linear-gradient(90deg,var(--navy),var(--navy2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Shiksha AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: "var(--ink2)", fontWeight: 500 }}>👤 {student.name}</span>
          <button onClick={() => setLang(isHi ? "en" : "hi")} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 7, padding: "5px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--ink2)", cursor: "pointer" }}>{isHi ? "English" : "हिंदी"}</button>
          <button onClick={onLogout} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 12px", fontSize: 12.5, color: "var(--ink3)", cursor: "pointer" }}>{isHi ? "लॉगआउट" : "Logout"}</button>
        </div>
      </nav>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 40px", textAlign: "left" }}>
        <div style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 500, marginBottom: 6 }}>{isHi ? "नमस्ते," : "Hello,"}</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px,4vw,42px)", color: "var(--navy)", marginBottom: 8, lineHeight: 1.1 }}>{student.name} 👋</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink3)", marginBottom: 48, lineHeight: 1.6 }}>{isHi ? `कक्षा ${student.cls} · Shiksha AI पर आपका स्वागत है` : `Class ${student.cls} · Welcome back to Shiksha AI`}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div onClick={onQA} style={{ background: "var(--white)", border: "2px solid var(--border)", borderRadius: 18, padding: "28px 22px", cursor: "pointer", transition: "all .22s", boxShadow: "0 2px 12px rgba(0,0,0,.05)", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--saffron)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(232,101,10,.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🤖</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)", marginBottom: 6 }}>{isHi ? "प्रश्न पूछें" : "Ask Questions"}</div>
            <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{isHi ? "AI ट्यूटर से NCERT-आधारित उत्तर पाएं।" : "AI-powered NCERT-based answers."}</div>
          </div>
          <div onClick={onPDFs} style={{ background: "var(--white)", border: "2px solid var(--border)", borderRadius: 18, padding: "28px 22px", cursor: "pointer", transition: "all .22s", boxShadow: "0 2px 12px rgba(0,0,0,.05)", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(15,32,68,.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>📚</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)", marginBottom: 6 }}>{isHi ? "PDF देखें" : "View PDFs"}</div>
            <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{isHi ? `${books.length} पाठ्यपुस्तक उपलब्ध।` : `${books.length} textbook${books.length !== 1 ? "s" : ""} available.`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  STUDENT PDF LIBRARY
// ════════════════════════════════════════════════════════
function StudentPDFLibrary({ student, lang, onBack }) {
  const isHi = lang === "hi";
  const books = LS.get("shiksha_books", []);
  const [viewBook, setViewBook] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", fontFamily: "var(--font-ui)" }}>
      <style>{G}</style>
      {viewBook && <BookViewer book={viewBook} onClose={() => setViewBook(null)} />}
      <nav style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "0 clamp(16px,4vw,32px)", height: 58, display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← {isHi ? "वापस" : "Back"}</button>
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--navy)" }}>📚 {isHi ? "पाठ्यपुस्तकें" : "Textbook Library"}</span>
      </nav>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px clamp(16px,4vw,28px)" }}>
        {books.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--ink3)" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{isHi ? "अभी कोई PDF नहीं" : "No PDFs available yet"}</div>
            <div style={{ fontSize: 13.5 }}>{isHi ? "शिक्षक जल्द ही PDF अपलोड करेंगे।" : "Your teacher will upload textbooks soon."}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
            {books.map(b => (
              <div key={b.id} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📘</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 8 }}>{b.title}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <Badge color="navy">Class {b.cls}</Badge>
                  <Badge color="orange">{b.subject}</Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>{b.chapters} {isHi ? "अध्याय" : "chapter(s)"} · {b.uploaded}</div>
                <button onClick={() => setViewBook(b)} style={{ width: "100%", background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 9, padding: "9px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {isHi ? "पढ़ें →" : "View →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function LandingPage({ onStart, lang, setLang, onAdmin }) {
  const t = TR[lang];
  const [scrolled, setScrolled] = useState(false);
  const isHi = lang === "hi";
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", overflowX: "hidden" }} className={isHi ? "deva" : ""}>
      <style>{G}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: scrolled ? "rgba(255,253,247,.94)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all .3s ease", padding: "0 clamp(20px,5vw,64px)", height: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, background: "linear-gradient(135deg,var(--navy),var(--navy2))",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 2px 8px rgba(15,32,68,.3)"
          }}>🎓</div>
          <span style={{
            fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 19,
            background: "linear-gradient(90deg,var(--navy),var(--navy2))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>{t.brand}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setLang(isHi ? "en" : "hi")} style={{
            background: "none", border: "1px solid var(--border2)",
            borderRadius: 8, padding: "6px 14px", fontFamily: "var(--font-ui)", fontWeight: 600,
            fontSize: 13, color: "var(--ink2)", cursor: "pointer"
          }}>{t.langToggle}</button>
          <button onClick={onAdmin} style={{
            background: "none", border: "none", color: "var(--ink3)",
            cursor: "pointer", fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 500
          }}>{t.adminBtn}</button>
          <button onClick={onStart} style={{
            background: "var(--navy)", color: "white", border: "none",
            borderRadius: 9, padding: "8px 20px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5,
            cursor: "pointer", boxShadow: "0 2px 10px rgba(15,32,68,.25)", transition: "transform .2s"
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >{t.startBtn} →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: "clamp(70px,10vh,110px) clamp(20px,5vw,64px) 80px", maxWidth: 1180, margin: "0 auto",
        display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "clamp(32px,6vw,72px)", alignItems: "center"
      }}>
        <div style={{ textAlign: "left" }}>
          <div className="fu" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg,#fff2e8,#ffecd8)", border: "1px solid #f9c99a",
            borderRadius: 30, padding: "5px 16px", fontSize: 12, fontWeight: 700,
            color: "var(--saffron)", marginBottom: 24, letterSpacing: ".05em"
          }}>🇮🇳 {t.tagline}</div>
          <h1 className="fu1" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.08, color: "var(--navy)", marginBottom: 22 }}>
            {t.heroLine1}<br />
            <span style={{ background: "linear-gradient(90deg,var(--saffron),var(--saffron2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.heroLine2}</span>
          </h1>
          <p className="fu2" style={{ fontSize: 16, color: "var(--ink2)", lineHeight: 1.78, marginBottom: 36, maxWidth: 480 }}>{t.heroSub}</p>
          <div className="fu3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onStart} style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 11, padding: "14px 30px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(15,32,68,.32)", transition: "all .25s", display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,32,68,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,32,68,.32)"; }}
            >📚 {t.startBtn}</button>
            <button onClick={onAdmin} style={{ background: "none", border: "1.5px solid var(--border2)", borderRadius: 11, padding: "14px 24px", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 15, color: "var(--ink2)", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.color = "var(--navy)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--ink2)"; }}
            >⚙️ {t.adminBtn}</button>
          </div>
          <div className="fu4" style={{ display: "flex", gap: 28, marginTop: 44, flexWrap: "wrap", paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            {t.stats.map(([n, l], i) => (
              <div key={i}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 25, color: "var(--navy)", fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 1, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="fu2" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(15,32,68,.12),0 4px 12px rgba(15,32,68,.06)" }}>
          <div style={{ background: "linear-gradient(135deg,var(--navy) 0%,var(--navy2) 100%)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>🎓</div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 13.5 }}>{t.brand}</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>{isHi ? "कक्षा 11 · भौतिकी" : "Class 11 · Physics"}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{t.aiReady}</span>
            </div>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--navy)", color: "white", borderRadius: "14px 14px 3px 14px", padding: "10px 14px", fontSize: 13.5, fontWeight: 500, alignSelf: "flex-end", maxWidth: "82%" }}>
              {isHi ? "Newton के द्वितीय नियम को समझाएं" : "Explain Newton's Second Law"}
            </div>
            <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "3px 14px 14px 14px", padding: "14px 16px", alignSelf: "flex-start", borderLeft: "3px solid var(--saffron)" }}>
              <div className="ans-wrap" style={{ fontSize: 13 }}>
                <p><strong>{isHi ? "Newton का द्वितीय नियम" : "Newton's 2nd Law"}</strong>: {isHi ? "बल = द्रव्यमान × त्वरण।" : "Force = mass × acceleration."}</p>
                <div className="formula-wrap" style={{ fontSize: 13, padding: "9px 13px", margin: "8px 0" }}><div className="formula-label" style={{ fontSize: 9 }}>Formula</div>F = m × a</div>
                <ul className="ul-list" style={{ margin: "6px 0" }}>
                  <li><span className="bullet">◆</span><span><strong>F</strong> = {isHi ? "बल (N)" : "Force (N)"}</span></li>
                  <li><span className="bullet">◆</span><span><strong>m</strong> = {isHi ? "द्रव्यमान (kg)" : "Mass (kg)"}</span></li>
                  <li><span className="bullet">◆</span><span><strong>a</strong> = {isHi ? "त्वरण (m/s²)" : "Acceleration (m/s²)"}</span></li>
                </ul>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, color: "#92400e", fontWeight: 600 }}>
              📖 {isHi ? "अध्याय 4: गति के नियम" : "Chapter 4: Laws of Motion"}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section style={{ background: "var(--paper)", padding: "80px clamp(20px,5vw,64px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#fee2e2", color: "#b91c1c", borderRadius: 30, padding: "4px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", marginBottom: 14 }}>{t.problemLabel}</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,40px)", color: "var(--navy)" }}>{t.problemTitle}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18, marginBottom: 72 }}>
            {t.problems.map((p, i) => (
              <div key={i} style={{ background: "var(--white)", borderRadius: 16, padding: "26px 24px", border: "1px solid #f1c8c8", boxShadow: "0 2px 12px rgba(220,38,38,.05)" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 8, color: "var(--ink)" }}>{p.title}</div>
                <div style={{ color: "var(--ink2)", fontSize: 13.5, lineHeight: 1.72 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#dcfce7", color: "#15803d", borderRadius: 30, padding: "4px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", marginBottom: 14 }}>{t.solutionLabel}</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,40px)", color: "var(--navy)" }}>{t.solutionTitle}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18 }}>
            {t.solutions.map((s, i) => (
              <div key={i} style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", borderRadius: 16, padding: "26px 24px", color: "white", boxShadow: "0 4px 20px rgba(15,32,68,.2)" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: "rgba(255,255,255,.68)", fontSize: 13.5, lineHeight: 1.72 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px clamp(20px,5vw,64px)", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-block", background: "#ffedd5", color: "var(--saffron)", borderRadius: 30, padding: "4px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", marginBottom: 14 }}>{t.featLabel}</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,40px)", color: "var(--navy)" }}>{t.featTitle}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ background: "var(--white)", borderRadius: 14, padding: "22px 18px", border: "1px solid var(--border)", transition: "all .2s", textAlign: "center", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--saffron)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,32,68,.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{f.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section style={{ padding: "0 clamp(20px,5vw,64px) 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#dde8ff", color: "var(--navy)", borderRadius: 30, padding: "4px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", marginBottom: 14 }}>{t.pipelineLabel}</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,38px)", color: "var(--navy)", marginBottom: 48 }}>{t.pipelineTitle}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" }}>
          {t.pipeline.map((item, i) =>
            item === null
              ? <div key={i} style={{ color: "var(--ink3)", fontSize: 20, fontWeight: 300 }}>→</div>
              : <div key={i} style={{ background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "18px 22px", textAlign: "center", minWidth: 110, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--saffron)", letterSpacing: ".08em", marginBottom: 4 }}>STEP {item.n}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink2)", fontWeight: 500 }}>{item.l}</div>
              </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ margin: "0 clamp(20px,5vw,64px) 80px", background: "linear-gradient(135deg,var(--navy) 0%,#1a3a6e 100%)", borderRadius: 24, padding: "60px clamp(24px,5vw,72px)", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", justifyContent: "space-between", boxShadow: "0 16px 48px rgba(15,32,68,.22)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,3vw,36px)", color: "white", marginBottom: 10 }}>{t.ctaTitle}</h2>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 15, maxWidth: 400, lineHeight: 1.72 }}>{t.ctaSub}</p>
        </div>
        <button onClick={onStart} style={{ background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", color: "white", border: "none", borderRadius: 12, padding: "15px 36px", fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(232,101,10,.4)", transition: "all .2s", flexShrink: 0, animation: "borderGlow 2.5s infinite" }}>📚 {t.startBtn}</button>
      </section>

      <footer style={{ background: "var(--navy)", padding: "22px clamp(20px,5vw,64px)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-ui)", color: "rgba(255,255,255,.9)", fontWeight: 800, fontSize: 16 }}>🎓 {t.brand}</span>
        <span style={{ color: "rgba(255,255,255,.35)", fontSize: 12 }}>{t.footerBy}</span>
        <button onClick={onAdmin} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 12 }}>{t.adminBtn}</button>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  STUDENT DASHBOARD
// ════════════════════════════════════════════════════════
function StudentDashboard({ lang, setLang, onBack }) {
  const t = TR[lang];
  const isHi = lang === "hi";
  const [cls, setCls] = useState("11");
  const [subject, setSubject] = useState("Physics");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => LS.get("shiksha_history", []));
  const [toast, setToast] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const chatEndRef = useRef(null);
  const cache = useRef({});

  // FIX 1+2: Welcome message re-generates whenever cls, subject, OR lang changes
  useEffect(() => {
    setMessages([{ role: "assistant", text: t.welcomeMsg(cls, subject), chapter: null }]);
  }, [cls, subject, lang]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = useCallback(async () => {
    if (!query.trim() || loading) return;
    const q = query.trim(); setQuery(""); setLoading(true);
    setMessages(m => [...m, { role: "user", text: q }]);

    const key = `${cls}-${subject}-${lang}-${q.toLowerCase().replace(/\s+/g, "")}`;
    if (cache.current[key]) {
      await new Promise(r => setTimeout(r, 350));
      setMessages(m => [...m, { ...cache.current[key], cached: true }]);
      setLoading(false); return;
    }

    // ── Keyword error messages ──────────────────────────────
    const errMsg = (type) => {
      const msgs = {
        offline:  isHi ? "⚡ Backend offline — terminal mein `node server.js` chalayein" : "⚡ Backend offline — run `node server.js` in terminal",
        http:     isHi ? "🔴 Server error — OpenAI key check karein ya server restart karein" : "🔴 Server error — check OpenAI key or restart server",
        empty:    isHi ? "⚠️ Empty response — server se koi jawab nahi aaya" : "⚠️ No response — server returned empty answer",
        unknown:  isHi ? "❌ Unknown error — console check karein" : "❌ Unknown error — check browser console",
      };
      return msgs[type] || msgs.unknown;
    };

    try {
      let resp;
      try {
        resp = await fetch("http://localhost:5000/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, cls, subject, lang }),
        });
      } catch {
        setMessages(m => [...m, { role: "assistant", text: errMsg("offline"), chapter: `Class ${cls} ${subject}`, error: true }]);
        setToast({ message: errMsg("offline"), type: "error" });
        setLoading(false); return;
      }

      if (!resp.ok) {
        setMessages(m => [...m, { role: "assistant", text: errMsg("http"), chapter: `Class ${cls} ${subject}`, error: true }]);
        setToast({ message: `HTTP ${resp.status} — ${errMsg("http")}`, type: "error" });
        setLoading(false); return;
      }

      const data = await resp.json();
      const raw = (data.answer || "").trim();

      if (!raw) {
        setMessages(m => [...m, { role: "assistant", text: errMsg("empty"), chapter: `Class ${cls} ${subject}`, error: true }]);
        setLoading(false); return;
      }

      const chapM = raw.match(/Chapter reference:\s*(.+)/i);
      const chapter = chapM ? chapM[1].trim() : `Class ${cls} ${subject}`;
      const clean = raw.replace(/---\s*\nChapter reference:.+/im, "").replace(/Chapter reference:.+/gi, "").trim();

      const msg = { role: "assistant", text: clean, chapter };
      cache.current[key] = msg;

      const newH = [{ q, subject, cls, chapter, time: new Date().toLocaleTimeString() }, ...history.slice(0, 29)];
      setHistory(newH);
      LS.set("shiksha_history", newH);
      setMessages(m => [...m, msg]);

    } catch (err) {
      setMessages(m => [...m, { role: "assistant", text: errMsg("unknown"), chapter: `Class ${cls} ${subject}`, error: true }]);
      setToast({ message: errMsg("unknown"), type: "error" });
    }

    setLoading(false);
  }, [query, loading, cls, subject, lang, isHi, history, t]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // FIX 2: Suggestions are fully dynamic — respond to lang + subject
  const suggestions = (SUGGESTIONS[lang][subject] || SUGGESTIONS[lang].default);

  const subjectList = SUBJECTS_FIXED[cls] || SUBJECTS_FIXED["10"];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--paper)", fontFamily: "var(--font-ui)" }} className={isHi ? "deva" : ""}>
      <style>{G}</style>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* SIDEBAR */}
      <div style={{ width: sideOpen ? 285 : 0, minWidth: 0, background: "var(--navy)", overflow: "hidden", transition: "width .32s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 3 }}>📋 {t.historyTitle}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)" }}>{history.length} {isHi ? "प्रश्न" : "questions"}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {history.length === 0
            ? <div style={{ padding: "24px 16px", textAlign: "center", color: "rgba(255,255,255,.25)", fontSize: 13 }}>{t.historyEmpty}</div>
            : history.map((h, i) => (
              <div key={i} onClick={() => { setQuery(h.q); setSideOpen(false); }}
                style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.85)", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.q}</div>
                <div style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                  <span style={{ background: "rgba(232,101,10,.25)", color: "#ffb380", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{isHi ? "क्षा" : "Cl."}{h.cls}</span>
                  <span style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.55)", borderRadius: 4, padding: "1px 7px", fontSize: 10 }}>{h.subject}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>{h.time}</div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* TOP BAR */}
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "0 16px", height: 57, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setSideOpen(o => !o)} style={{ background: sideOpen ? "var(--navy)" : "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 15, color: sideOpen ? "white" : "var(--ink2)", transition: "all .2s" }}>☰</button>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink3)", fontSize: 12.5, fontWeight: 500 }}>{t.backBtn}</button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>🎓 {t.brand}</span>
          </div>
          <button onClick={() => setLang(isHi ? "en" : "hi")} style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "var(--ink2)", cursor: "pointer" }}>{t.langToggle}</button>
        </div>

        {/* SELECTOR BAR */}
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 9, padding: "0 4px 0 12px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", letterSpacing: ".03em", textTransform: "uppercase" }}>{t.classLabel}</span>
            <select value={cls} onChange={e => { setCls(e.target.value); setSubject(SUBJECTS_FIXED[e.target.value][0]); }}
              style={{ border: "none", background: "transparent", padding: "8px 4px 8px 6px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, color: "var(--navy)", cursor: "pointer", outline: "none" }}>
              {CLASSES.map(c => <option key={c} value={c}>{isHi ? `कक्षा ${c}` : `Class ${c}`}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 9, padding: "0 4px 0 12px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", letterSpacing: ".03em", textTransform: "uppercase" }}>{t.subjectLabel}</span>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ border: "none", background: "transparent", padding: "8px 4px 8px 6px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, color: "var(--navy)", cursor: "pointer", outline: "none" }}>
              {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--jade)", animation: "pulse2 2s infinite" }} />
            <span style={{ fontSize: 11.5, color: "var(--ink3)", fontWeight: 500 }}>{t.aiReady}</span>
          </div>
        </div>

        {/* CHAT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row", animation: "msgIn .35s ease both" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: m.role === "user" ? "linear-gradient(135deg,var(--navy),var(--navy2))" : "linear-gradient(135deg,var(--saffron),var(--saffron2))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,.14)"
                }}>
                  {m.role === "user" ? "👤" : "🎓"}
                </div>
                <div style={{ maxWidth: "calc(100% - 50px)", display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.role === "user"
                    ? <div style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", borderRadius: "14px 14px 3px 14px", padding: "11px 16px", fontSize: 14, fontWeight: 500, lineHeight: 1.6, boxShadow: "0 2px 10px rgba(15,32,68,.2)" }}>{m.text}</div>
                    : <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "3px 14px 14px 14px", padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,.06)", borderLeft: m.error ? "3px solid #ef4444" : "3px solid var(--saffron)", textAlign: "left" }}>
                      <AnswerRenderer text={m.text} isHindi={isHi} />
                    </div>
                  }
                  {m.role === "assistant" && m.chapter && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "5px 11px", fontSize: 12, color: "#92400e", fontWeight: 600, alignSelf: "flex-start" }}>
                      📖 {m.chapter}
                      {m.cached && <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{t.cached}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, animation: "msgIn .3s ease" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
                <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "3px 14px 14px 14px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,.06)", borderLeft: "3px solid var(--saffron)" }}>
                  {[0, .16, .32].map((d, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--saffron)", animation: `dot 1.2s ${d}s infinite` }} />)}
                  <span style={{ fontSize: 12, color: "var(--ink3)", marginLeft: 7, fontWeight: 500 }}>{t.sending}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* SUGGESTIONS — only show on first message */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{t.tryAsking}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {suggestions.map((q, i) => (
                  <button key={i} onClick={() => setQuery(q)} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "var(--navy)", fontFamily: "var(--font-ui)", fontWeight: 500, transition: "all .2s", lineHeight: 1.4 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--saffron)"; e.currentTarget.style.background = "var(--cream)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--white)"; }}
                  >{q}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INPUT */}
        <div style={{ background: "var(--white)", borderTop: "1px solid var(--border)", padding: "12px 16px", flexShrink: 0 }}>
          <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 10 }}>
            <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
              placeholder={t.inputPlaceholder} rows={1}
              className={isHi ? "deva" : ""}
              style={{ flex: 1, border: "1.5px solid var(--border)", borderRadius: 11, padding: "10px 16px", fontSize: 14, resize: "none", outline: "none", fontFamily: isHi ? "var(--font-deva)" : "var(--font-ui)", lineHeight: 1.6, maxHeight: 130, overflowY: "auto", background: "var(--paper)", transition: "border-color .2s", color: "var(--ink)" }}
              onFocus={e => e.target.style.borderColor = "var(--saffron)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <button onClick={send} disabled={loading || !query.trim()} style={{ background: loading || !query.trim() ? "var(--border)" : "linear-gradient(135deg,var(--navy),var(--navy2))", color: loading || !query.trim() ? "var(--ink3)" : "white", border: "none", borderRadius: 11, padding: "10px 22px", cursor: loading || !query.trim() ? "default" : "pointer", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14, transition: "all .2s", display: "flex", alignItems: "center", gap: 7, boxShadow: loading || !query.trim() ? "none" : "0 2px 10px rgba(15,32,68,.25)" }}>
              {loading ? <Spinner /> : t.sendBtn}
            </button>
          </div>
          <div style={{ maxWidth: 780, margin: "5px auto 0", fontSize: 11, color: "var(--ink3)", textAlign: "center" }}>{t.footerHint}</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ADMIN PANEL — with persistent auth, storage, book viewer
// ════════════════════════════════════════════════════════
function AdminPanel({ onBack }) {
  const [lang] = useState(LS.get("shiksha_lang", "en"));
  const t = TR[lang];

  // FIX 3: Persistent admin credentials stored in localStorage
  const [admins, setAdmins] = useState(() => LS.get("shiksha_admins", [{ id: "root", username: "admin", password: "shiksha123", isRoot: true }]));
  const [loggedIn, setLoggedIn] = useState(true);
  const [form, setForm] = useState({ user: "", pass: "" });
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("students");
  // FIX 4: Books persisted in localStorage
  const [books, setBooks] = useState(() => LS.get("shiksha_books", [
  ]));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [drag, setDrag] = useState(false);
  const [nb, setNb] = useState({ cls: "10", subject: "Science" });
  const [viewBook, setViewBook] = useState(null); // FIX 5: Book viewer
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const fileRef = useRef();

  // Persist books whenever they change
  const updateBooks = (newBooks) => { setBooks(newBooks); LS.set("shiksha_books", newBooks); };
  // Persist admins
  const updateAdmins = (newAdmins) => { setAdmins(newAdmins); LS.set("shiksha_admins", newAdmins); };

  const doLogin = () => {
    const found = admins.find(a => a.username === form.user && a.password === form.pass);
    if (found) { setLoggedIn(true); LS.set("shiksha_admin_session", { username: found.username, time: Date.now() }); setErr(""); }
    else setErr(t.credentialError + " (admin / shiksha123)");
  };

  const doLogout = () => { setLoggedIn(false); LS.del("shiksha_admin_session"); };

  const simulateUpload = (name, pdfDataUrl = null) => {
    setUploading(true); setProgress(0);
    // Read chapter library for this class+subject
    const chapKey = `${nb.cls}:${nb.subject}`;
    const chapLib = LS.get("shiksha_chaplib", {});
    const definedChaps = chapLib[chapKey] || [];
    const chFromNum = nb.chFrom || (definedChaps[0]?.num || "1");
    const chToNum = nb.chTo || (definedChaps[definedChaps.length - 1]?.num || "1");
    const coveredChaps = definedChaps.filter(c => Number(c.num) >= Number(chFromNum) && Number(c.num) <= Number(chToNum));
    const numChapters = Math.max(1, coveredChaps.length || (Number(chToNum) - Number(chFromNum) + 1));
    const iv = setInterval(() => setProgress(p => {
      if (p >= 100) {
        clearInterval(iv); setUploading(false);
        const entry = {
          id: Date.now(),
          title: `Class ${nb.cls} ${nb.subject}`,
          cls: nb.cls, subject: nb.subject,
          chapters: numChapters,
          chFrom: chFromNum, chTo: chToNum,
          coveredChaps: coveredChaps,
          size: pdfDataUrl ? `${(pdfDataUrl.length / 1e6).toFixed(1)} MB` : `${(Math.random() * 4 + 1).toFixed(1)} MB`,
          uploaded: new Date().toISOString().slice(0, 10),
          pdfDataUrl: pdfDataUrl,
        };
        updateBooks([entry, ...books]);
        setToast({ message: `"${name}" saved! ${numChapters} chapter(s) added.`, type: "success" });
        setNb(x => ({ ...x, chFrom: "", chTo: "" }));
        return 100;
      }
      return p + Math.random() * 14;
    }), 220);
  };

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (!f) return;
    if (f.type === "application/pdf") {
      // Read PDF as data URL so we can display it
      const reader = new FileReader();
      reader.onload = (ev) => simulateUpload(f.name, ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setToast({ message: "Please upload a PDF file.", type: "error" });
    }
  };

  const addAdmin = () => {
    if (!newAdmin.username.trim() || !newAdmin.password.trim()) { setToast({ message: "Username and password required.", type: "error" }); return; }
    if (admins.find(a => a.username === newAdmin.username)) { setToast({ message: "Username already exists.", type: "error" }); return; }
    updateAdmins([...admins, { id: Date.now(), username: newAdmin.username, password: newAdmin.password, isRoot: false }]);
    setNewAdmin({ username: "", password: "" }); setAddingAdmin(false);
    setToast({ message: `Admin "${newAdmin.username}" added successfully.`, type: "success" });
  };

  const removeAdmin = (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    updateAdmins(admins.filter(a => a.id !== id));
    setToast({ message: "Admin removed.", type: "info" });
  };

  const session = LS.get("shiksha_admin_session", null);
  const stats = [
    { icon: "📚", v: books.length, l: t.statsLabels[0] },
    { icon: "🏫", v: [...new Set(books.map(b => b.cls))].length, l: t.statsLabels[1] },
    { icon: "📖", v: books.reduce((a, b) => a + b.chapters, 0), l: t.statsLabels[2] },
    { icon: "⚡", v: "72%", l: t.statsLabels[3] },
  ];

  // Auth screen — Login + Sign Up tabs
  const [authTab, setAuthTab] = useState("login");
  const [signupForm, setSignupForm] = useState({ user: "", pass: "", confirm: "" });
  const [signupErr, setSignupErr] = useState("");
  const [signupOk, setSignupOk] = useState(false);

  const doSignup = () => {
    setSignupErr("");
    if (!signupForm.user.trim()) { setSignupErr("Username is required."); return; }
    if (signupForm.pass.length < 6) { setSignupErr("Password must be at least 6 characters."); return; }
    if (signupForm.pass !== signupForm.confirm) { setSignupErr("Passwords do not match."); return; }
    if (admins.find(a => a.username === signupForm.user.trim())) { setSignupErr("Username already taken. Please choose another."); return; }
    updateAdmins([...admins, { id: Date.now(), username: signupForm.user.trim(), password: signupForm.pass, isRoot: false }]);
    setSignupOk(true);
    setTimeout(() => { setSignupOk(false); setAuthTab("login"); setForm({ user: signupForm.user.trim(), pass: "" }); setSignupForm({ user: "", pass: "", confirm: "" }); }, 1800);
  };

  if (!loggedIn) return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-ui)" }}>
      <style>{G}</style>
      <div style={{ background: "var(--white)", borderRadius: 20, padding: "36px 36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "linear-gradient(135deg,var(--navy),var(--navy2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px", boxShadow: "0 4px 16px rgba(15,32,68,.3)" }}>🔐</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 23, color: "var(--navy)" }}>Admin Portal</div>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 4 }}>Shiksha AI Management</div>
        </div>

        {/* Login / Sign Up tabs */}
        <div style={{ display: "flex", background: "var(--paper)", borderRadius: 10, padding: 3, marginBottom: 24, border: "1px solid var(--border)" }}>
          {[{ id: "login", l: "🔑 Login" }, { id: "signup", l: "✨ Sign Up" }].map(tb => (
            <button key={tb.id} onClick={() => { setAuthTab(tb.id); setErr(""); setSignupErr(""); setSignupOk(false); }}
              style={{
                flex: 1, background: authTab === tb.id ? "linear-gradient(135deg,var(--navy),var(--navy2))" : "none",
                color: authTab === tb.id ? "white" : "var(--ink3)", border: "none", borderRadius: 8,
                padding: "9px 0", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", transition: "all .2s"
              }}>
              {tb.l}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {authTab === "login" && (
          <div>
            {err && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{err}</div>}
            {[{ l: "Username", k: "user", tp: "text", ph: "admin" }, { l: "Password", k: "pass", tp: "password", ph: "••••••••" }].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>{f.l}</label>
                <input type={f.tp} placeholder={f.ph} value={form[f.k]}
                  onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", transition: "border-color .2s", background: "var(--paper)" }}
                  onFocus={e => e.target.style.borderColor = "var(--navy)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}
            <button onClick={doLogin} style={{ width: "100%", background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 10, padding: "13px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, boxShadow: "0 3px 14px rgba(15,32,68,.3)" }}>Login →</button>
            <div style={{ marginTop: 18, background: "var(--paper)", borderRadius: 9, padding: "9px 14px", fontSize: 12, color: "var(--ink3)", textAlign: "center", border: "1px dashed var(--border)" }}>
              Default: <strong style={{ color: "var(--navy)" }}>admin</strong> / <strong style={{ color: "var(--navy)" }}>shiksha123</strong>
            </div>
          </div>
        )}

        {/* ── SIGN UP FORM ── */}
        {authTab === "signup" && (
          <div>
            {signupErr && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{signupErr}</div>}
            {signupOk && <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>✅ Account created! Redirecting to login…</div>}
            {[
              { l: "Choose Username", k: "user", tp: "text", ph: "e.g. rahul_admin" },
              { l: "Password (min 6 chars)", k: "pass", tp: "password", ph: "••••••••" },
              { l: "Confirm Password", k: "confirm", tp: "password", ph: "••••••••" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>{f.l}</label>
                <input type={f.tp} placeholder={f.ph} value={signupForm[f.k]}
                  onChange={e => setSignupForm(x => ({ ...x, [f.k]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && doSignup()}
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", transition: "border-color .2s", background: "var(--paper)" }}
                  onFocus={e => e.target.style.borderColor = "var(--saffron)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}
            <button onClick={doSignup} disabled={signupOk} style={{ width: "100%", background: "linear-gradient(135deg,var(--saffron),var(--saffron2))", color: "white", border: "none", borderRadius: 10, padding: "13px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, cursor: signupOk ? "default" : "pointer", marginTop: 4, boxShadow: "0 3px 14px rgba(232,101,10,.3)" }}>Create Account →</button>
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink3)", textAlign: "center", lineHeight: 1.6 }}>
              By signing up, you get admin access to upload textbooks and manage the platform.
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", fontSize: 13 }}>← Back to Home</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", fontFamily: "var(--font-ui)" }}>
      <style>{G}</style>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {/* FIX 5: Book viewer modal */}
      {viewBook && <BookViewer book={viewBook} onClose={() => setViewBook(null)} />}

      <nav style={{ background: "var(--navy)", padding: "0 clamp(16px,4vw,32px)", height: 60, display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← {lang === "hi" ? "होम" : "Home"}</button>
        <span style={{ color: "rgba(255,255,255,.2)" }}>|</span>
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "white", fontSize: 19 }}>🎓 {lang === "hi" ? "एडमिन पैनल" : "Admin Panel"}</span>
        {session && <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", marginLeft: 4 }}>• {session.username}</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.25)", borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse2 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: ".04em" }}>{t.onlineLabel}</span>
          </div>
          <button onClick={doLogout} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>{t.logoutBtn}</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px clamp(16px,4vw,28px)" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", borderTop: "3px solid var(--saffron)", boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, color: "var(--navy)", fontWeight: 700 }}>{s.v}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3, fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 22, background: "var(--white)", borderRadius: 12, padding: 4, border: "1px solid var(--border)", width: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,.05)", flexWrap: "wrap" }}>
          {t.tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? "linear-gradient(135deg,var(--navy),var(--navy2))" : "none", color: tab === tb.id ? "white" : "var(--ink3)", border: "none", borderRadius: 9, padding: "8px 16px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s" }}>{tb.l}</button>
          ))}
        </div>

        {/* ── STUDENTS TAB ── */}
        {tab === "students" && (() => {
          const students = getStudents();
          const pending = students.filter(s => s.status === "pending");
          const approved = students.filter(s => s.status === "approved");
          const rejected = students.filter(s => s.status === "rejected");
          const approveStudent = (id) => {
            const updated = students.map(s => s.id === id ? { ...s, status: "approved" } : s);
            saveStudents(updated);
            setToast({ message: "Student approved ✓", type: "success" });
            setTab("students"); // force re-render
            setTab("books"); setTimeout(() => setTab("students"), 10);
          };
          const rejectStudent = (id) => {
            const updated = students.map(s => s.id === id ? { ...s, status: "rejected" } : s);
            saveStudents(updated);
            setToast({ message: "Student request rejected.", type: "info" });
            setTab("books"); setTimeout(() => setTab("students"), 10);
          };
          const removeStudent = (id) => {
            saveStudents(students.filter(s => s.id !== id));
            setToast({ message: "Student removed.", type: "info" });
            setTab("books"); setTimeout(() => setTab("students"), 10);
          };
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Pending requests */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>⏳ Pending Approvals</div>
                  {pending.length > 0 && <span style={{ background: "#fef9c3", color: "#a16207", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{pending.length} waiting</span>}
                </div>
                {pending.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--ink3)", fontSize: 13.5 }}>✅ No pending requests</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {pending.map(s => (
                      <div key={s.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#fef9c3,#fde68a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎒</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>@{s.username} · Class {s.cls} · {new Date(s.joinedAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button onClick={() => approveStudent(s.id)} style={{ background: "linear-gradient(135deg,var(--jade),#0a8a5e)", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✓ Approve</button>
                          <button onClick={() => rejectStudent(s.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✗ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved students */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>✅ Approved Students</div>
                  <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{approved.length}</span>
                </div>
                {approved.length === 0 ? (
                  <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--ink3)", fontSize: 13.5 }}>No approved students yet.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--paper)", fontSize: 11, color: "var(--ink3)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        {["Name", "Username", "Class", "Joined", "Action"].map(h => <th key={h} style={{ padding: "9px 16px", fontWeight: 700, textAlign: "left" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {approved.map(s => (
                        <tr key={s.id} style={{ borderTop: "1px solid var(--border)", fontSize: 13.5 }}>
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--ink)" }}>👤 {s.name}</td>
                          <td style={{ padding: "11px 16px", color: "var(--ink2)" }}>@{s.username}</td>
                          <td style={{ padding: "11px 16px" }}><Badge color="navy">Class {s.cls}</Badge></td>
                          <td style={{ padding: "11px 16px", color: "var(--ink3)" }}>{new Date(s.joinedAt).toLocaleDateString()}</td>
                          <td style={{ padding: "11px 16px" }}>
                            <button onClick={() => removeStudent(s.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── BOOKS TAB ── */}
        {tab === "books" && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>{t.uploadedTitle}</div>
              <button onClick={() => setTab("upload")} style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{t.uploadNewBtn}</button>
            </div>
            {books.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--navy)", marginBottom: 8 }}>No textbooks uploaded yet</div>
                <div style={{ fontSize: 13.5, color: "var(--ink3)", marginBottom: 22 }}>Upload a PDF to get started.</div>
                <button onClick={() => setTab("upload")} style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 9, padding: "10px 22px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>+ Upload First Textbook</button>
              </div>
            ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--paper)", fontSize: 11, color: "var(--ink3)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                    {t.tableHeaders.map(h => <th key={h} style={{ padding: "10px 16px", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b.id} style={{ borderTop: "1px solid var(--border)", fontSize: 14, transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--paper)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", fontWeight: 600, color: "var(--ink)" }}>📘 {b.title}</td>
                      <td style={{ padding: "13px 16px" }}><Badge color="navy">Class {b.cls}</Badge></td>
                      <td style={{ padding: "13px 16px" }}><Badge color="orange">{b.subject}</Badge></td>
                      <td style={{ padding: "13px 16px", color: "var(--ink2)" }}>{b.chapters} ch.</td>
                      <td style={{ padding: "13px 16px", color: "var(--ink3)" }}>{b.uploaded}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {/* FIX 5: View button */}
                          <button onClick={() => setViewBook(b)} style={{ background: "#dde8ff", color: "var(--navy)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.viewBtn}</button>
                          <button onClick={() => { updateBooks(books.filter(x => x.id !== b.id)); setToast({ message: "Book removed.", type: "info" }); }} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.deleteBtn}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}


        {/* ── CHAPTERS TAB ── */}
        {tab === "chapters" && (() => {
          // Chapter library stored as { "cls:subject": [{num, name}] }
          const chapKey = `${nb.cls}:${nb.subject}`;
          const allChapLib = LS.get("shiksha_chaplib", {});
          const chapList = allChapLib[chapKey] || [];
          const [newChNum, setNewChNum] = [nb._newChNum || "", (v) => setNb(x => ({ ...x, _newChNum: v }))];
          const [newChName, setNewChName] = [nb._newChName || "", (v) => setNb(x => ({ ...x, _newChName: v }))];

          const saveChapLib = (updated) => {
            const lib = LS.get("shiksha_chaplib", {});
            lib[chapKey] = updated;
            LS.set("shiksha_chaplib", lib);
          };
          const addChapter = () => {
            const num = (nb._newChNum || "").trim();
            const name = (nb._newChName || "").trim();
            if (!num || !name) { setToast({ message: "Enter both chapter number and name.", type: "error" }); return; }
            if (chapList.find(c => c.num === num)) { setToast({ message: `Chapter ${num} already exists.`, type: "error" }); return; }
            const updated = [...chapList, { num, name }].sort((a, b) => Number(a.num) - Number(b.num) || a.num.localeCompare(b.num));
            saveChapLib(updated);
            setNb(x => ({ ...x, _newChNum: "", _newChName: "", _chapRefresh: (x._chapRefresh || 0) + 1 }));
            setToast({ message: `Chapter ${num}: ${name} added.`, type: "success" });
          };
          const removeChapter = (num) => {
            const updated = chapList.filter(c => c.num !== num);
            saveChapLib(updated);
            setNb(x => ({ ...x, _chapRefresh: (x._chapRefresh || 0) + 1 }));
            setToast({ message: "Chapter removed.", type: "info" });
          };

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
              {/* LEFT — selector + add form */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)", marginBottom: 4 }}>📖 Chapter Manager</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 20 }}>
                  Define the chapter list for each Class & Subject. These chapters will appear in the Upload dropdown.
                </p>

                {/* Class */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".06em", textTransform: "uppercase" }}>Class</label>
                  <select value={nb.cls} onChange={e => setNb(x => ({ ...x, cls: e.target.value, subject: SUBJECTS_FIXED[e.target.value][0], _newChNum: "", _newChName: "" }))}
                    style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)" }}>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".06em", textTransform: "uppercase" }}>Subject</label>
                  <select value={nb.subject} onChange={e => setNb(x => ({ ...x, subject: e.target.value, _newChNum: "", _newChName: "" }))}
                    style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)" }}>
                    {(SUBJECTS_FIXED[nb.cls] || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Add Chapter */}
                <div style={{ background: "var(--paper)", borderRadius: 11, padding: 16, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Add New Chapter</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 70, flexShrink: 0 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4 }}>Ch. No.</label>
                      <input
                        type="text"
                        placeholder="1"
                        value={nb._newChNum || ""}
                        onChange={e => setNb(x => ({ ...x, _newChNum: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addChapter()}
                        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 10px", fontSize: 13.5, outline: "none", fontFamily: "var(--font-ui)", background: "var(--white)", textAlign: "center", fontWeight: 700 }}
                        onFocus={e => e.target.style.borderColor = "var(--saffron)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 4 }}>Chapter Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Laws of Motion"
                        value={nb._newChName || ""}
                        onChange={e => setNb(x => ({ ...x, _newChName: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addChapter()}
                        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 10px", fontSize: 13.5, outline: "none", fontFamily: "var(--font-ui)", background: "var(--white)" }}
                        onFocus={e => e.target.style.borderColor = "var(--saffron)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                      />
                    </div>
                  </div>
                  <button onClick={addChapter} style={{ width: "100%", background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 9, padding: "10px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(15,32,68,.2)" }}>+ Add Chapter</button>
                </div>

                <div style={{ marginTop: 14, background: "var(--jade-light)", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#065f46", border: "1px solid #9ddfc8", lineHeight: 1.6 }}>
                  💡 Press <strong>Enter</strong> or click Add. Chapters auto-sort by number. These will appear in the Upload PDF dropdown.
                </div>
              </div>

              {/* RIGHT — chapter list */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>Class {nb.cls} · {nb.subject}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>{chapList.length} chapter{chapList.length !== 1 ? "s" : ""} defined</div>
                  </div>
                  {chapList.length > 0 && (
                    <button onClick={() => {
                      if (!window.confirm("Remove ALL chapters for this class/subject?")) return;
                      saveChapLib([]);
                      setNb(x => ({ ...x, _chapRefresh: (x._chapRefresh || 0) + 1 }));
                    }} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Clear All</button>
                  )}
                </div>

                {chapList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 8 }}>No chapters yet</div>
                    <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>Add chapters using the form on the left.<br />They will appear in the Upload PDF dropdown.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {chapList.map((ch, i) => (
                      <div key={ch.num} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--paper)", borderRadius: 10, padding: "11px 14px", border: "1px solid var(--border)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,var(--navy),var(--navy2))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                          {ch.num}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Chapter {ch.num}: {ch.name}</div>
                        </div>
                        <button onClick={() => removeChapter(ch.num)}
                          style={{ background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 7, width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── UPLOAD TAB ── */}
        {tab === "upload" && (() => {
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* LEFT: Upload form */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 26, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)", marginBottom: 6 }}>Upload Textbook PDF</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
                  Select a class, subject, and chapter, then upload the corresponding PDF.
                </p>

                {/* Class */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>Class</label>
                  <select value={nb.cls} onChange={e => setNb(x => ({ ...x, cls: e.target.value, subject: SUBJECTS_FIXED[e.target.value][0] }))}
                    style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)" }}>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>Subject</label>
                  <select value={nb.subject} onChange={e => setNb(x => ({ ...x, subject: e.target.value }))}
                    style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)" }}>
                    {(SUBJECTS_FIXED[nb.cls] || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Chapter — single select from Chapter Manager */}
                {(() => {
                  const chapKey = `${nb.cls}:${nb.subject}`;
                  const chapLib = LS.get("shiksha_chaplib", {});
                  const definedChaps = chapLib[chapKey] || [];
                  const uploadedChapNums = books.filter(b => b.cls === nb.cls && b.subject === nb.subject).flatMap(b => (b.coveredChaps || []).map(c => c.num));
                  const availableChaps = definedChaps.filter(ch => !uploadedChapNums.includes(ch.num));
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Chapter
                      </label>
                      {definedChaps.length === 0 ? (
                        <div style={{ background: "#fff8ef", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#92400e", display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 20 }}>⚠️</span>
                          <div>No chapters defined for Class {nb.cls} {nb.subject} yet.{" "}
                            <button onClick={() => setTab("chapters")} style={{ background: "none", border: "none", color: "var(--saffron)", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: "0 4px", textDecoration: "underline" }}>Go to Chapters tab →</button>
                          </div>
                        </div>
                      ) : availableChaps.length === 0 ? (
                        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#15803d", display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 20 }}>✅</span>
                          <div>All chapters for this subject have been uploaded.</div>
                        </div>
                      ) : (
                        <select value={nb.chFrom || availableChaps[0]?.num || ""} onChange={e => setNb(x => ({ ...x, chFrom: e.target.value, chTo: e.target.value }))}
                          style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "var(--font-ui)", background: "var(--paper)", color: "var(--ink)" }}>
                          {availableChaps.map(ch => (
                            <option key={ch.num} value={ch.num}>Chapter {ch.num}: {ch.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })()}

                {/* Drop zone */}
                <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${drag ? "var(--saffron)" : "var(--border)"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: drag ? "#fff8ef" : "var(--paper)", transition: "all .2s" }}>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleDrop} />
                  <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
                  <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4, fontSize: 14 }}>
                    {uploading ? "Processing…" : "Drop PDF here or click to browse"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>PDF files only · up to 50 MB</div>
                </div>

                {uploading && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink3)", marginBottom: 5 }}>
                      <span>Saving Chapter {nb.chFrom || "?"}…</span>
                      <span>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 8, height: 8, overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(90deg,var(--saffron),var(--saffron2))", height: "100%", borderRadius: 8, width: `${Math.min(100, progress)}%`, transition: "width .2s" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Preview of current books for this class/subject */}
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 26, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 4 }}>
                  Class {nb.cls} · {nb.subject} — Uploads
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  All PDFs uploaded for this class and subject
                </p>
                {books.filter(b => b.cls === nb.cls && b.subject === nb.subject).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink3)" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>No uploads yet</div>
                    <div style={{ fontSize: 12.5 }}>Upload a PDF to get started</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {books.filter(b => b.cls === nb.cls && b.subject === nb.subject).map((b, i) => (
                      <div key={b.id} style={{ background: "var(--paper)", borderRadius: 11, padding: "12px 14px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--navy)", marginBottom: 3 }}>
                              {b.chFrom ? `Chapter ${b.chFrom}` : `${b.chapters} chapter(s)`}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--ink3)" }}>{b.uploaded}</div>
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <button onClick={() => setViewBook(b)}
                              style={{ background: "#dde8ff", color: "var(--navy)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>View</button>
                            <button onClick={() => { updateBooks(books.filter(x => x.id !== b.id)); }}
                              style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>✕</button>
                          </div>
                        </div>
                        {(b.coveredChaps || []).length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {(b.coveredChaps || []).map((ch, j) => (
                              <span key={j} style={{ background: "#e8f0fd", color: "#1a6ed8", borderRadius: 4, padding: "2px 7px", fontSize: 10.5, fontWeight: 600 }}>Ch.{ch.num}: {ch.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── STATS TAB (replaces AI Pipeline) ── */}
        {tab === "stats" && (() => {
          const subjectCounts = {};
          const classCounts = {};
          books.forEach(b => {
            subjectCounts[b.subject] = (subjectCounts[b.subject] || 0) + 1;
            classCounts[b.cls] = (classCounts[b.cls] || 0) + 1;
          });
          const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];
          const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
          const totalChapters = books.reduce((a, b) => a + b.chapters, 0);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
                {[
                  { icon: "📚", label: "Total Books Uploaded", value: books.length, color: "var(--navy)" },
                  { icon: "📖", label: "Total Chapters Covered", value: totalChapters, color: "var(--saffron)" },
                  { icon: "🏆", label: "Most Uploaded Subject", value: topSubject ? topSubject[0] : "—", color: "var(--jade)" },
                  { icon: "🎓", label: "Most Covered Class", value: topClass ? `Class ${topClass[0]}` : "—", color: "#7c3aed" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", borderTop: `3px solid ${s.color}`, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: s.color, fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Books by subject breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 16 }}>📚 Books by Subject</div>
                  {Object.keys(subjectCounts).length === 0
                    ? <div style={{ color: "var(--ink3)", fontSize: 13 }}>No books uploaded yet.</div>
                    : Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).map(([sub, cnt], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{sub}</div>
                        <div style={{ background: "var(--paper)", borderRadius: 6, height: 8, flex: 2, overflow: "hidden" }}>
                          <div style={{ width: `${(cnt / books.length) * 100}%`, height: "100%", background: "var(--saffron)", borderRadius: 6 }} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink2)", minWidth: 28, textAlign: "right" }}>{cnt}</div>
                      </div>
                    ))}
                </div>
                <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 16 }}>🎓 Books by Class</div>
                  {Object.keys(classCounts).length === 0
                    ? <div style={{ color: "var(--ink3)", fontSize: 13 }}>No books uploaded yet.</div>
                    : Object.entries(classCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([cls, cnt], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", flex: 1 }}>Class {cls}</div>
                        <div style={{ background: "var(--paper)", borderRadius: 6, height: 8, flex: 2, overflow: "hidden" }}>
                          <div style={{ width: `${(cnt / books.length) * 100}%`, height: "100%", background: "var(--navy)", borderRadius: 6 }} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink2)", minWidth: 28, textAlign: "right" }}>{cnt}</div>
                      </div>
                    ))}
                  <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--paper)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>Coverage Gaps</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {CLASSES.filter(c => !classCounts[c]).map(c => (
                        <span key={c} style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>Class {c} missing</span>
                      ))}
                      {CLASSES.every(c => classCounts[c]) && <span style={{ color: "var(--jade)", fontSize: 13, fontWeight: 600 }}>✓ All classes covered!</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── MANAGE ADMINS TAB ── FIX 3 */}
        {tab === "admins" && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>{t.manageAdmins}</div>
              <button onClick={() => setAddingAdmin(o => !o)} style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{t.addAdmin}</button>
            </div>
            {addingAdmin && (
              <div style={{ padding: "16px 20px", background: "var(--paper)", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[{ l: t.adminUserLabel, k: "username", tp: "text", ph: "new_admin" }, { l: t.adminPassLabel, k: "password", tp: "password", ph: "••••••" }].map(f => (
                  <div key={f.k} style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", display: "block", marginBottom: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>{f.l}</label>
                    <input type={f.tp} placeholder={f.ph} value={newAdmin[f.k]}
                      onChange={e => setNewAdmin(x => ({ ...x, [f.k]: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, outline: "none", fontFamily: "var(--font-ui)", background: "var(--white)" }}
                      onFocus={e => e.target.style.borderColor = "var(--navy)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addAdmin} style={{ background: "linear-gradient(135deg,var(--jade),#0a8a5e)", color: "white", border: "none", borderRadius: 9, padding: "9px 18px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setAddingAdmin(false)} style={{ background: "var(--paper)", border: "1px solid var(--border)", color: "var(--ink2)", borderRadius: 9, padding: "9px 14px", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--paper)", fontSize: 11, color: "var(--ink3)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {["Username", "Role", "Created", "Action"].map(h => <th key={h} style={{ padding: "10px 20px", fontWeight: 700, textAlign: "left" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--border)", fontSize: 14 }}>
                    <td style={{ padding: "13px 20px", fontWeight: 700, color: "var(--navy)" }}>👤 {a.username}</td>
                    <td style={{ padding: "13px 20px" }}><Badge color={a.isRoot ? "orange" : "blue"}>{a.isRoot ? "Root Admin" : "Admin"}</Badge></td>
                    <td style={{ padding: "13px 20px", color: "var(--ink3)" }}>{a.isRoot ? "System default" : new Date(a.id).toLocaleDateString()}</td>
                    <td style={{ padding: "13px 20px" }}>
                      {a.isRoot
                        ? <span style={{ fontSize: 12, color: "var(--ink3)", fontStyle: "italic" }}>Cannot delete root</span>
                        : <button onClick={() => removeAdmin(a.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.deleteBtn}</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════
export default function ShikshaApp() {
  const [page, setPage] = useState("role");
  const [lang, setLang] = useState(() => LS.get("shiksha_lang", "en"));
  const [student, setStudent] = useState(null);

  const changeLang = (l) => { setLang(l); LS.set("shiksha_lang", l); };

  const handleStudentEnter  = (s) => { setStudent(s); setPage("studentHome"); };
  const handleStudentLogout = () => { setStudent(null); LS.del("shiksha_student_session"); setPage("role"); };
  const handleTeacherEnter  = () => { setPage("admin"); };

  if (page === "role")        return <RolePage onStudent={() => setPage("studentAuth")} onTeacher={() => setPage("teacherAuth")} lang={lang} setLang={changeLang} />;
  if (page === "studentAuth") return <StudentAuth onBack={() => setPage("role")} onEnter={handleStudentEnter} lang={lang} />;
  if (page === "teacherAuth") return <TeacherAuth onBack={() => setPage("role")} onEnter={handleTeacherEnter} lang={lang} />;
  if (page === "studentHome") return <StudentHome student={student} lang={lang} setLang={changeLang} onQA={() => setPage("dashboard")} onPDFs={() => setPage("pdfs")} onLogout={handleStudentLogout} />;
  if (page === "pdfs")        return <StudentPDFLibrary student={student} lang={lang} onBack={() => setPage("studentHome")} />;
  if (page === "dashboard")   return <StudentDashboard lang={lang} setLang={changeLang} onBack={() => setPage("studentHome")} />;
  if (page === "admin")       return <AdminPanel onBack={() => setPage("role")} />;
  return null;
}