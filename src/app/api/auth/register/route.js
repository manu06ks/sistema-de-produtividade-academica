//rota de cadastro de usuário

import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ erro: "Request inválido" }, { status: 400 });
    }

    const nome = String(body.nome ?? "").trim(); //trim() remove espaços em branco no início e no final da string
    const email = String(body.email ?? "").trim().toLowerCase();
    const senha = String(body.senha ?? "");
    const cursoId = Number(body.cursoId);

    if (!nome || nome.length > 150)
        return Response.json({ erro: "Nome inválido, até 150 caracteres" }, { status: 400 });
    if (!email || email.length > 150 || !email.includes("@"))
        return Response.json({ erro: "Email inválido" }, { status: 400 });
    if (senha.length < 6 || Buffer.byteLength(senha, "utf-8") > 72)
        return Response.json({ erro: "Senha inválida, entre 6 e 72 caracteres" }, { status: 400 });
    if (!Number.isInteger(cursoId) || cursoId <= 0)
        return Response.json({ erro: "Selecione um curso" }, { status: 400 });


    try {
       const senhaHash = await hashPassword(senha);
       const result = await query(
        `INSERT INTO usuario (nome, email, senha_hash, fk_curso_id_curso)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario, nome, email, data_cadastro`,
        [nome, email, senhaHash, cursoId]
        );
        return Response.json(result.rows[0], { status: 201 });
        
    } catch (error) {
        if (err.code === "23505") //violation of unique constraint
            return Response.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
        if (err.code === "23503") //violation of foreign key constraint
            return Response.json({ erro: "Curso não encontrado." }, { status: 400 });
        console.error(err);
        return Response.json({ erro: "Erro interno ao cadastrar." }, { status: 500 });

    }
}