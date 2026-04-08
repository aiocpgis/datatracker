# 🌍 DataTracker V10 - Advanced Field Survey Dashboard

## 🚀 Overview
**DataTracker V10** is an advanced web-based Geospatial Information System (GIS) and Analytical Dashboard designed to manage and monitor field surveys in the Gaza Strip. The system integrates intelligent analytics, interactive Web-GIS maps, dynamic filtering, and a comprehensive unified database architecture via Firebase.

## 📌 Features
- **Smart Command Center**: Real-time analytical statistics panel updating dynamically based on governorate selection.
- **Interactive Geo-spatial Maps**: Seamless integration of Leaflet and Esri Leaflet with interactive data-bounds, search properties, and real-time visualization of `GeoJSON` bounds.
- **Interactive Personas Board**: Floating hierarchical directory to query and dispatch active field survey engineers sorted by zones.
- **Dynamic Cross-Filtering**: Changing any unified filter impacts both the spatial map visualizations and the statistical Chart.js graphics.
- **Firebase Auth Security**: Deep integration with Firebase backend for robust data querying and authenticated role-based access.

## 🛠 Tech Stack
- **Frontend Core**: Vanilla JS, HTML5, Tailwind CSS
- **Visualization**: Chart.js for statistics, Animate.css for fluid page routing animations.
- **Geomatics Engine**: Leaflet.js, Esri Leaflet, and Leaflet-Geoman for vector editing. 
- **Backend & Database**: Firebase Firestore (NoSQL Document Store), Firebase Authentication.
- **Utilities**: `html2pdf.js` for tactical PDF report generation.

## 🔒 Security
- All sensitive API logic corresponds to Firestore specific rule-sets.
- Protected authentication strictly bound to server validation via `onAuthStateChanged`.
- Uses `.gitignore` protocol ensuring sensitive geospatial arrays (`zone.geojson`) and user files DO NOT leak into public environments.

---
*Built with precision for professional administration scenarios.*
