export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. A demonstração pode estar iniciando; aguarde alguns instantes e tente novamente.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "A API está temporariamente indisponível ou iniciando. Aguarde alguns instantes e tente novamente.",
    );
  }
  if (!response.ok)
    throw new Error(data.erro || "Não foi possível concluir a ação.");
  return data;
}
