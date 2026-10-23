import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/700.css";
import "./index.css";
import { initConsent } from "./lib/consent";

initConsent();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
