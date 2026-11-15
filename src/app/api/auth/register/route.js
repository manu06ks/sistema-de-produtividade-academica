//rota de cadastro de usuário

import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { lerEscolhaDeCurso, resolverCurso } from "@/lib/cadastro";

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ erro: "Request inválido" }, { status: 400 });
    }
    if (body === null || typeof body !== "object") {
        return Response.json({ erro: "Request inválido" }, { status: 400 });
    }

    const nome = String(body.nome ?? "").trim(); //trim() remove espaços em branco no início e no final da string
    const email = String(body.email ?? "").trim().toLowerCase();
    const senha = String(body.senha ?? "");

    if (!nome || nome.length > 150)
        return Response.json({ erro: "Nome inválido, até 150 caracteres" }, { status: 400 });
    if (!email || email.length > 150 || !email.includes("@"))
        return Response.json({ erro: "Email inválido" }, { status: 400 });
    if (senha.length < 6 || Buffer.byteLength(senha, "utf-8") > 72)
        return Response.json({ erro: "Senha inválida, entre 6 e 72 caracteres" }, { status: 400 });

    // Curso que já existe, curso novo numa instituição que já existe, ou instituição nova + curso novo
    const escolha = lerEscolhaDeCurso(body);
    if (escolha.erro)
        return Response.json({ erro: escolha.erro }, { status: 400 });

    let client;
    let conexaoQuebrada = false;
    try {
        // O hash é lento de propósito: faz antes de pegar a conexão, para não segurá-la à toa
        const senhaHash = await hashPassword(senha);

        client = await pool.connect();
        await client.query("BEGIN");

        const resolvido = await resolverCurso(client, escolha);
        if (resolvido.erro) {
            await client.query("ROLLBACK");
            return Response.json({ erro: resolvido.erro }, { status: resolvido.status });
        }

        const result = await client.query(
            `INSERT INTO usuario (nome, email, senha_hash, fk_curso_id_curso)
             VALUES ($1, $2, $3, $4)
             RETURNING id_usuario, nome, email, data_cadastro`,
            [nome, email, senhaHash, resolvido.cursoId]
        );

        // Só aqui a instituição e o curso novos passam a existir de verdade
        await client.query("COMMIT");

        return Response.json(
            {
                ...result.rows[0],
                instituicao_criada: resolvido.instituicaoCriada,
                curso_criado: resolvido.cursoCriado,
            },
            { status: 201 }
        );
    } catch (err) {
        // Desfaz tudo: se o e-mail já existe, a instituição/curso novos também não ficam
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch {
                conexaoQuebrada = true;
            }
        }
        if (err.code === "23505") //violation of unique constraint
            return Response.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
        if (err.code === "23503") //violation of foreign key constraint
            return Response.json({ erro: "Curso não encontrado." }, { status: 400 });
        console.error(err);
        return Response.json({ erro: "Erro interno ao cadastrar." }, { status: 500 });
    } finally {
        client?.release(conexaoQuebrada);
    }
}