import { query } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

let hashFalso;
async function obterHashFalso() {
  hashFalso ??= await hashPassword("senha-que-nunca-sera-usada");
  return hashFalso;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const senha = String(body.senha ?? "");

  if (!email || !senha || email.length > 255 || senha.length > 200) {
    return Response.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }

  try {
    const result = await query(
      "SELECT id_usuario, nome, email, senha_hash FROM usuario WHERE LOWER(email) = $1",
      [email]
    );
    const usuario = result.rows[0];

    const hash = usuario ? usuario.senha_hash : await obterHashFalso();
    const senhaCorreta = await verifyPassword(senha, hash);

    if (!usuario || !senhaCorreta) {
      return Response.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
    }

    await createSession(usuario.id_usuario);
    return Response.json({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao entrar." }, { status: 500 });
  }
}