import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  hi: {
    'About': 'हमारे बारे में', 'Features': 'सुविधाएँ', 'Mobile App': 'मोबाइल ऐप', 'Log in': 'लॉग इन', 'Sign up': 'रजिस्टर करें',
    'Sign in': 'साइन इन', 'Email': 'ईमेल', 'Password': 'पासवर्ड', 'Forgot password?': 'पासवर्ड भूल गए?', 'No account?': 'खाता नहीं है?', 'Register': 'रजिस्टर करें', 'Back to home': 'होम पर वापस',
    'Create account': 'खाता बनाएँ', 'Name': 'नाम', 'Phone': 'फ़ोन', 'Continue': 'आगे बढ़ें', 'Back to login': 'लॉगिन पर वापस', 'Reset password': 'पासवर्ड रीसेट करें', 'New password': 'नया पासवर्ड', 'Confirm password': 'पासवर्ड की पुष्टि करें', 'Send reset code': 'रीसेट कोड भेजें', 'Resetting…': 'रीसेट हो रहा है…', 'Resend code': 'कोड दोबारा भेजें', 'Back to sign in': 'साइन इन पर वापस',
    'Home': 'होम', 'Family': 'परिवार', 'Map': 'नक्शा', 'Events': 'कार्यक्रम', 'News': 'समाचार', 'Invitations': 'निमंत्रण', 'Alerts': 'सूचनाएँ', 'Profile': 'प्रोफ़ाइल', 'Log out': 'लॉग आउट',
    'Admin dashboard': 'एडमिन डैशबोर्ड', 'All users': 'सभी उपयोगकर्ता', 'All villages': 'सभी गाँव', 'Manage events': 'कार्यक्रम प्रबंधन',
    'Registered users': 'पंजीकृत उपयोगकर्ता', 'Connected villages': 'जुड़े हुए गाँव', 'Family members': 'परिवार के सदस्य', 'Active posts': 'सक्रिय पोस्ट', 'Live data': 'लाइव डेटा',
    'Quick management': 'त्वरित प्रबंधन', 'Manage users': 'उपयोगकर्ता प्रबंधन', 'Village directory': 'गाँव निर्देशिका', 'Functions & events': 'समारोह और कार्यक्रम', 'Community announcement': 'सामुदायिक घोषणा', 'Broadcast now': 'अभी प्रसारित करें', 'Emergency alert': 'आपातकालीन सूचना', 'Send emergency alert': 'आपातकालीन सूचना भेजें', 'Recent village posts': 'हाल की गाँव पोस्ट', 'View feed': 'फ़ीड देखें', 'Remove': 'हटाएँ', 'Recent broadcasts': 'हाल की घोषणाएँ', 'Create function': 'कार्यक्रम बनाएँ', 'System operational': 'सिस्टम सक्रिय है',
    'Hello': 'नमस्ते', 'Welcome to MY VILLAGE — stay connected and informed.': 'MY VILLAGE में आपका स्वागत है — जुड़े रहें और जानकारी पाएँ।', 'Add your village': 'अपना गाँव जोड़ें', 'Your village': 'आपका गाँव', 'Villagers': 'गाँववासी', 'Village map': 'गाँव का नक्शा', 'Instant news': 'तुरंत समाचार', 'Notifications': 'सूचनाएँ',
    'Village events': 'गाँव के कार्यक्रम', 'Invite villagers to a function': 'गाँववासियों को कार्यक्रम में आमंत्रित करें', 'Function title': 'कार्यक्रम का नाम', 'Invitation details': 'निमंत्रण विवरण', 'Place': 'स्थान', 'Timing details': 'समय का विवरण', 'Send invitation': 'निमंत्रण भेजें', 'Village function': 'गाँव का कार्यक्रम', 'Personal function': 'निजी कार्यक्रम',
    'Add family member': 'परिवार का सदस्य जोड़ें', 'Full name': 'पूरा नाम', 'Gender': 'लिंग', 'Male': 'पुरुष', 'Female': 'महिला', 'Other': 'अन्य', 'Occupation': 'व्यवसाय', 'Relationship': 'रिश्ता', 'Make head': 'मुखिया बनाएँ', 'Manage members': 'सदस्य प्रबंधन', 'Family head': 'परिवार का मुखिया',
    'Village news': 'गाँव समाचार', 'Text': 'टेक्स्ट', 'Photo': 'फोटो', 'Video': 'वीडियो', 'Voice': 'आवाज़', 'Post': 'पोस्ट करें', 'Personal invitations': 'निजी निमंत्रण', 'Title': 'शीर्षक', 'Message': 'संदेश', 'Invite all villagers': 'सभी गाँववासियों को आमंत्रित करें', 'Mark all read': 'सभी को पढ़ा हुआ करें', 'Mark read': 'पढ़ा हुआ करें',
    'Loading…': 'लोड हो रहा है…', 'Loading family…': 'परिवार लोड हो रहा है…', 'Delete': 'हटाएँ', 'Save': 'सहेजें', 'Cancel': 'रद्द करें', 'Search': 'खोजें', 'Verified': 'सत्यापित', 'Pending': 'लंबित', 'Banned': 'प्रतिबंधित', 'Status': 'स्थिति', 'Role': 'भूमिका', 'Address': 'पता', 'Joined': 'शामिल हुए',
  },
  pa: {
    'About': 'ਸਾਡੇ ਬਾਰੇ', 'Features': 'ਸਹੂਲਤਾਂ', 'Mobile App': 'ਮੋਬਾਈਲ ਐਪ', 'Log in': 'ਲੌਗ ਇਨ', 'Sign up': 'ਰਜਿਸਟਰ ਕਰੋ',
    'Sign in': 'ਸਾਈਨ ਇਨ', 'Email': 'ਈਮੇਲ', 'Password': 'ਪਾਸਵਰਡ', 'Forgot password?': 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?', 'No account?': 'ਖਾਤਾ ਨਹੀਂ ਹੈ?', 'Register': 'ਰਜਿਸਟਰ ਕਰੋ', 'Back to home': 'ਹੋਮ ਤੇ ਵਾਪਸ',
    'Create account': 'ਖਾਤਾ ਬਣਾਓ', 'Name': 'ਨਾਮ', 'Phone': 'ਫੋਨ', 'Continue': 'ਅੱਗੇ ਵਧੋ', 'Back to login': 'ਲੌਗਇਨ ਤੇ ਵਾਪਸ', 'Reset password': 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰੋ', 'New password': 'ਨਵਾਂ ਪਾਸਵਰਡ', 'Confirm password': 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ', 'Send reset code': 'ਰੀਸੈੱਟ ਕੋਡ ਭੇਜੋ', 'Resend code': 'ਕੋਡ ਦੁਬਾਰਾ ਭੇਜੋ', 'Back to sign in': 'ਸਾਈਨ ਇਨ ਤੇ ਵਾਪਸ',
    'Home': 'ਹੋਮ', 'Family': 'ਪਰਿਵਾਰ', 'Map': 'ਨਕਸ਼ਾ', 'Events': 'ਸਮਾਗਮ', 'News': 'ਖ਼ਬਰਾਂ', 'Invitations': 'ਸੱਦੇ', 'Alerts': 'ਸੂਚਨਾਵਾਂ', 'Profile': 'ਪ੍ਰੋਫ਼ਾਈਲ', 'Log out': 'ਲੌਗ ਆਉਟ',
    'Admin dashboard': 'ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ', 'All users': 'ਸਾਰੇ ਵਰਤੋਂਕਾਰ', 'All villages': 'ਸਾਰੇ ਪਿੰਡ', 'Manage events': 'ਸਮਾਗਮ ਪ੍ਰਬੰਧਨ',
    'Registered users': 'ਰਜਿਸਟਰਡ ਵਰਤੋਂਕਾਰ', 'Connected villages': 'ਜੁੜੇ ਪਿੰਡ', 'Family members': 'ਪਰਿਵਾਰਕ ਮੈਂਬਰ', 'Active posts': 'ਸਰਗਰਮ ਪੋਸਟਾਂ', 'Live data': 'ਲਾਈਵ ਡਾਟਾ',
    'Quick management': 'ਤੁਰੰਤ ਪ੍ਰਬੰਧਨ', 'Manage users': 'ਵਰਤੋਂਕਾਰ ਪ੍ਰਬੰਧਨ', 'Village directory': 'ਪਿੰਡ ਡਾਇਰੈਕਟਰੀ', 'Functions & events': 'ਸਮਾਗਮ ਅਤੇ ਪ੍ਰੋਗਰਾਮ', 'Community announcement': 'ਭਾਈਚਾਰਕ ਐਲਾਨ', 'Broadcast now': 'ਹੁਣੇ ਪ੍ਰਸਾਰਿਤ ਕਰੋ', 'Emergency alert': 'ਐਮਰਜੈਂਸੀ ਸੂਚਨਾ', 'Send emergency alert': 'ਐਮਰਜੈਂਸੀ ਸੂਚਨਾ ਭੇਜੋ', 'Recent village posts': 'ਹਾਲੀਆ ਪਿੰਡ ਪੋਸਟਾਂ', 'View feed': 'ਫੀਡ ਵੇਖੋ', 'Remove': 'ਹਟਾਓ', 'Recent broadcasts': 'ਹਾਲੀਆ ਐਲਾਨ', 'Create function': 'ਸਮਾਗਮ ਬਣਾਓ', 'System operational': 'ਸਿਸਟਮ ਚਾਲੂ ਹੈ',
    'Hello': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'Add your village': 'ਆਪਣਾ ਪਿੰਡ ਜੋੜੋ', 'Your village': 'ਤੁਹਾਡਾ ਪਿੰਡ', 'Villagers': 'ਪਿੰਡ ਵਾਸੀ', 'Village map': 'ਪਿੰਡ ਦਾ ਨਕਸ਼ਾ', 'Instant news': 'ਤੁਰੰਤ ਖ਼ਬਰਾਂ', 'Notifications': 'ਸੂਚਨਾਵਾਂ',
    'Village events': 'ਪਿੰਡ ਦੇ ਸਮਾਗਮ', 'Invite villagers to a function': 'ਪਿੰਡ ਵਾਸੀਆਂ ਨੂੰ ਸਮਾਗਮ ਲਈ ਸੱਦੋ', 'Function title': 'ਸਮਾਗਮ ਦਾ ਨਾਮ', 'Invitation details': 'ਸੱਦੇ ਦਾ ਵੇਰਵਾ', 'Place': 'ਸਥਾਨ', 'Timing details': 'ਸਮੇਂ ਦਾ ਵੇਰਵਾ', 'Send invitation': 'ਸੱਦਾ ਭੇਜੋ', 'Village function': 'ਪਿੰਡ ਦਾ ਸਮਾਗਮ', 'Personal function': 'ਨਿੱਜੀ ਸਮਾਗਮ',
    'Add family member': 'ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਜੋੜੋ', 'Full name': 'ਪੂਰਾ ਨਾਮ', 'Gender': 'ਲਿੰਗ', 'Male': 'ਮਰਦ', 'Female': 'ਔਰਤ', 'Other': 'ਹੋਰ', 'Occupation': 'ਕਿੱਤਾ', 'Relationship': 'ਰਿਸ਼ਤਾ', 'Make head': 'ਮੁਖੀ ਬਣਾਓ', 'Manage members': 'ਮੈਂਬਰ ਪ੍ਰਬੰਧਨ', 'Family head': 'ਪਰਿਵਾਰ ਦਾ ਮੁਖੀ',
    'Village news': 'ਪਿੰਡ ਦੀਆਂ ਖ਼ਬਰਾਂ', 'Text': 'ਲਿਖਤ', 'Photo': 'ਫੋਟੋ', 'Video': 'ਵੀਡੀਓ', 'Voice': 'ਆਵਾਜ਼', 'Post': 'ਪੋਸਟ ਕਰੋ', 'Personal invitations': 'ਨਿੱਜੀ ਸੱਦੇ', 'Title': 'ਸਿਰਲੇਖ', 'Message': 'ਸੁਨੇਹਾ', 'Invite all villagers': 'ਸਾਰੇ ਪਿੰਡ ਵਾਸੀਆਂ ਨੂੰ ਸੱਦੋ', 'Mark all read': 'ਸਭ ਪੜ੍ਹੇ ਹੋਏ ਕਰੋ', 'Mark read': 'ਪੜ੍ਹਿਆ ਹੋਇਆ ਕਰੋ',
    'Loading…': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…', 'Delete': 'ਹਟਾਓ', 'Save': 'ਸੰਭਾਲੋ', 'Cancel': 'ਰੱਦ ਕਰੋ', 'Search': 'ਖੋਜੋ', 'Verified': 'ਤਸਦੀਕਸ਼ੁਦਾ', 'Pending': 'ਬਕਾਇਆ', 'Banned': 'ਪਾਬੰਦੀਸ਼ੁਦਾ', 'Status': 'ਸਥਿਤੀ', 'Role': 'ਭੂਮਿਕਾ', 'Address': 'ਪਤਾ', 'Joined': 'ਸ਼ਾਮਲ ਹੋਏ',
  },
};

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });
const originals = new WeakMap();
const rendered = new WeakMap();

function translateString(value, language) {
  if (language === 'en' || !value?.trim()) return value;
  const dictionary = translations[language] || {};
  if (dictionary[value.trim()]) return value.replace(value.trim(), dictionary[value.trim()]);
  const hello = value.trim().match(/^Hello,\s+(.+)$/);
  if (hello && dictionary.Hello) return value.replace(value.trim(), `${dictionary.Hello}, ${hello[1]}`);
  const villagers = value.trim().match(/^Villagers\s+(\(\d+\))$/);
  if (villagers && dictionary.Villagers) return value.replace(value.trim(), `${dictionary.Villagers} ${villagers[1]}`);
  return value;
}

function translateElement(root, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION'].includes(node.parentElement?.tagName)) continue;
    const last = rendered.get(node);
    if (!originals.has(node) || (last !== undefined && node.nodeValue !== last)) originals.set(node, node.nodeValue);
    const next = translateString(originals.get(node), language);
    if (node.nodeValue !== next) node.nodeValue = next;
    rendered.set(node, next);
  }
  root.querySelectorAll?.('[placeholder], [title], option').forEach((element) => {
    const key = element.tagName === 'OPTION' ? 'textContent' : element.hasAttribute('placeholder') ? 'placeholder' : 'title';
    const storageKey = `i18n${key}`;
    if (!element.dataset[storageKey]) element.dataset[storageKey] = element[key];
    const next = translateString(element.dataset[storageKey], language);
    if (element[key] !== next) element[key] = next;
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en');
  const setLanguage = (value) => { localStorage.setItem('language', value); setLanguageState(value); };
  useEffect(() => {
    document.documentElement.lang = language;
    translateElement(document.body, language);
    const observer = new MutationObserver(() => translateElement(document.body, language));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
