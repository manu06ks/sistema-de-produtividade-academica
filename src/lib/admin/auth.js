import { createHash, timingSafeEqual } from "crypto";

// O painel /admin pode criar e APAGAR todas as tabelas, então não pode ficar aberto.
// A senha vem da variável de ambiente ADMIN_SENHA e é enviada no cabeçalho x-admin-senha.
//  - Com ADMIN_SENHA definida: só entra quem souber a senha.
//  - Sem ADMIN_SENHA em desenvolvimento (npm run dev): liberado, para facilitar os testes.
//  - Sem ADMIN_SENHA em produção: o painel fica desligado (503), por segurança.
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const sha = (texto) => createHash("sha256").update(String(texto)).digest();

export function painelProtegido() {
  return (process.env.ADMIN_SENHA ?? "") !== "";
}

export async function verificarAdmin(request) {
  const configurada = process.env.ADMIN_SENHA ?? "";

  if (!configurada) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        erro: "Painel desativado: defina a variável de ambiente ADMIN_SENHA no servidor.",
      };
    }
    return { ok: true };
  }

  const enviada = request.headers.get("x-admin-senha") ?? "";
  if (timingSafeEqual(sha(enviada), sha(configurada))) return { ok: true };

  await esperar(500); // freia tentativas em sequência
  return { ok: false, status: 401, erro: "Senha incorreta." };
}

// Atalho para as rotas: devolve uma Response de erro, ou null se pode seguir.
export async function barrar(request) {
  const r = await verificarAdmin(request);
  return r.ok ? null : Response.json({ erro: r.erro }, { status: r.status });
}
