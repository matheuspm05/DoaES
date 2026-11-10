export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Inicie o backend na porta 3001 e tente novamente.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "A API não respondeu corretamente. Verifique se o backend está rodando na porta 3001 e tente novamente.",
    );
  }
  if (!response.ok)
    throw new Error(data.erro || "Não foi possível concluir a ação.");
  return data;
}
export const dayLabel = (value) =>
  value
    ? new Date(
        value.length === 10 ? `${value}T12:00:00` : value,
      ).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const periods = {
  MANHA: "Manhã · 8h às 12h",
  TARDE: "Tarde · 13h às 18h",
  NOITE: "Noite · 18h às 20h",
};
export const statuses = {
  PENDENTE: "Pendente",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  CONCLUIDA: "Concluída",
};
