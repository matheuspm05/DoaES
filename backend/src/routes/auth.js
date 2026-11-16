import { Router } from "express";
import { hashPassword, verify, account } from "../services/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { requireValue } from "../utils/errors.js";
import { text } from "../utils/validation.js";
import { transaction } from "../database/index.js";
import { createHash } from "node:crypto";
const digest = (value) => createHash("sha256").update(value).digest("hex");
export function authRoutes(db) {
  const router = Router();
  router.get("/me", (req, res) => {
    if (!req.session) req.rotateSession();
    res.json({ user: req.user, csrfToken: req.session.csrf });
  });
  function limit(email) {
    const key = digest(email);
    db.prepare("DELETE FROM auth_tentativas WHERE expira<?").run(Date.now());
    db.prepare(
      "INSERT INTO auth_tentativas VALUES (?,1,?) ON CONFLICT(chave) DO UPDATE SET total=total+1",
    ).run(key, Date.now() + 15 * 60 * 1000);
    requireValue(
      db.prepare("SELECT total FROM auth_tentativas WHERE chave=?").get(key)
        .total <= 10,
      "Muitas tentativas. Aguarde 15 minutos.",
      429,
    );
  }
  const emailOf = (body) => {
    const email = text(body.email, "E-mail", true, 150).toLowerCase();
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "E-mail inválido.");
    return email;
  };
  router.post("/register", async (req, res) => {
    const b = req.body,
      email = emailOf(b);
    limit("register:" + email);
    requireValue(["DOADOR", "IGREJA"].includes(b.tipo), "Perfil inválido.");
    requireValue(
      typeof b.senha === "string" &&
        b.senha.length >= 10 &&
        b.senha.length <= 128,
      "A senha deve ter entre 10 e 128 caracteres.",
    );
    requireValue(b.senha === b.confirmacao_senha, "As senhas não conferem.");
    const nome = text(b.nome, "Nome", true, 120),
      cidade = text(b.cidade, "Cidade", true, 100),
      contato = text(b.contato, "Contato", false, 100);
    requireValue(
      ["Vila Velha", "Vitória"].includes(cidade),
      "Cidade inválida.",
    );
    const endereco =
      b.tipo === "IGREJA"
        ? text(b.endereco_publico_ficticio, "Endereço institucional", true, 300)
        : "";
    const cats = b.tipo === "IGREJA" ? b.categorias : [];
    if (b.tipo === "IGREJA")
      requireValue(
        Array.isArray(cats) &&
          cats.length > 0 &&
          cats.length <= 4 &&
          cats.every(
            (id) =>
              Number.isInteger(id) &&
              db.prepare("SELECT id FROM categorias WHERE id=?").get(id),
          ),
        "Selecione categorias válidas.",
      );
    requireValue(
      !db.prepare("SELECT id FROM usuarios WHERE email=?").get(email),
      "E-mail já cadastrado.",
      409,
    );
    const hash = await hashPassword(b.senha);
    const id = transaction(db, () => {
      requireValue(
        !db.prepare("SELECT id FROM usuarios WHERE email=?").get(email),
        "E-mail já cadastrado.",
        409,
      );
      let donor = null,
        church = null;
      if (b.tipo === "DOADOR")
        donor = Number(
          db
            .prepare(
              "INSERT INTO doadores_demo (nome,email,cidade,contato) VALUES (?,?,?,?)",
            )
            .run(nome, email, cidade, contato).lastInsertRowid,
        );
      else {
        church = Number(
          db
            .prepare(
              "INSERT INTO igrejas (nome,descricao,cidade,bairro,endereco_publico_ficticio) VALUES (?,?,?,?,?)",
            )
            .run(
              nome,
              "Instituição cadastrada no projeto acadêmico.",
              cidade,
              text(b.bairro, "Bairro", true, 300),
              endereco,
            ).lastInsertRowid,
        );
        for (const cat of new Set(cats))
          db.prepare("INSERT INTO igreja_categorias VALUES (?,?)").run(
            church,
            cat,
          );
      }
      return Number(
        db
          .prepare(
            "INSERT INTO usuarios (email,senha_hash,tipo,doador_id,igreja_id) VALUES (?,?,?,?,?)",
          )
          .run(email, hash, b.tipo, donor, church).lastInsertRowid,
      );
    });
    req.rotateSession(id);
    res.status(201).json({ user: req.user, csrfToken: req.session.csrf });
  });
  router.post("/login", async (req, res) => {
    const email = emailOf(req.body);
    limit(email);
    const user = db
      .prepare("SELECT id,senha_hash FROM usuarios WHERE email=?")
      .get(email);
    const password = req.body.senha;
    requireValue(
      typeof password === "string" && password.length <= 128,
      "E-mail ou senha inválidos.",
      401,
    );
    // Executa scrypt também para e-mail inexistente, sem revelar a existência da conta.
    const hash = user?.senha_hash || `scrypt:inexistente:${"00".repeat(64)}`;
    const ok = await verify(password, hash);
    requireValue(user && ok, "E-mail ou senha inválidos.", 401);
    req.rotateSession(user.id);
    res.json({ user: req.user, csrfToken: req.session.csrf });
  });
  router.post("/logout", requireAuth, (req, res) => {
    db.prepare("DELETE FROM sessoes WHERE id=?").run(req.session.id);
    res.setHeader(
      "Set-Cookie",
      "doaes.sid=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    res.json({ ok: true });
  });
  router.patch("/profile", requireAuth, (req, res) => {
    requireValue(req.user.tipo === "DOADOR", "Acesso não permitido.", 403);
    const b = req.body,
      nome = text(b.nome, "Nome", true, 120),
      email = emailOf(b),
      cidade = text(b.cidade, "Cidade", true, 100),
      contato = text(b.contato, "Contato", false, 100);
    requireValue(
      ["Vila Velha", "Vitória"].includes(cidade),
      "Cidade inválida.",
    );
    requireValue(
      !db
        .prepare("SELECT id FROM usuarios WHERE email=? AND id<>?")
        .get(email, req.user.id),
      "E-mail já cadastrado.",
      409,
    );
    transaction(db, () => {
      db.prepare("UPDATE usuarios SET email=? WHERE id=?").run(
        email,
        req.user.id,
      );
      db.prepare(
        "UPDATE doadores_demo SET nome=?,email=?,cidade=?,contato=? WHERE id=?",
      ).run(nome, email, cidade, contato, req.user.doador_id);
    });
    res.json(account(db, req.user.id));
  });
  return router;
}
