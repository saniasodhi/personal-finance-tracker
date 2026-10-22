export type Lang = 'en' | 'hi';

const en = {
  navFeatures: 'Features',
  navHow: 'How it works',
  navOpen: 'Open source',
  navFaq: 'FAQ',
  openApp: 'Open app',
  pill: 'Free · Open source · Built for UPI',
  heroA: 'Kharcha track karo,',
  heroB: 'tension nahi.',
  heroSub:
    'Drop in your bank or UPI statement. Kharcha sorts every payment into Food, Travel, Rent and more, keeps your balance up to date and shows exactly where your ₹ went.',
  ctaPrimary: 'Start free — it’s ₹0',
  ctaSample: 'Try it with sample data',
  trust: 'No sign-up. No bank login. Your data never leaves your browser.',
  phoneHello: 'Namaste!',
  phoneToday: 'Aaj ka kharcha',
  phoneLeft: 'left this month',
  phoneNow: 'Just now',
  paidVia: 'Paid via UPI',
  received: 'Received',
  autoSorted: 'auto-sorted',
  featEyebrow: 'Features',
  featTitle: 'Everything your spreadsheet wished it could do.',
  fImportT: 'Import any statement',
  fImportD: 'CSV or Excel from any bank or UPI app. Debit/credit columns, DD/MM dates and messy headers are handled for you.',
  fImportFile: 'statement.csv',
  fImportDone: 'rows imported · all categorized',
  fCatT: 'Auto-categorized',
  fCatD: 'Swiggy is Food. Uber is Travel. Rent is Housing. Change one and Kharcha keeps your choice.',
  fCalT: 'Kharcha calendar',
  fCalD: 'Every day coloured by how much you spent, so rent day and weekend splurges stand out.',
  fBudT: 'Festive budgets',
  fBudD: 'Set a budget for Diwali, a trip or a wedding. Kharcha tracks it and warns you when you’re close.',
  fBalT: 'Balance that fills itself',
  fBalD: 'Set your starting balance once. Every expense and income updates what’s left.',
  fPrivT: 'Private by design',
  fPrivD: 'Everything is stored in your browser. There is no server holding your money data.',
  fLangT: 'English or हिंदी',
  fLangD: 'Use Kharcha in the language you think about money in.',
  howEyebrow: 'How it works',
  howTitle: 'Three steps. About two minutes.',
  h1T: 'Bring your statement',
  h1D: 'Export a CSV or Excel file from your bank or UPI app, or add spends by hand.',
  h2T: 'Kharcha sorts it',
  h2D: 'Every row gets a category and your running balance is filled in.',
  h3T: 'See your month',
  h3D: 'Spend by category, money in versus out, your calendar and budgets.',
  osEyebrow: 'Open source',
  osTitle: 'Built in the open. Free forever.',
  osBody:
    'Kharcha is MIT-licensed. Read every line, run it yourself, or help build it. No ads, no tracking, no selling your data, because there is nothing to sell.',
  osStar: 'Star on GitHub',
  osContribute: 'Contribute',
  faqTitle: 'Questions',
  q1: 'Is Kharcha really free?',
  a1: 'Yes. It’s open source under the MIT license and runs entirely in your browser, so there are no servers to pay for.',
  q2: 'Where is my data stored?',
  a2: 'Only in this browser, on this device. Export a CSV anytime to back it up or move it to another device.',
  q3: 'Which banks and UPI apps work?',
  a3: 'Any app that can export a CSV or .xlsx statement. If yours doesn’t import cleanly, open an issue on GitHub with the column names.',
  q4: 'Do I need to link my bank account?',
  a4: 'No. Kharcha never asks for bank logins, card numbers or UPI PINs.',
  finalTitle: 'Har rupee ka hisaab.',
  finalSub: 'Every rupee, accounted for. Free and open source.',
  footerMade: 'Made in India · MIT licensed',
  tickerLabel: 'Example transactions',
};

export type Strings = typeof en;

const hi: Strings = {
  navFeatures: 'फ़ीचर्स',
  navHow: 'कैसे काम करता है',
  navOpen: 'ओपन सोर्स',
  navFaq: 'सवाल',
  openApp: 'ऐप खोलें',
  pill: 'मुफ़्त · ओपन सोर्स · UPI के लिए बना',
  heroA: 'खर्चा ट्रैक करो,',
  heroB: 'टेंशन नहीं।',
  heroSub:
    'अपना बैंक या UPI स्टेटमेंट डालें। खर्चा हर पेमेंट को खाना, सफ़र, किराया जैसी कैटेगरी में बाँट देता है, बैलेंस अपडेट रखता है और दिखाता है कि आपका ₹ कहाँ गया।',
  ctaPrimary: 'मुफ़्त शुरू करें — ₹0',
  ctaSample: 'सैंपल डेटा के साथ आज़माएँ',
  trust: 'कोई साइन-अप नहीं। कोई बैंक लॉगिन नहीं। आपका डेटा आपके ब्राउज़र से बाहर नहीं जाता।',
  phoneHello: 'नमस्ते!',
  phoneToday: 'आज का खर्चा',
  phoneLeft: 'इस महीने बाकी',
  phoneNow: 'अभी-अभी',
  paidVia: 'UPI से भुगतान',
  received: 'मिले',
  autoSorted: 'अपने-आप',
  featEyebrow: 'फ़ीचर्स',
  featTitle: 'वो सब जो आपकी स्प्रेडशीट कभी नहीं कर पाई।',
  fImportT: 'कोई भी स्टेटमेंट इंपोर्ट करें',
  fImportD: 'किसी भी बैंक या UPI ऐप की CSV या Excel फ़ाइल। डेबिट/क्रेडिट कॉलम और DD/MM तारीखें अपने-आप समझ ली जाती हैं।',
  fImportFile: 'statement.csv',
  fImportDone: 'पंक्तियाँ इंपोर्ट · सब कैटेगरी में',
  fCatT: 'अपने-आप कैटेगरी',
  fCatD: 'Swiggy खाना है, Uber सफ़र, किराया घर। एक बार बदलें, खर्चा याद रखेगा।',
  fCalT: 'खर्चा कैलेंडर',
  fCalD: 'हर दिन का रंग बताता है कितना खर्च हुआ, ताकि किराये का दिन और वीकेंड साफ़ दिखें।',
  fBudT: 'त्योहार बजट',
  fBudD: 'दिवाली, ट्रिप या शादी का बजट बनाएँ। सीमा के पास पहुँचते ही खर्चा बता देगा।',
  fBalT: 'बैलेंस अपने-आप',
  fBalD: 'एक बार शुरुआती बैलेंस डालें। हर खर्च और आमदनी के बाद बाकी रकम अपडेट होती है।',
  fPrivT: 'पूरी तरह निजी',
  fPrivD: 'सब कुछ आपके ब्राउज़र में रहता है। आपका पैसों का डेटा किसी सर्वर पर नहीं जाता।',
  fLangT: 'English या हिंदी',
  fLangD: 'जिस भाषा में आप पैसों के बारे में सोचते हैं, उसी में चलाएँ।',
  howEyebrow: 'कैसे काम करता है',
  howTitle: 'तीन कदम। लगभग दो मिनट।',
  h1T: 'स्टेटमेंट लाएँ',
  h1D: 'बैंक या UPI ऐप से CSV या Excel फ़ाइल निकालें, या खर्च खुद जोड़ें।',
  h2T: 'खर्चा उसे छाँटता है',
  h2D: 'हर पंक्ति को कैटेगरी मिलती है और बैलेंस भर दिया जाता है।',
  h3T: 'अपना महीना देखें',
  h3D: 'कैटेगरी के हिसाब से खर्च, आमदनी बनाम खर्च, कैलेंडर और बजट।',
  osEyebrow: 'ओपन सोर्स',
  osTitle: 'खुले में बना। हमेशा मुफ़्त।',
  osBody:
    'खर्चा MIT लाइसेंस के तहत है। हर लाइन पढ़ें, खुद चलाएँ या बनाने में मदद करें। न विज्ञापन, न ट्रैकिंग, न आपका डेटा बेचना, क्योंकि बेचने को कुछ है ही नहीं।',
  osStar: 'GitHub पर स्टार करें',
  osContribute: 'योगदान दें',
  faqTitle: 'सवाल',
  q1: 'क्या खर्चा सच में मुफ़्त है?',
  a1: 'हाँ। यह MIT लाइसेंस के तहत ओपन सोर्स है और पूरी तरह आपके ब्राउज़र में चलता है, इसलिए कोई सर्वर खर्च नहीं।',
  q2: 'मेरा डेटा कहाँ रहता है?',
  a2: 'सिर्फ़ इसी ब्राउज़र में, इसी डिवाइस पर। बैकअप या दूसरे डिवाइस के लिए कभी भी CSV एक्सपोर्ट करें।',
  q3: 'कौन से बैंक और UPI ऐप चलते हैं?',
  a3: 'कोई भी ऐप जो CSV या .xlsx स्टेटमेंट दे सके। अगर आपकी फ़ाइल ठीक से न आए, तो GitHub पर कॉलम के नाम के साथ issue खोलें।',
  q4: 'क्या बैंक अकाउंट जोड़ना होगा?',
  a4: 'नहीं। खर्चा कभी बैंक लॉगिन, कार्ड नंबर या UPI PIN नहीं माँगता।',
  finalTitle: 'हर रुपये का हिसाब।',
  finalSub: 'हर रुपया, पूरा हिसाब। मुफ़्त और ओपन सोर्स।',
  footerMade: 'भारत में बना · MIT लाइसेंस',
  tickerLabel: 'उदाहरण लेन-देन',
};

export const STRINGS: Record<Lang, Strings> = { en, hi };

const KEY = 'kharcha:lang';

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    /* storage blocked */
  }
  return navigator.language?.toLowerCase().startsWith('hi') ? 'hi' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage blocked */
  }
}
