# Jora React migration

This project is a React/Vite application built from the Jora GitHub repository. React owns the application shell, while the original storefront documents and their complete asset set live in `public/legacy`. This compatibility-first migration deliberately preserves the existing DOM structure, visual styling, Firebase calls, cart behavior, and page scripts.

## Run locally

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open the URL Vite displays.

The landing screen opens first and then forwards to the preserved home page. All original site navigation runs inside the React application, including product pages, shop pages, information pages, the cart, authentication, and Firebase-backed actions.

## Source mapping

- `src/main.jsx` is the React entry point and application shell.
- `public/legacy` contains the complete source copied from `https://github.com/naveen4806-coder/jora` at commit `201e4fc`.
- The original video, image assets, support scripts, APK download, and Firebase worker are all included.
