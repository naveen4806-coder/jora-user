(function () {
  'use strict';
  if (window.JoraLanguage) return;

  var sources = new WeakMap();
  var attributeSources = new WeakMap();
  var supported = { en: true, hi: true, ta: true };
  var dictionary = {
    hi: {
      'Home': 'होम', 'Shops': 'दुकानें', 'Products': 'उत्पाद', 'Account': 'खाता', 'My Profile': 'मेरी प्रोफ़ाइल', 'Settings': 'सेटिंग्स',
      'Wishlist': 'विशलिस्ट', 'Saved products': 'सहेजे गए उत्पाद', 'My orders': 'मेरे ऑर्डर', 'Track purchases': 'खरीदारी ट्रैक करें',
      'Cart': 'कार्ट', 'Review items before checkout': 'चेकआउट से पहले आइटम देखें', 'Wallet': 'वॉलेट', 'Payments and credits': 'भुगतान और क्रेडिट',
      'Back to account': 'खाते पर वापस', 'Back to Home': 'होम पर वापस', 'Back': 'वापस', 'All shops': 'सभी दुकानें',
      'Welcome to Jora': 'Jora में आपका स्वागत है', 'Log in': 'लॉग इन', 'Create an account': 'खाता बनाएँ', 'Sign in': 'साइन इन', 'Sign up': 'साइन अप',
      'About Jora and support': 'Jora के बारे में और सहायता', 'ABOUT JORA': 'JORA के बारे में',
      'Your account': 'आपका खाता', 'Shopping, delivery and payment preferences in one place.': 'खरीदारी, डिलीवरी और भुगतान प्राथमिकताएँ एक ही जगह।',
      'Your cart': 'आपका कार्ट', 'Your cart is empty.': 'आपका कार्ट खाली है।', 'Browse products': 'उत्पाद देखें', 'Continue to checkout': 'चेकआउट जारी रखें',
      'No saved products yet.': 'अभी कोई सहेजा हुआ उत्पाद नहीं है।', 'No orders yet.': 'अभी कोई ऑर्डर नहीं है।', 'Loading orders': 'ऑर्डर लोड हो रहे हैं',
      'Available balance': 'उपलब्ध बैलेंस', 'No wallet activity yet.': 'अभी कोई वॉलेट गतिविधि नहीं है।',
      'Checkout': 'चेकआउट', 'Delivery details': 'डिलीवरी विवरण', 'Order summary': 'ऑर्डर सारांश', 'Subtotal': 'उप-योग', 'Delivery': 'डिलीवरी', 'Free': 'निःशुल्क', 'Total': 'कुल',
      'Payment method': 'भुगतान विधि', 'Cash on delivery': 'कैश ऑन डिलीवरी', 'Pay when your order arrives.': 'ऑर्डर पहुँचने पर भुगतान करें।',
      'Place order': 'ऑर्डर करें', 'Placing order…': 'ऑर्डर किया जा रहा है…', 'Use my location': 'मेरा स्थान उपयोग करें',
      'Choose delivery location': 'डिलीवरी स्थान चुनें', 'Search': 'खोजें', 'Location': 'स्थान', 'Loading map…': 'मैप लोड हो रहा है…', 'Save delivery location': 'डिलीवरी स्थान सहेजें',
      'Search products, shops…': 'उत्पाद, दुकानें खोजें…', 'Search products, shops...': 'उत्पाद, दुकानें खोजें…',
      'Nearby shops': 'आस-पास की दुकानें', 'Loading': 'लोड हो रहा है', 'Product': 'उत्पाद', 'Item': 'आइटम',
      'Placed': 'ऑर्डर किया गया', 'Confirmed': 'पुष्ट', 'Packed': 'पैक किया गया', 'Shipped': 'डिलीवरी पार्टनर को सौंपा गया', 'Out for Delivery': 'डिलीवरी के लिए निकला', 'Delivered': 'डिलीवर हुआ', 'Cancelled': 'रद्द किया गया',
      'How Jora works': 'Jora कैसे काम करता है', 'Orders and delivery': 'ऑर्डर और डिलीवरी', 'Need help?': 'मदद चाहिए?', 'Explore Jora': 'Jora देखें',
      'Theme': 'थीम', 'Language': 'भाषा', 'Logout': 'लॉग आउट', 'Kids Mode': 'किड्स मोड'
    },
    ta: {
      'Home': 'முகப்பு', 'Shops': 'கடைகள்', 'Products': 'தயாரிப்புகள்', 'Account': 'கணக்கு', 'My Profile': 'என் சுயவிவரம்', 'Settings': 'அமைப்புகள்',
      'Wishlist': 'விருப்பப்பட்டியல்', 'Saved products': 'சேமித்த தயாரிப்புகள்', 'My orders': 'என் ஆர்டர்கள்', 'Track purchases': 'வாங்குதல்களைக் கண்காணிக்கவும்',
      'Cart': 'கார்ட்', 'Review items before checkout': 'செக்அவுட்டுக்கு முன் பொருட்களைப் பார்க்கவும்', 'Wallet': 'வாலெட்', 'Payments and credits': 'பணப்பரிவர்த்தனைகள் மற்றும் கிரெடிட்கள்',
      'Back to account': 'கணக்கிற்குத் திரும்பு', 'Back to Home': 'முகப்பிற்குத் திரும்பு', 'Back': 'பின்', 'All shops': 'அனைத்து கடைகள்',
      'Welcome to Jora': 'Jora-க்கு வரவேற்கிறோம்', 'Log in': 'உள்நுழைய', 'Create an account': 'கணக்கை உருவாக்கவும்', 'Sign in': 'உள்நுழைய', 'Sign up': 'பதிவு செய்யவும்',
      'About Jora and support': 'Jora பற்றி மற்றும் உதவி', 'ABOUT JORA': 'JORA பற்றி',
      'Your account': 'உங்கள் கணக்கு', 'Shopping, delivery and payment preferences in one place.': 'ஷாப்பிங், டெலிவரி மற்றும் கட்டண விருப்பங்கள் ஒரே இடத்தில்.',
      'Your cart': 'உங்கள் கார்ட்', 'Your cart is empty.': 'உங்கள் கார்ட் காலியாக உள்ளது.', 'Browse products': 'தயாரிப்புகளைப் பார்க்கவும்', 'Continue to checkout': 'செக்அவுட்டைத் தொடரவும்',
      'No saved products yet.': 'இன்னும் சேமித்த தயாரிப்புகள் இல்லை.', 'No orders yet.': 'இன்னும் ஆர்டர்கள் இல்லை.', 'Loading orders': 'ஆர்டர்கள் ஏற்றப்படுகின்றன',
      'Available balance': 'கிடைக்கும் இருப்பு', 'No wallet activity yet.': 'இன்னும் வாலெட் செயல்பாடு இல்லை.',
      'Checkout': 'செக்அவுட்', 'Delivery details': 'டெலிவரி விவரங்கள்', 'Order summary': 'ஆர்டர் சுருக்கம்', 'Subtotal': 'துணைத் தொகை', 'Delivery': 'டெலிவரி', 'Free': 'இலவசம்', 'Total': 'மொத்தம்',
      'Payment method': 'கட்டண முறை', 'Cash on delivery': 'டெலிவரியில் பணம்', 'Pay when your order arrives.': 'ஆர்டர் வந்ததும் பணம் செலுத்தவும்.',
      'Place order': 'ஆர்டர் செய்யவும்', 'Placing order…': 'ஆர்டர் செய்யப்படுகிறது…', 'Use my location': 'என் இருப்பிடத்தைப் பயன்படுத்து',
      'Choose delivery location': 'டெலிவரி இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்', 'Search': 'தேடுக', 'Location': 'இருப்பிடம்', 'Loading map…': 'வரைபடம் ஏற்றப்படுகிறது…', 'Save delivery location': 'டெலிவரி இருப்பிடத்தைச் சேமிக்கவும்',
      'Search products, shops…': 'தயாரிப்புகள், கடைகளைத் தேடுக…', 'Search products, shops...': 'தயாரிப்புகள், கடைகளைத் தேடுக…',
      'Nearby shops': 'அருகிலுள்ள கடைகள்', 'Loading': 'ஏற்றப்படுகிறது', 'Product': 'தயாரிப்பு', 'Item': 'பொருள்',
      'Placed': 'ஆர்டர் செய்யப்பட்டது', 'Confirmed': 'உறுதிப்படுத்தப்பட்டது', 'Packed': 'பேக் செய்யப்பட்டது', 'Shipped': 'டெலிவரி கூட்டாளரிடம் ஒப்படைக்கப்பட்டது', 'Out for Delivery': 'டெலிவரிக்கு புறப்பட்டது', 'Delivered': 'டெலிவரி செய்யப்பட்டது', 'Cancelled': 'ரத்து செய்யப்பட்டது',
      'How Jora works': 'Jora எப்படி செயல்படுகிறது', 'Orders and delivery': 'ஆர்டர்கள் மற்றும் டெலிவரி', 'Need help?': 'உதவி தேவையா?', 'Explore Jora': 'Jora-வைப் பாருங்கள்',
      'Theme': 'தீம்', 'Language': 'மொழி', 'Logout': 'வெளியேறு', 'Kids Mode': 'குழந்தைகள் பயன்முறை'
    }
  };

  function language() { var code = localStorage.getItem('ls_lang') || localStorage.getItem('jora_language') || 'en'; return supported[code] ? code : 'en'; }
  function translate(value, code) { if (!value || code === 'en') return value; var match = String(value).match(/^(\s*)([\s\S]*?)(\s*)$/), translated = (dictionary[code] || {})[match[2]]; return translated ? match[1] + translated + match[3] : value; }
  function ignored(node) { var parent = node.parentElement; return !parent || parent.closest('[data-jora-no-translate]') || /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(parent.tagName) || parent.closest('script,style,noscript,code,pre'); }
  function translateText(node, code) { if (node.nodeType !== Node.TEXT_NODE || ignored(node) || !node.nodeValue.trim()) return; if (!sources.has(node)) sources.set(node, node.nodeValue); var next = translate(sources.get(node), code); if (node.nodeValue !== next) node.nodeValue = next; }
  function translateAttribute(element, name, code) { if (!element.hasAttribute(name) || element.closest('[data-jora-no-translate]')) return; var saved = attributeSources.get(element); if (!saved) { saved = {}; attributeSources.set(element, saved); } if (saved[name] === undefined) saved[name] = element.getAttribute(name); var next = translate(saved[name], code); if (element.getAttribute(name) !== next) element.setAttribute(name, next); }
  function translateTree(root, code) { if (!root) return; if (root.nodeType === Node.TEXT_NODE) { translateText(root, code); return; } if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root !== document) return; var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), node; while ((node = walker.nextNode())) translateText(node, code); if (root.nodeType === Node.ELEMENT_NODE) ['placeholder', 'title', 'aria-label', 'alt'].forEach(function (name) { translateAttribute(root, name, code); }); if (root.querySelectorAll) root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(function (element) { ['placeholder', 'title', 'aria-label', 'alt'].forEach(function (name) { translateAttribute(element, name, code); }); }); }
  function apply(code) { code = supported[code] ? code : language(); document.documentElement.lang = code; document.documentElement.dataset.language = code; translateTree(document.body, code); return code; }
  function set(code) { code = supported[code] ? code : 'en'; localStorage.setItem('ls_lang', code); localStorage.setItem('jora_language', code); apply(code); window.dispatchEvent(new CustomEvent('jora-language-change', { detail: { language: code } })); return code; }
  function money(value) { var code = language(), locale = code === 'hi' ? 'hi-IN' : code === 'ta' ? 'ta-IN' : 'en-IN'; return new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0); }

  window.JoraLanguage = { get: language, set: set, apply: apply, translate: function (value) { return translate(value, language()); }, money: money };
  var pending = false;
  new MutationObserver(function (records) { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; var code = language(); records.forEach(function (record) { if (record.type === 'characterData') translateText(record.target, code); record.addedNodes.forEach(function (node) { translateTree(node, code); }); }); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener('storage', function (event) { if (event.key === 'ls_lang' || event.key === 'jora_language') apply(language()); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(language()); }, { once: true }); else apply(language());
}());
