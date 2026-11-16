import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { AppLayout } from "./AppLayout";
import { PublicLayout } from "./PublicLayout";

export function BrowseLayout() {
  const { mode, publicLoading, publicError, loadPublic } = useAuth();
  if (publicLoading)
    return (
      <div className="container padded" role="status">
        Carregando…
      </div>
    );
  if (publicError)
    return (
      <div className="container padded">
        <p role="alert">{publicError}</p>
        <button className="button" onClick={loadPublic}>
          Tentar novamente
        </button>
      </div>
    );
  return mode === "doador" ? (
    <AppLayout />
  ) : (
    <PublicLayout>
      <div className="container browse-public">
        <Outlet />
      </div>
    </PublicLayout>
  );
}
