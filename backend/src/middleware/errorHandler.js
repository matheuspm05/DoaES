export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;
  if (status === 500) console.error(error);
  const message =
    status === 500
      ? "Não foi possível concluir a operação."
      : status === 413
        ? "Dados excedem o limite de 100 KB."
        : status === 400 && error.type === "entity.parse.failed"
          ? "JSON inválido."
          : error.message;
  res.status(status).json({ erro: message });
}
