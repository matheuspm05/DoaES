import { Navigate } from "react-router-dom";
import { useDemo } from "../contexts/demo";
import { AppLayout } from "./AppLayout";

export function RoleGate({ role }) {
  const { mode } = useDemo();
  return mode === role ? (
    <AppLayout />
  ) : (
    <Navigate
      to={
        mode === "igreja"
          ? "/igreja"
          : mode === "doador"
            ? "/doador"
            : "/entrar"
      }
      replace
    />
  );
}
