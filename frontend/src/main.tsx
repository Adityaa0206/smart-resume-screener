import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// StrictMode is a React development-only helper: it intentionally
// double-invokes some functions (like component render and effects) to
// help surface bugs where code accidentally relies on side effects running
// exactly once. It has no effect on the production build.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
