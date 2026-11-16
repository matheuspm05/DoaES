import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./auth";
import { request, setCsrfToken } from "../services/http";
import { churchesApi } from "../services/api/churches";
import { campaignsApi } from "../services/api/campaigns";
import { catalogApi } from "../services/api/catalog";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState({
    churches: [],
    campaigns: [],
    categories: [],
    donations: [],
  });
  const [publicLoading, setPublicLoading] = useState(true),
    [publicError, setPublicError] = useState("");
  const [privateLoading, setPrivateLoading] = useState(true),
    [privateError, setPrivateError] = useState("");
  const [notice, setNotice] = useState(""),
    [refreshing, setRefreshing] = useState(false);
  const loadPublic = useCallback(async () => {
    setPublicLoading(true);
    try {
      const [churches, campaigns, categories] = await Promise.all([
        churchesApi.list(),
        campaignsApi.list(),
        catalogApi.categories(),
      ]);
      setData((d) => ({ ...d, churches, campaigns, categories }));
      setPublicError("");
    } catch (e) {
      setPublicError(e.message);
    } finally {
      setPublicLoading(false);
    }
  }, []);
  useEffect(() => {
    Promise.all([
      churchesApi.list(),
      campaignsApi.list(),
      catalogApi.categories(),
    ])
      .then(([churches, campaigns, categories]) =>
        setData((d) => ({ ...d, churches, campaigns, categories })),
      )
      .catch((e) => setPublicError(e.message))
      .finally(() => setPublicLoading(false));
  }, []);
  useEffect(() => {
    request("/auth/me")
      .then((d) => setUser(d.user))
      .catch((e) => setPrivateError(e.message))
      .finally(() => setAuthLoading(false));
  }, []);
  const privateRoute = /^\/(doador|igreja)(\/|$)/.test(useLocation().pathname);
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !privateRoute) return;
    let active = true;
    request("/doacoes")
      .then((donations) => {
        if (active) {
          setData((d) => ({ ...d, donations }));
          setPrivateError("");
        }
      })
      .catch((e) => {
        if (active) setPrivateError(e.message);
      })
      .finally(() => {
        if (active) setPrivateLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, privateRoute]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 6500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    const clear = () => {
      setUser(null);
      setData((d) => ({ ...d, donations: [] }));
      setCsrfToken("");
    };
    window.addEventListener("doaes:unauthorized", clear);
    return () => window.removeEventListener("doaes:unauthorized", clear);
  }, []);
  const reload = async () => {
    setRefreshing(true);
    try {
      const me = await request("/auth/me");
      setUser(me.user);
      await loadPublic();
      if (me.user) {
        const donations = await request("/doacoes");
        setData((d) => ({ ...d, donations }));
        setPrivateError("");
      }
    } finally {
      setRefreshing(false);
    }
  };
  const authenticate = async (path, body) => {
    await request("/auth/me");
    const result = await request("/auth/" + path, { method: "POST", body });
    // Private screens wait until the new identity's data has loaded.
    setPrivateLoading(true);
    setPrivateError("");
    setData((d) => ({ ...d, donations: [] }));
    setUser(result.user);
    return result.user;
  };
  const logout = async () => {
    await request("/auth/logout", { method: "POST", body: {} });
    setUser(null);
    setCsrfToken("");
    setData((d) => ({ ...d, donations: [] }));
  };
  const church =
    user?.tipo === "IGREJA"
      ? data.churches.find((c) => c.id === user.igreja_id) || user.perfil
      : null;
  const donor = user?.tipo === "DOADOR" ? user.perfil : null;
  return (
    <AuthContext.Provider
      value={{
        ...data,
        user,
        church,
        donor,
        mode: user?.tipo.toLowerCase() || "",
        authLoading,
        publicLoading,
        publicError,
        privateLoading,
        privateError,
        reload,
        loadPublic,
        refreshing,
        error: privateError,
        notify: setNotice,
        login: (b) => authenticate("login", b),
        register: (b) => authenticate("register", b),
        logout,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <span>✓</span>
          {notice}
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}
