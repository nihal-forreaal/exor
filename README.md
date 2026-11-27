# EXOR Medical Systems

A high-performance digital storefront and catalog for EXOR Medical Systems, a clinical-grade medical equipment and surgical supplies distributor based in Kozhikode, Kerala, India with Pan-India dispatch capabilities.

## Overview

This application provides healthcare facilities, clinics, and retail partners with direct access to a catalog of over 124 verified medical products across 7 core categories:

- **Respiratory Care** (CPAP/BiPAP masks, oxygen concentrators, nebulizers)
- **Diagnostic Equipment** (Digital BP monitors, pulse oximeters, stethoscopes)
- **Patient Recovery & Mobility** (Hospital beds, wheelchairs, walking aids)
- **Surgical & PPE** (Surgical gloves, masks, gowns, sterilization kits)
- **Monitoring & ICU** (Multipara patient monitors, ECG machines, syringe pumps)
- **Laboratory & Consumables** (Test kits, lab reagents, disposable consumables)
- **Infant & Specialized Care** (Infant warmers, phototherapy units, specialized pediatric gear)

## Key Features

- **Executive Clinical Interface**: Clean design with solid surfaces, deep midnight navy branding, and high contrast for clinical clarity.
- **Instant Search & Typo Tolerance**: Fast search algorithm with fuzzy matching to quickly locate medical SKUs and brand names.
- **Category Filter Glider**: Smooth single-row navigation with magnetic category indicator pills.
- **WhatsApp Integration**: Instant quote requests and one-click order dispatch to the EXOR WhatsApp desk.
- **Interactive Cart & Order Drawer**: Real-time total calculation, tiered shipping rules, and persistent cart state.
- **Product Detail Views**: Dedicated product specifications page (`product.html`) with technical attributes and TrustSEAL compliance badges.
- **Zero Heavy Dependencies**: Built with pure vanilla web standards (HTML5, modern CSS3, vanilla ES6+ JavaScript) for fast loading times.

## Directory Structure

```
exor-medical-systems/
├── assets/
│   └── images/          # Product photography, clinical illustrations, and logos
├── css/
│   └── styles.css       # Design tokens, typography, and responsive styles
├── js/
│   ├── app.js           # Main storefront controller and search engine
│   └── product-page.js  # Dedicated product detail page controller
├── index.html           # Main storefront and interactive catalog
├── product.html         # Individual product detail view
├── LICENSE              # MIT License
└── README.md            # Project documentation
```

## Local Development

To run the project locally, serve the directory using any HTTP server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js npx
npx serve .
```

Open `http://localhost:8080` in your browser.

## License

This project is open source and available under the [MIT License](LICENSE).
