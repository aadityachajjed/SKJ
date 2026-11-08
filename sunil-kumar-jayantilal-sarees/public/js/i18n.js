// Sunil Kumar Jayantilal - Bilingual Internationalization (Hindi & English)

const translations = {
  en: {
    // Header & Brand
    shop_name: "Sunil Kumar Jayantilal",
    tagline: "Wholesale Sarees at the Right Price",
    nav_home: "Home",
    nav_shop: "Shop Sarees",
    nav_categories: "Categories",
    nav_cart: "My Cart",
    nav_contact: "Contact Us",
    nav_admin: "Admin Login",
    nav_orders: "Track Order",

    // Announcement
    top_announcement: "Special Wholesale Festive Sets In Stock • Delivery Across All India • Direct WhatsApp Enquiry",

    // Hero Section
    hero_badge: "M.T. CLOTH MARKET, INDORE • GENUINE WHOLESALE",
    hero_title_1: "Wholesale Sarees at the",
    hero_title_2: "Right Price",
    hero_subtitle: "Buy complete original saree sets directly from Indore's prestigious M.T. Cloth Market. Transparent set quantities, beautiful colours, and fast transport booking.",
    hero_btn_shop: "Shop Saree Sets",
    hero_btn_whatsapp: "WhatsApp Enquiry",
    trust_wholesale_sets: "100% Wholesale Sets Only",
    trust_genuine_rates: "Direct Market Rates",
    trust_fast_transport: "All-India Transport",

    // Categories
    cat_section_title: "Browse by Category",
    cat_section_subtitle: "POPULAR WHOLESALE FABRICS",
    cat_all: "All Sarees",

    // Catalogue
    catalogue_title: "Latest Saree Collections",
    catalogue_subtitle: "COMPLETE WHOLESALE SETS",
    search_placeholder: "Search sarees by name, SKU code (e.g. SKJ001), fabric...",
    filter_all: "All Collections",
    filter_in_stock: "In Stock Only",
    set_label: "Set",
    sarees_per_set_badge: "1 Set = {count} Sarees",
    colours_available: "{count} Colours Available",
    price_per_set: "₹{price} / Set",
    available_sets: "{count} Sets Available",
    out_of_stock: "Out of Stock",
    btn_view_details: "View Details",
    btn_add_to_cart: "Add to Cart",

    // Product Detail
    product_code_label: "Product Code",
    fabric_label: "Fabric",
    design_label: "Design",
    minimum_order_label: "Min Order",
    set_quantity_box_title: "Wholesale Set Guarantee",
    set_quantity_box_desc: "This product is strictly sold as a complete set. 1 Set contains {count} sarees.",
    colours_included_title: "Colours Included in This Set",
    colours_included_note: "Tap any colour to view matching saree photograph",
    qty_selector_label: "Number of Sets",
    sarees_calc_label: "Total Sarees Included",
    total_price_label: "Total Price",
    btn_add_set_to_cart: "Add {count} Set(s) to Cart",
    btn_enquire_whatsapp: "Enquire on WhatsApp",
    zoom_hint: "Click photo to enlarge",

    // Cart
    cart_title: "Wholesale Shopping Cart",
    cart_empty_title: "Your Cart is Empty",
    cart_empty_desc: "Add wholesale saree sets from our catalogue to proceed with your order.",
    cart_btn_browse: "Browse Saree Collections",
    cart_sets_count: "Sets",
    cart_total_sarees: "Total: {sarees} Sarees",
    cart_subtotal: "Order Subtotal",
    cart_delivery_note: "Transport delivery charges payable directly to transport company on delivery",
    cart_btn_checkout: "Proceed to Wholesale Order",
    cart_btn_continue: "Continue Shopping",

    // Checkout
    checkout_title: "Wholesale Order Request",
    checkout_subtitle: "Enter your retailer details to submit order or send directly via WhatsApp",
    label_full_name: "Retailer / Business Name *",
    placeholder_full_name: "e.g. Ramesh Saree Store (Ramesh Kumar)",
    label_mobile: "Mobile Number (WhatsApp) *",
    placeholder_mobile: "10-digit mobile number",
    label_address: "Shop / Delivery Address *",
    placeholder_address: "Shop number, street, landmark...",
    label_city: "City / Town *",
    label_state: "State *",
    label_pincode: "PIN Code *",
    label_notes: "Transport / Packaging Instructions (Optional)",
    placeholder_notes: "Mention preferred transport (e.g. Indore-Gwalior Transport, Jain Travels) or special requirements",
    order_summary_title: "Order Summary",
    btn_submit_order: "Submit Wholesale Order",
    btn_send_whatsapp_order: "Send Order on WhatsApp",

    // Confirmation
    confirmation_title: "Order Request Received!",
    confirmation_status_notice: "Your order request has been received. The shop will contact you at {phone} for final confirmation.",
    order_ref_label: "Order Reference",
    confirmation_btn_whatsapp: "Chat with Shop on WhatsApp",
    confirmation_btn_continue: "Return to Shop",

    // Order Tracking Lookup
    track_title: "Check Order Status",
    track_placeholder: "Enter 10-digit Mobile Number or Order No (e.g. SKJ-2026-1001)",
    btn_track: "Lookup Order",

    // Contact & Shop Info
    contact_section_title: "Visit Our Shop in Indore",
    contact_section_subtitle: "MT CLOTH MARKET HERITAGE",
    shop_address_title: "Shop Address",
    shop_address_value: "62/2 Jawahar Gate, M.T. Cloth Market, Indore, Madhya Pradesh",
    shop_phone_title: "Phone & WhatsApp",
    btn_call_now: "Call Now",
    btn_whatsapp_us: "WhatsApp Us",
    btn_get_directions: "Get Directions",

    // Toasts & Alerts
    toast_added_to_cart: "Added {name} ({sets} Set) to cart!",
    toast_max_stock: "Cannot add more sets. Only {max} sets available in stock.",
    toast_error: "Something went wrong. Please try again."
  },

  hi: {
    // Header & Brand
    shop_name: "सुनील कुमार जयंतीलाल",
    tagline: "थोक भाव में साड़ियों की शानदार वैरायटी",
    nav_home: "होम",
    nav_shop: "साड़ियां देखें",
    nav_categories: "कैटेगरी",
    nav_cart: "मेरी कार्ट",
    nav_contact: "संपर्क करें",
    nav_admin: "एडमिन लॉगिन",
    nav_orders: "ऑर्डर देखें",

    // Announcement
    top_announcement: "त्योहारी सीजन के नए थोक साड़ी सेट्स उपलब्ध • पूरे भारत में ट्रांसपोर्ट डिलीवरी • व्हाट्सएप पर सीधा संपर्क",

    // Hero Section
    hero_badge: "एम.टी. क्लॉथ मार्केट, इंदौर • असली थोक व्यापार",
    hero_title_1: "थोक भाव में साड़ियों की",
    hero_title_2: "शानदार वैरायटी",
    hero_subtitle: "इंदौर के प्रतिष्ठित एम.टी. क्लॉथ मार्केट से सीधे पूरे साड़ी सेट्स खरीदें। पूरी सेट गारंटी, मनमोहक रंग और तेज ट्रांसपोर्ट सुविधा।",
    hero_btn_shop: "साड़ी सेट्स देखें",
    hero_btn_whatsapp: "व्हाट्सएप पर पूछें",
    trust_wholesale_sets: "100% केवल थोक सेट्स",
    trust_genuine_rates: "सीधा होलसेल भाव",
    trust_fast_transport: "ऑल इंडिया ट्रांसपोर्ट",

    // Categories
    cat_section_title: "कैटेगरी अनुसार देखें",
    cat_section_subtitle: "लोकप्रिय थोक फैब्रिक्स",
    cat_all: "सभी साड़ियां",

    // Catalogue
    catalogue_title: "नवीनतम साड़ी कलेक्शंस",
    catalogue_subtitle: "पूरे थोक सेट्स",
    search_placeholder: "साड़ी का नाम, कोड (जैसे SKJ001), फैब्रिक खोजें...",
    filter_all: "सभी वैरायटी",
    filter_in_stock: "केवल स्टॉक में उपलब्ध",
    set_label: "सेट",
    sarees_per_set_badge: "1 सेट = {count} साड़ियां",
    colours_available: "{count} रंग उपलब्ध",
    price_per_set: "₹{price} / सेट",
    available_sets: "{count} सेट्स उपलब्ध",
    out_of_stock: "स्टॉक समाप्त",
    btn_view_details: "डिटेल्स देखें",
    btn_add_to_cart: "कार्ट में जोड़ें",

    // Product Detail
    product_code_label: "प्रोडक्ट कोड",
    fabric_label: "कपड़ा (Fabric)",
    design_label: "डिज़ाइन",
    minimum_order_label: "न्यूनतम आर्डर",
    set_quantity_box_title: "थोक सेट गारंटी",
    set_quantity_box_desc: "यह साड़ी केवल पूरे सेट में ही बेची जाती है। 1 सेट में {count} साड़ियां शामिल हैं।",
    colours_included_title: "इस सेट में शामिल सभी रंग",
    colours_included_note: "उस रंग की साड़ी की फोटो देखने के लिए किसी भी रंग पर टैप करें",
    qty_selector_label: "सेट्स की संख्या चुनें",
    sarees_calc_label: "कुल साड़ियों की संख्या",
    total_price_label: "कुल कीमत",
    btn_add_set_to_cart: "{count} सेट कार्ट में जोड़ें",
    btn_enquire_whatsapp: "व्हाट्सएप पर पूछताछ करें",
    zoom_hint: "बड़ी फोटो देखने के लिए टैप करें",

    // Cart
    cart_title: "थोक शॉपिंग कार्ट",
    cart_empty_title: "आपकी कार्ट खाली है",
    cart_empty_desc: "ऑर्डर देने के लिए कृपया हमारी कैटलॉग से साड़ी सेट्स जोड़ें।",
    cart_btn_browse: "साड़ियां देखना शुरू करें",
    cart_sets_count: "सेट्स",
    cart_total_sarees: "कुल: {sarees} साड़ियां",
    cart_subtotal: "ऑर्डर कुल राशि",
    cart_delivery_note: "ट्रांसपोर्ट भाड़ा डिलीवरी के समय ट्रांसपोर्ट कंपनी को देय होगा",
    cart_btn_checkout: "थोक ऑर्डर आगे बढ़ाएं",
    cart_btn_continue: "और खरीदारी करें",

    // Checkout
    checkout_title: "थोक ऑर्डर अनुरोध (Order Request)",
    checkout_subtitle: "वेबसाइट पर ऑर्डर दर्ज करने या व्हाट्सएप पर सीधा भेजने के लिए अपनी दुकान का विवरण भरें",
    label_full_name: "व्यापारी / दुकान का नाम *",
    placeholder_full_name: "उदा. रमेश साड़ी भंडार (रमेश कुमार)",
    label_mobile: "मोबाइल नंबर (WhatsApp) *",
    placeholder_mobile: "10 अंकों का मोबाइल नंबर",
    label_address: "दुकान / डिलीवरी का पता *",
    placeholder_address: "दुकान नंबर, बाजार, लैंडमार्क...",
    label_city: "शहर *",
    label_state: "राज्य *",
    label_pincode: "पिन कोड *",
    label_notes: "ट्रांसपोर्ट / पैकेजिंग निर्देश (वैकल्पिक)",
    placeholder_notes: "पसंदीदा ट्रांसपोर्ट का नाम लिखें (जैसे इंदौर-ग्वालियर ट्रांसपोर्ट) या विशेष निर्देश",
    order_summary_title: "ऑर्डर सारांश",
    btn_submit_order: "थोक ऑर्डर सबमिट करें",
    btn_send_whatsapp_order: "व्हाट्सएप पर ऑर्डर भेजें",

    // Confirmation
    confirmation_title: "ऑर्डर अनुरोध प्राप्त हुआ!",
    confirmation_status_notice: "आपका ऑर्डर अनुरोध दर्ज कर लिया गया है। अंतिम पुष्टि के लिए दुकान संचालक आपसे {phone} पर शीघ्र संपर्क करेंगे।",
    order_ref_label: "ऑर्डर नंबर",
    confirmation_btn_whatsapp: "व्हाट्सएप पर दुकान से बात करें",
    confirmation_btn_continue: "दुकान पर वापस जाएं",

    // Order Tracking Lookup
    track_title: "ऑर्डर की स्थिति जांचें",
    track_placeholder: "10 अंकों का मोबाइल नंबर या ऑर्डर नंबर (जैसे SKJ-2026-1001) डालें",
    btn_track: "ऑर्डर खोजें",

    // Contact & Shop Info
    contact_section_title: "इंदौर में हमारी दुकान पर पधारें",
    contact_section_subtitle: "एम.टी. क्लॉथ मार्केट की विरासत",
    shop_address_title: "दुकान का पता",
    shop_address_value: "62/2 जवाहर गेट, एम.टी. क्लॉथ मार्केट, इंदौर, मध्य प्रदेश",
    shop_phone_title: "फोन एवं व्हाट्सएप",
    btn_call_now: "कॉल करें",
    btn_whatsapp_us: "व्हाट्सएप करें",
    btn_get_directions: "रास्ता देखें (Google Maps)",

    // Toasts & Alerts
    toast_added_to_cart: "{name} ({sets} सेट) कार्ट में जोड़ा गया!",
    toast_max_stock: "स्टॉक में केवल {max} सेट ही उपलब्ध हैं।",
    toast_error: "कुछ गड़बड़ हुई। कृपया पुन: प्रयास करें।"
  }
};

let currentLang = localStorage.getItem('skj_lang') || 'hi';

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (lang !== 'en' && lang !== 'hi') lang = 'hi';
  currentLang = lang;
  localStorage.setItem('skj_lang', lang);
  document.documentElement.lang = lang;
  updatePageTranslations();
  // Dispatch custom event for dynamic components
  window.dispatchEvent(new CustomEvent('skj_lang_changed', { detail: { lang: lang } }));
}

function t(key, params) {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(function(pKey) {
      text = text.replace(new RegExp('\\{' + pKey + '\\}', 'g'), params[pKey]);
    });
  }
  return text;
}

function updatePageTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(function(el) {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(function(el) {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  // Update active state in toggle buttons
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(function(btn) {
    if (btn.getAttribute('data-lang') === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initialise language on page load
document.addEventListener('DOMContentLoaded', function() {
  document.documentElement.lang = currentLang;
  updatePageTranslations();
});
