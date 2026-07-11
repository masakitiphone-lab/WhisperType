import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
<<<<<<< HEAD
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HashRouter><App /></HashRouter>,
=======
import { AuthProvider } from "./contexts/AuthProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HashRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HashRouter>
>>>>>>> 76c0a9ef47068d3322c0f3d617003f87660d788a
);
