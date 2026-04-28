import React from "react";
import ReactDOM from "react-dom/client";
import PostConversionPage from "./pages/PostConversionPage";
import "./index.css";
import "./postConversion.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PostConversionPage />
  </React.StrictMode>
);
