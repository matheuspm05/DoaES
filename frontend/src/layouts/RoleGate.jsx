import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { AppLayout } from "./AppLayout";

export function RoleGate({ role }) {
  const {
    mode,
    authLoading,
    privateLoading,
    privateError,
    reload,
    publicLoading,
    publicError,
    loadPublic,
  } = useAuth();
  if (authLoading || (mode === role && (privateLoading || publicLoading)))
    return (
      <div className="container padded" role="status">
        Carregando sua conta…
      </div>
    );
  if (mode === role && publicError)
    return (
      <div className="container padded">
        <p role="alert">{publicError}</p>
        <button className="button" onClick={loadPublic}>
          Tentar novamente
        </button>
      </div>
    );
  if (mode === role && privateError)
    return (
      <div className="container padded">
        <p role="alert">{privateError}</p>
        <button className="button" onClick={() => reload().catch(() => {})}>
          Tentar novamente
        </button>
      </div>
    );
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
