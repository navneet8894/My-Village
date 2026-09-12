// The 22 Eighth Schedule languages, plus English. Codes remain stable in storage.
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', tag: 'en-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', tag: 'as-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', tag: 'bn-IN' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', tag: 'brx-IN' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', tag: 'doi-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', tag: 'gu-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', tag: 'hi-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', tag: 'kn-IN' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', tag: 'ks-Arab-IN', dir: 'rtl' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', tag: 'kok-IN' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', tag: 'mai-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', tag: 'ml-IN' },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', tag: 'mni-Mtei-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', tag: 'mr-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', tag: 'ne-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', tag: 'or-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', tag: 'pa-Guru-IN' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', tag: 'sa-IN' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', tag: 'sat-Olck-IN' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', tag: 'sd-Arab-IN', dir: 'rtl' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', tag: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', tag: 'te-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', tag: 'ur-IN', dir: 'rtl' },
];

const byCode = new Map(languages.map(language => [language.code, language]));
export function normalizeLanguage(value) {
  const code = typeof value === 'string' ? value.toLowerCase().replaceAll('_', '-').split('-')[0] : '';
  return byCode.has(code) ? code : 'en';
}
export function getLanguage(value) { return byCode.get(normalizeLanguage(value)); }

export function readLanguagePreference(storage) {
  try { return normalizeLanguage(storage?.getItem('language')); }
  catch { return 'en'; }
}
