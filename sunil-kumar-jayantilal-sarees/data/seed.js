const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

const adminSalt = crypto.randomBytes(16).toString('hex');
const adminHash = hashPassword('admin123', adminSalt);

// High quality SVG image generator for realistic saree visuals
function generateSareeSVG(title, colourName, hex, patternType) {
  let pattern = '';
  if (patternType === 'bandhani') {
    pattern = `
      <pattern id="bandhani-${hex.replace('#','')}" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="2.5" fill="#FFF9F0" opacity="0.8"/>
        <circle cx="18" cy="18" r="2.5" fill="#FFF9F0" opacity="0.8"/>
        <circle cx="18" cy="6" r="1.5" fill="#B9975B" opacity="0.7"/>
        <circle cx="6" cy="18" r="1.5" fill="#B9975B" opacity="0.7"/>
      </pattern>
      <rect width="600" height="750" fill="url(#bandhani-${hex.replace('#','')})"/>
    `;
  } else if (patternType === 'zari_border') {
    pattern = `
      <line x1="50" y1="0" x2="50" y2="750" stroke="#B9975B" stroke-width="24" stroke-dasharray="12,6"/>
      <line x1="85" y1="0" x2="85" y2="750" stroke="#B9975B" stroke-width="4"/>
      <line x1="515" y1="0" x2="515" y2="750" stroke="#B9975B" stroke-width="4"/>
      <line x1="550" y1="0" x2="550" y2="750" stroke="#B9975B" stroke-width="24" stroke-dasharray="12,6"/>
      <rect x="0" y="580" width="600" height="170" fill="#B9975B" opacity="0.3"/>
      <line x1="0" y1="580" x2="600" y2="580" stroke="#B9975B" stroke-width="12"/>
      <circle cx="300" cy="660" r="45" fill="none" stroke="#B9975B" stroke-width="5"/>
    `;
  } else if (patternType === 'floral_print') {
    pattern = `
      <pattern id="floral-${hex.replace('#','')}" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="4" fill="#B9975B" opacity="0.7"/>
        <ellipse cx="20" cy="12" rx="3" ry="5" fill="#FFF" opacity="0.4"/>
        <ellipse cx="20" cy="28" rx="3" ry="5" fill="#FFF" opacity="0.4"/>
        <ellipse cx="12" cy="20" rx="5" ry="3" fill="#FFF" opacity="0.4"/>
        <ellipse cx="28" cy="20" rx="5" ry="3" fill="#FFF" opacity="0.4"/>
      </pattern>
      <rect width="600" height="750" fill="url(#floral-${hex.replace('#','')})"/>
    `;
  } else if (patternType === 'checks') {
    pattern = `
      <pattern id="checks-${hex.replace('#','')}" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#B9975B" stroke-width="1.5" opacity="0.6"/>
      </pattern>
      <rect width="600" height="750" fill="url(#checks-${hex.replace('#','')})"/>
      <rect x="0" y="600" width="600" height="150" fill="#B9975B" opacity="0.3"/>
    `;
  } else if (patternType === 'brocade') {
    pattern = `
      <pattern id="brocade-${hex.replace('#','')}" width="48" height="48" patternUnits="userSpaceOnUse">
        <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="#B9975B" stroke-width="2" opacity="0.75"/>
        <circle cx="24" cy="24" r="5" fill="#B9975B" opacity="0.9"/>
      </pattern>
      <rect width="600" height="750" fill="url(#brocade-${hex.replace('#','')})"/>
      <rect x="0" y="520" width="600" height="230" fill="#B9975B" opacity="0.35"/>
      <line x1="0" y1="520" x2="600" y2="520" stroke="#B9975B" stroke-width="16"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad-${hex.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${hex}" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="${hex}" stop-opacity="1.0"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
      </filter>
    </defs>
    <!-- Background Fabric Base -->
    <rect width="600" height="750" fill="url(#bgGrad-${hex.replace('#','')})"/>
    
    <!-- Fabric Weave / Pattern -->
    ${pattern}
    
    <!-- Decorative Pallu / Border Accent -->
    <rect x="30" y="30" width="540" height="690" rx="8" fill="none" stroke="#B9975B" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>
    
    <!-- Saree Fold Simulation Gradient -->
    <rect x="0" y="0" width="140" height="750" fill="black" opacity="0.12"/>
    <rect x="460" y="0" width="140" height="750" fill="black" opacity="0.08"/>

    <!-- Wholesale Set Badge on Image -->
    <g transform="translate(40, 50)" filter="url(#shadow)">
      <rect width="180" height="38" rx="6" fill="#641E32"/>
      <text x="90" y="24" fill="#FFF9F0" font-family="'Poppins', sans-serif" font-size="13" font-weight="700" text-anchor="middle">SKJ WHOLESALE</text>
    </g>

    <!-- Colour Pill Banner -->
    <g transform="translate(40, 640)" filter="url(#shadow)">
      <rect width="520" height="64" rx="8" fill="#FFF9F0" fill-opacity="0.95"/>
      <circle cx="45" cy="32" r="18" fill="${hex}" stroke="#B9975B" stroke-width="2"/>
      <text x="80" y="28" fill="#292524" font-family="'Poppins', sans-serif" font-size="17" font-weight="700">${title}</text>
      <text x="80" y="48" fill="#641E32" font-family="'Poppins', sans-serif" font-size="13" font-weight="600">Colour: ${colourName} • Wholesale Set Piece</text>
    </g>
  </svg>`;
}

const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate image files for each product colour
const productsData = [
  {
    id: "prod-001",
    product_code: "SKJ001",
    name_en: "Fancy Bandhani Printed Georgette Saree Set",
    name_hi: "फैंसी बांधनी प्रिंटेड जॉर्जेट साड़ी सेट",
    description_en: "Premium Georgette bandhani printed saree set with attractive zari border and running blouse piece. Highly popular fast-selling wholesale item for boutiques and retail counters.",
    description_hi: "प्रीमियम जॉर्जेट बांधनी प्रिंटेड साड़ी सेट आकर्षक ज़री बॉर्डर और रनिंग ब्लाउज के साथ। बुटीक और रीटेल दुकानों के लिए सबसे ज्यादा बिकने वाला थोक सेट।",
    category_id: "cat-printed",
    fabric_type: "Pure Georgette",
    design_type: "Traditional Bandhani Jaipuri Print",
    price_per_set: 3300,
    sarees_per_set: 6,
    available_sets: 25,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "bandhani",
    colours: [
      { name_en: "Marwar Crimson Red", name_hi: "मारवाड़ लाल", hex: "#C81D25", qty: 1 },
      { name_en: "Royal Rani Pink", name_hi: "शाही रानी गुलाबी", hex: "#E91E63", qty: 1 },
      { name_en: "Peacock Royal Blue", name_hi: "मयूर रॉयल ब्लू", hex: "#1A508B", qty: 1 },
      { name_en: "Emerald Green", name_hi: "पन्ना हरा", hex: "#1B5E20", qty: 1 },
      { name_en: "Haldi Mustard Yellow", name_hi: "हल्दी पीला", hex: "#F59E0B", qty: 1 },
      { name_en: "Deep Violet Purple", name_hi: "गहरा जामुनी बैंगनी", hex: "#6D28D9", qty: 1 }
    ]
  },
  {
    id: "prod-002",
    product_code: "SKJ002",
    name_en: "Chanderi Silk Golden Zari Border Saree Set",
    name_hi: "चंदेरी सिल्क गोल्डन ज़री बॉर्डर साड़ी सेट",
    description_en: "Authentic Chanderi silk blend sarees featuring rich woven gold zari borders and rich pallu. Ideal for festive and party wear retail collections.",
    description_hi: "शुद्ध चंदेरी सिल्क ब्लेंड साड़ियां शानदार बुने हुए गोल्डन ज़री बॉर्डर और रिच पल्लू के साथ। त्योहार और पार्टी वियर के लिए उपयुक्त।",
    category_id: "cat-silk",
    fabric_type: "Chanderi Silk Blend",
    design_type: "Woven Gold Zari Border",
    price_per_set: 5200,
    sarees_per_set: 8,
    available_sets: 18,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "zari_border",
    colours: [
      { name_en: "Rich Wine Maroon", name_hi: "वाइन महरून", hex: "#641E32", qty: 1 },
      { name_en: "Dusty Peach Pink", name_hi: "डस्टी पीच गुलाबी", hex: "#F472B6", qty: 1 },
      { name_en: "Teal Turquoise Blue", name_hi: "फ़िरोज़ी नीला", hex: "#0E7490", qty: 1 },
      { name_en: "Bottle Olive Green", name_hi: "बॉटल ग्रीन", hex: "#14532D", qty: 1 },
      { name_en: "Bright Mango Yellow", name_hi: "मैंगो पीला", hex: "#FBBF24", qty: 1 },
      { name_en: "Lavender Lilac", name_hi: "लैवेंडर जामुनी", hex: "#8B5CF6", qty: 1 },
      { name_en: "Deep Navy Blue", name_hi: "नेवी ब्लू", hex: "#1E3A8A", qty: 1 },
      { name_en: "Sunset Coral Orange", name_hi: "नारंगी संतरी", hex: "#EA580C", qty: 1 }
    ]
  },
  {
    id: "prod-003",
    product_code: "SKJ003",
    name_en: "Daily Wear 100% Pure Cotton Printed Saree Set",
    name_hi: "डेली वियर 100% प्योर कॉटन प्रिंटेड साड़ी सेट",
    description_en: "All-day comfort pure cotton sarees with classic Bagru block prints. Breathable fabric, 100% colour fast guarantee. Perfect for daily wear demand.",
    description_hi: "आरामदायक प्योर सूती कॉटन साड़ियां क्लासिक बगरू ब्लॉक प्रिंट के साथ। टिकाऊ पक्का रंग, 100% गारंटी। रोजमर्रा की भारी मांग के लिए उत्तम।",
    category_id: "cat-cotton",
    fabric_type: "100% Pure Mulmul Cotton",
    design_type: "Bagru Block Floral Print",
    price_per_set: 4500,
    sarees_per_set: 10,
    available_sets: 30,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "floral_print",
    colours: [
      { name_en: "Brick Indigo Red", name_hi: "ईंट लाल", hex: "#B91C1C", qty: 1 },
      { name_en: "Indigo Block Navy", name_hi: "इंडिगो नीला", hex: "#1E40AF", qty: 1 },
      { name_en: "Forest Mint Green", name_hi: "मिंट हरा", hex: "#047857", qty: 1 },
      { name_en: "Mustard Gold Ochre", name_hi: "हल्दी गेरुआ", hex: "#D97706", qty: 1 },
      { name_en: "Charcoal Slate Grey", name_hi: "स्लेट ग्रे", hex: "#4B5563", qty: 1 },
      { name_en: "Rosewood Maroon", name_hi: "रोज़वुड महरून", hex: "#881337", qty: 1 },
      { name_en: "Pastel Sky Blue", name_hi: "आसमानी नीला", hex: "#0284C7", qty: 1 },
      { name_en: "Olive Mehendi Green", name_hi: "मेहंदी हरा", hex: "#4D7C0F", qty: 1 },
      { name_en: "Amber Rust Brown", name_hi: "कत्थई भूरा", hex: "#78350F", qty: 1 },
      { name_en: "Plum Berry Purple", name_hi: "बेरी जामुनी", hex: "#701A75", qty: 1 }
    ]
  },
  {
    id: "prod-004",
    product_code: "SKJ004",
    name_en: "Royal Banarasi Brocade Bridal Silk Saree Set",
    name_hi: "रॉयल बनारसी ब्रोकेड ब्राइडल सिल्क साड़ी सेट",
    description_en: "Heavy woven Banarasi brocade sarees with antique gold zari work and designer floral meenakari motifs. Royal wedding counter essential.",
    description_hi: "हैवी बुनाई वाली बनारसी ब्रोकेड साड़ियां विंटेज गोल्ड ज़री वर्क और मीनाकारी डिज़ाइन के साथ। शादी-ब्याह के ग्राहकों के लिए खास सेट।",
    category_id: "cat-designer",
    fabric_type: "Katan Silk Brocade",
    design_type: "Heavy Gold Zari Meenakari",
    price_per_set: 6800,
    sarees_per_set: 4,
    available_sets: 15,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "brocade",
    colours: [
      { name_en: "Bridal Sindoor Red", name_hi: "सिंदूरी दुल्हन लाल", hex: "#DC2626", qty: 1 },
      { name_en: "Rani Magenta Pink", name_hi: "रानी मजेंटा", hex: "#BE185D", qty: 1 },
      { name_en: "Kashi Royal Violet", name_hi: "काशी जामुनी", hex: "#581C87", qty: 1 },
      { name_en: "Shahi Bottle Green", name_hi: "शाही बॉटल ग्रीन", hex: "#064E3B", qty: 1 }
    ]
  },
  {
    id: "prod-005",
    product_code: "SKJ005",
    name_en: "Dola Silk Foil Print Party Wear Saree Set",
    name_hi: "डोला सिल्क फॉयल प्रिंट पार्टी वियर साड़ी सेट",
    description_en: "Soft touch glossy Dola Silk sarees embellished with delicate metallic foil motifs, satin border and matching designer blouse. Ultra light and high margin item.",
    description_hi: "सॉफ्ट और चमकदार डोला सिल्क साड़ियां चमकीले फॉयल वर्क, सैटिन बॉर्डर और मैचिंग डिज़ाइनर ब्लाउज के साथ। पहनने में बेहद हल्की और आकर्षक।",
    category_id: "cat-party",
    fabric_type: "Soft Dola Silk",
    design_type: "Metallic Foil Print & Lace Border",
    price_per_set: 3900,
    sarees_per_set: 6,
    available_sets: 22,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "floral_print",
    colours: [
      { name_en: "Cherry Ruby Red", name_hi: "चेरी रूबी लाल", hex: "#991B1B", qty: 1 },
      { name_en: "Baby Rose Pink", name_hi: "गुलाबी रोज़", hex: "#DB2777", qty: 1 },
      { name_en: "Midnight Cobalt Blue", name_hi: "कोबाल्ट नीला", hex: "#1D4ED8", qty: 1 },
      { name_en: "Pista Mint Green", name_hi: "पिस्ता हरा", hex: "#10B981", qty: 1 },
      { name_en: "Sunny Lemon Yellow", name_hi: "लेमन पीला", hex: "#EAB308", qty: 1 },
      { name_en: "Mauve Lavender Purple", name_hi: "लैवेंडर बैंगनी", hex: "#7C3AED", qty: 1 }
    ]
  },
  {
    id: "prod-006",
    product_code: "SKJ006",
    name_en: "Maheshwari Handloom Zari Checks Saree Set",
    name_hi: "महेश्वरी हैंडलूम ज़री चेक साड़ी सेट",
    description_en: "Authentic Madhya Pradesh heritage Maheshwari cotton-silk handloom checks with reversible zari border. Direct wholesale pricing from Indore MT Cloth Market.",
    description_hi: "मध्य प्रदेश की प्रसिद्ध महेश्वरी कॉटन-सिल्क हैंडलूम चेक साड़ियां दोनों तरफा ज़री बॉर्डर के साथ। इंदौर एम.टी. क्लॉथ मार्केट का सीधा थोक भाव।",
    category_id: "cat-fancy",
    fabric_type: "Maheshwari Cotton Silk",
    design_type: "Traditional Handloom Reversible Checks",
    price_per_set: 4200,
    sarees_per_set: 6,
    available_sets: 20,
    minimum_order_sets: 1,
    is_active: true,
    pattern: "checks",
    colours: [
      { name_en: "Gulaal Crimson Red", name_hi: "गुलाल लाल", hex: "#B91C1C", qty: 1 },
      { name_en: "Surajmukhi Golden Yellow", name_hi: "सूरजमुखी पीला", hex: "#D97706", qty: 1 },
      { name_en: "Neelkanth Royal Blue", name_hi: "नीलकंठ नीला", hex: "#1E40AF", qty: 1 },
      { name_en: "Parrot Tota Green", name_hi: "तोता हरा", hex: "#15803D", qty: 1 },
      { name_en: "Kashmiri Rani Pink", name_hi: "कश्मीरी रानी गुलाबी", hex: "#BE185D", qty: 1 },
      { name_en: "Kesar Saffron Orange", name_hi: "केसरिया संतरी", hex: "#C2410C", qty: 1 }
    ]
  }
];

// Generate images and build DB records
const products = [];
const product_colours = [];
const product_images = [];

productsData.forEach((p, pIdx) => {
  const mainImageFileName = `${p.product_code.toLowerCase()}-main.svg`;
  const mainImagePath = path.join(imagesDir, mainImageFileName);
  const mainSvg = generateSareeSVG(p.product_code, `${p.colours.length} Colour Set`, p.colours[0].hex, p.pattern);
  fs.writeFileSync(mainImagePath, mainSvg, 'utf8');

  const mainImageUrl = `/images/${mainImageFileName}`;

  const productRecord = {
    id: p.id,
    product_code: p.product_code,
    name_en: p.name_en,
    name_hi: p.name_hi,
    description_en: p.description_en,
    description_hi: p.description_hi,
    category_id: p.category_id,
    fabric_type: p.fabric_type,
    design_type: p.design_type,
    price_per_set: p.price_per_set,
    sarees_per_set: p.sarees_per_set,
    available_sets: p.available_sets,
    minimum_order_sets: p.minimum_order_sets,
    is_active: p.is_active,
    main_image: mainImageUrl,
    created_at: new Date(Date.now() - (6 - pIdx) * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  };
  products.push(productRecord);

  // Main image record
  product_images.push({
    id: `img-${p.product_code}-main`,
    product_id: p.id,
    colour_id: null,
    image_url: mainImageUrl,
    image_type: "main",
    display_order: 1,
    created_at: productRecord.created_at
  });

  // Colours
  p.colours.forEach((c, cIdx) => {
    const colourId = `col-${p.product_code}-${cIdx + 1}`;
    const colourFileName = `${p.product_code.toLowerCase()}-col-${cIdx + 1}.svg`;
    const colourFilePath = path.join(imagesDir, colourFileName);
    const colourSvg = generateSareeSVG(p.product_code, c.name_en, c.hex, p.pattern);
    fs.writeFileSync(colourFilePath, colourSvg, 'utf8');

    const colourImageUrl = `/images/${colourFileName}`;

    product_colours.push({
      id: colourId,
      product_id: p.id,
      colour_name_en: c.name_en,
      colour_name_hi: c.name_hi,
      hex_code: c.hex,
      quantity_in_set: c.qty,
      colour_image_url: colourImageUrl,
      display_order: cIdx + 1
    });

    product_images.push({
      id: `img-${p.product_code}-col-${cIdx + 1}`,
      product_id: p.id,
      colour_id: colourId,
      image_url: colourImageUrl,
      image_type: "colour",
      display_order: cIdx + 2,
      created_at: productRecord.created_at
    });
  });
});

const categories = [
  {
    id: "cat-printed",
    category_name_en: "Printed Sarees",
    category_name_hi: "प्रिंटेड साड़ियां",
    description_en: "Bandhani, Leheriya, Floral and Geometric prints for daily & festive demand",
    description_hi: "बांधनी, लहरिया, फ्लोरल और जयपुरी प्रिंट की साड़ियां",
    image_url: "/images/skj001-main.svg",
    is_active: true
  },
  {
    id: "cat-silk",
    category_name_en: "Silk Sarees",
    category_name_hi: "सिल्क साड़ियां",
    description_en: "Chanderi, Katan, Art Silk and Dola Silk festive collections",
    description_hi: "चंदेरी, कातन, आर्ट सिल्क और डोला सिल्क के शानदार सेट्स",
    image_url: "/images/skj002-main.svg",
    is_active: true
  },
  {
    id: "cat-cotton",
    category_name_en: "Cotton Sarees",
    category_name_hi: "कॉटन सूती साड़ियां",
    description_en: "100% pure Mulmul cotton, Bagru block print, all-day comfort sarees",
    description_hi: "100% शुद्ध मलमल सूती कॉटन, बगरू ब्लॉक प्रिंट साड़ियां",
    image_url: "/images/skj003-main.svg",
    is_active: true
  },
  {
    id: "cat-designer",
    category_name_en: "Designer Sarees",
    category_name_hi: "डिजाइनर साड़ियां",
    description_en: "Royal Banarasi brocade, wedding bridal collections and heavy zari work",
    description_hi: "रॉयल बनारसी ब्रोकेड, ब्राइडल कलेक्शन और हैवी ज़री वर्क",
    image_url: "/images/skj004-main.svg",
    is_active: true
  },
  {
    id: "cat-party",
    category_name_en: "Party Wear Sarees",
    category_name_hi: "पार्टी वियर साड़ियां",
    description_en: "Foil printed Dola silk, fancy party wear sarees with borders",
    description_hi: "फॉयल प्रिंट डोला सिल्क, फैंसी पार्टी वियर बॉर्डर साड़ियां",
    image_url: "/images/skj005-main.svg",
    is_active: true
  },
  {
    id: "cat-fancy",
    category_name_en: "Fancy & Handloom",
    category_name_hi: "फैंसी एवं हैंडलूम",
    description_en: "Maheshwari handloom checks, fancy borders, boutique special",
    description_hi: "महेश्वरी हैंडलूम चेक, फैंसी बॉर्डर और बुटीक स्पेशल सेट्स",
    image_url: "/images/skj006-main.svg",
    is_active: true
  }
];

const business_settings = {
  id: "settings-main",
  shop_name: "Sunil Kumar Jayantilal",
  shop_tagline_en: "Wholesale Sarees at the Right Price",
  shop_tagline_hi: "थोक भाव में साड़ियों की शानदार वैरायटी",
  phone_number: "9425191176",
  whatsapp_number: "9425191176",
  shop_address: "62/2 Jawahar Gate, M.T. Cloth Market, Indore, Madhya Pradesh",
  city: "Indore",
  state: "Madhya Pradesh",
  pincode: "452002",
  map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.1989528731086!2d75.850239!3d22.720815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd0be49f4cd7%3A0x6b9d6286fa64d048!2sM.T.%20Cloth%20Market%2C%20Maharaja%20Tukoji%20Rao%20Holkar%20Cloth%20Market%2C%20Indore%2C%20Madhya%20Pradesh%20452002!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  map_direct_url: "https://maps.google.com/?q=62/2+Jawahar+Gate+M.T.+Cloth+Market+Indore+Madhya+Pradesh",
  default_language: "hi",
  announcement_en: "Special Wholesale Festive Sets In Stock • Delivery across all India • Direct WhatsApp Enquiry",
  announcement_hi: "त्योहारी सीजन के नए थोक साड़ी सेट्स उपलब्ध • पूरे भारत में डिलीवरी • व्हाट्सएप पर सीधा संपर्क",
  updated_at: new Date().toISOString()
};

const admin_users = [
  {
    id: "admin-001",
    full_name: "Sunil Kumar",
    username: "admin",
    email: "admin@sunilkumarjayantilal.com",
    password_hash: adminHash,
    salt: adminSalt,
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const sampleOrders = [
  {
    id: "ord-1001",
    order_number: "SKJ-2026-1001",
    customer_name: "Rajesh Saree Emporium (Rajesh Sharma)",
    mobile_number: "9826012345",
    delivery_address: "Shop No. 14, Sarafa Bazar, Ujjain",
    city: "Ujjain",
    state: "Madhya Pradesh",
    pincode: "456001",
    subtotal: 19800,
    delivery_charge: 0,
    grand_total: 19800,
    order_status: "Confirmed",
    payment_status: "To be Confirmed with Shop",
    customer_notes: "Please dispatch via Indore-Ujjain fast parcel transport.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "ord-1002",
    order_number: "SKJ-2026-1002",
    customer_name: "Pooja Vastra Bhandar (Pooja Agarwal)",
    mobile_number: "9425088899",
    delivery_address: "Near Clock Tower, Main Market, Dewas",
    city: "Dewas",
    state: "Madhya Pradesh",
    pincode: "455001",
    subtotal: 9900,
    delivery_charge: 0,
    grand_total: 9900,
    order_status: "Pending Confirmation",
    payment_status: "Pending",
    customer_notes: "Send Bandhani set colours as discussed on WhatsApp.",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString()
  }
];

const sampleOrderItems = [
  {
    id: "item-1001-1",
    order_id: "ord-1001",
    product_id: "prod-001",
    product_code_snapshot: "SKJ001",
    product_name_snapshot: "Fancy Bandhani Printed Georgette Saree Set",
    price_per_set_snapshot: 3300,
    sarees_per_set_snapshot: 6,
    number_of_sets: 3,
    total_sarees: 18,
    total_price: 9900
  },
  {
    id: "item-1001-2",
    order_id: "ord-1001",
    product_id: "prod-005",
    product_code_snapshot: "SKJ005",
    product_name_snapshot: "Dola Silk Foil Print Party Wear Saree Set",
    price_per_set_snapshot: 3900,
    sarees_per_set_snapshot: 6,
    number_of_sets: 2,
    total_sarees: 12,
    total_price: 7800
  },
  {
    id: "item-1001-3",
    order_id: "ord-1001",
    product_id: "prod-006",
    product_code_snapshot: "SKJ006",
    product_name_snapshot: "Maheshwari Handloom Zari Checks Saree Set",
    price_per_set_snapshot: 4200,
    sarees_per_set_snapshot: 6,
    number_of_sets: 1,
    total_sarees: 6,
    total_price: 4200
  },
  {
    id: "item-1002-1",
    order_id: "ord-1002",
    product_id: "prod-001",
    product_code_snapshot: "SKJ001",
    product_name_snapshot: "Fancy Bandhani Printed Georgette Saree Set",
    price_per_set_snapshot: 3300,
    sarees_per_set_snapshot: 6,
    number_of_sets: 3,
    total_sarees: 18,
    total_price: 9900
  }
];

const stockAuditLog = [
  {
    id: "audit-001",
    product_id: "prod-001",
    change_type: "initial",
    previous_stock: 0,
    new_stock: 28,
    sets_changed: 28,
    reason: "Initial warehouse inventory stock-in",
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: "audit-002",
    product_id: "prod-001",
    change_type: "order_confirmed",
    previous_stock: 28,
    new_stock: 25,
    sets_changed: -3,
    reason: "Order confirmed: SKJ-2026-1001",
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const dbData = {
  products,
  product_colours,
  product_images,
  categories,
  customers: [],
  orders: sampleOrders,
  order_items: sampleOrderItems,
  admin_users,
  business_settings,
  stock_audit_log: stockAuditLog
};

const dbPath = path.join(__dirname, 'db.json');
fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

console.log('Database seeded successfully at ' + dbPath);
console.log('Products:', products.length);
console.log('Colours:', product_colours.length);
console.log('Images:', product_images.length);
console.log('Categories:', categories.length);
console.log('Admin User: admin / admin123');
