import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import { ScrollTop } from "./layouts/ScrollTop";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollTop />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
