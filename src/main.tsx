import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ConsentProvider } from "./contexts/ConsentContext";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ConsentProvider>
      <App />
    </ConsentProvider>
  </HelmetProvider>
);
