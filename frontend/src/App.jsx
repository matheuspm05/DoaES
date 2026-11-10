import { BrowserRouter } from "react-router-dom";
import DemoProvider from "./contexts/DemoProvider";
import { ScrollTop } from "./layouts/ScrollTop";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <ScrollTop />
        <AppRoutes />
      </DemoProvider>
    </BrowserRouter>
  );
}
