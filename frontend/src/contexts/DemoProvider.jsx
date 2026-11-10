import { useState, useEffect, useCallback } from "react";
import { DemoContext } from "./demo";
import { api } from "../services/api";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export default function DemoProvider({ children }) {
  const [mode, setMode] = useState(() => read("doaes.mode", ""));
  const [churchId, setChurch] = useState(() => read("doaes.church", 0));
  const [donorId, setDonor] = useState(() => read("doaes.donor", 1));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const [churches, campaigns, categories, donations, donors] =
        await Promise.all(
          [
            "/igrejas",
            "/campanhas",
            "/categorias",
            "/doacoes",
            "/doadores-demo",
          ].map((p) => api(p)),
        );
      setData({ churches, campaigns, categories, donations, donors });
      setError("");
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all(
      [
        "/igrejas",
        "/campanhas",
        "/categorias",
        "/doacoes",
        "/doadores-demo",
      ].map((p) => api(p)),
    )
      .then(([churches, campaigns, categories, donations, donors]) => {
        if (active)
          setData({ churches, campaigns, categories, donations, donors });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const chooseMode = (value) => {
    setMode(value);
    localStorage.setItem("doaes.mode", JSON.stringify(value));
  };
  const chooseChurch = (value) => {
    setChurch(Number(value));
    localStorage.setItem("doaes.church", JSON.stringify(Number(value)));
  };
  const chooseDonor = (value) => {
    setDonor(Number(value));
    localStorage.setItem("doaes.donor", JSON.stringify(Number(value)));
  };
  const church =
    data?.churches.find((c) => c.id === churchId) ?? data?.churches[0];
  const donor = data?.donors.find((d) => d.id === donorId) ?? data?.donors[0];
  return (
    <DemoContext.Provider
      value={{
        ...data,
        mode,
        chooseMode,
        church,
        chooseChurch,
        donor,
        chooseDonor,
        reload,
        refreshing,
        error,
        notify: setNotice,
      }}
    >
      {data ? (
        children
      ) : (
        <div className="boot">
          <span className="brand">
            ♡ doa<span>ES</span>
          </span>
          <h1>{error ? "Vamos reconectar?" : "Preparando bons encontros…"}</h1>
          <p>{error || "Carregando os dados fictícios da demonstração."}</p>
          {error && (
            <button className="button" onClick={() => reload().catch(() => {})}>
              Tentar novamente
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>✓</span>
          {notice}
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </DemoContext.Provider>
  );
}
