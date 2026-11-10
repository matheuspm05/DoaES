import { createProxyHandler } from "../server/proxy.js";

// O segredo é lido na execução da função, nunca pelo Vite/JavaScript do navegador.
export default createProxyHandler();
