// Regras do curso/instituição no cadastro. Só JavaScript e SQL (nada do Next),
// para a rota ficar curta e esta parte poder ser testada sozinha.

export const MAX_INSTITUICAO = 150; // Instituicao.nome   VARCHAR(150)
export const MAX_SIGLA = 20;        // Instituicao.sigla  VARCHAR(20)
export const MAX_CURSO = 100;       // Curso.nome         VARCHAR(100)

const ID_MAXIMO = 2147483647; // maior valor de uma coluna INT do PostgreSQL

// "  Engenharia   de  Software " -> "Engenharia de Software".
// Qualquer valor que não seja texto vira "" (assim { nome: {} } nunca passa).
function limparTexto(valor) {
  if (typeof valor !== "string") return "";
  return valor.normalize("NFC").replace(/\s+/g, " ").trim();
}

// Tem de 1 a "max" caracteres, ao menos uma letra ou número, e nenhum
// caractere de controle (o PostgreSQL rejeita o caractere nulo, por exemplo).
function nomeValido(texto, max) {
  return texto.length > 0 && texto.length <= max && /[\p{L}\p{N}]/u.test(texto) && !/\p{C}/u.test(texto);
}

// Aceita 5 ou "5". Recusa "5abc", 0, -1, 1.5, true e números gigantes.
function lerId(valor) {
  const n = typeof valor === "number" ? valor : typeof valor === "string" && /^\d+$/.test(valor) ? Number(valor) : NaN;
  return Number.isInteger(n) && n > 0 && n <= ID_MAXIMO ? n : null;
}

// Descobre o que a pessoa escolheu na tela e valida. Devolve { erro } ou:
//   { modo: "curso-existente", cursoId }
//   { modo: "curso-novo", instituicaoId, curso }
//   { modo: "instituicao-nova", instituicao: { nome, sigla }, curso }
export function lerEscolhaDeCurso(body) {
  const temInstituicaoNova = body.novaInstituicao !== undefined && body.novaInstituicao !== null;
  const temCursoNovo = body.novoCurso !== undefined && body.novoCurso !== null;

  if (!temInstituicaoNova && !temCursoNovo) {
    const cursoId = lerId(body.cursoId);
    if (!cursoId) return { erro: "Selecione um curso" };
    return { modo: "curso-existente", cursoId };
  }

  const curso = limparTexto(body.novoCurso);
  if (!nomeValido(curso, MAX_CURSO)) {
    return { erro: `Informe o nome do curso (até ${MAX_CURSO} caracteres).` };
  }

  if (temInstituicaoNova) {
    const dados = body.novaInstituicao;
    if (typeof dados !== "object" || Array.isArray(dados)) return { erro: "Instituição inválida." };

    const nome = limparTexto(dados.nome);
    if (!nomeValido(nome, MAX_INSTITUICAO)) {
      return { erro: `Informe o nome da instituição (até ${MAX_INSTITUICAO} caracteres).` };
    }
    const sigla = limparTexto(dados.sigla);
    if (sigla && !nomeValido(sigla, MAX_SIGLA)) {
      return { erro: `Sigla inválida (até ${MAX_SIGLA} caracteres).` };
    }
    return { modo: "instituicao-nova", instituicao: { nome, sigla: sigla || null }, curso };
  }

  const instituicaoId = lerId(body.instituicaoId);
  if (!instituicaoId) return { erro: "Selecione a instituição." };
  return { modo: "curso-novo", instituicaoId, curso };
}

// Dentro de uma transação já aberta ("client"), devolve o id do curso: usa o que
// existe, ou cria o que faltar. Devolve { erro, status } se não for possível.
export async function resolverCurso(client, escolha) {
  if (escolha.modo === "curso-existente") {
    const r = await client.query("SELECT id_curso FROM curso WHERE id_curso = $1", [escolha.cursoId]);
    if (r.rows.length === 0) return { erro: "Curso não encontrado.", status: 400 };
    return { cursoId: escolha.cursoId, instituicaoCriada: false, cursoCriado: false };
  }

  let instituicaoId;
  let instituicaoCriada = false;

  if (escolha.modo === "curso-novo") {
    const r = await client.query("SELECT id_instituicao FROM instituicao WHERE id_instituicao = $1", [
      escolha.instituicaoId,
    ]);
    if (r.rows.length === 0) return { erro: "Instituição não encontrada.", status: 400 };
    instituicaoId = escolha.instituicaoId;
  } else {
    const { nome, sigla } = escolha.instituicao;

    // Já existe com esse nome (ignorando maiúsculas, acentos e espaços)? Usa a que existe.
    const mesmoNome = await client.query(
      "SELECT id_instituicao FROM instituicao WHERE norm_nome(nome) = norm_nome($1)",
      [nome]
    );
    if (mesmoNome.rows.length > 0) {
      instituicaoId = mesmoNome.rows[0].id_instituicao;
    } else {
      // Nome diferente, mas a sigla já é de outra instituição: quase certamente é a mesma.
      // Em vez de criar uma repetida, pede para escolher a que está na lista.
      if (sigla) {
        const mesmaSigla = await client.query(
          "SELECT nome FROM instituicao WHERE norm_nome(sigla) = norm_nome($1)",
          [sigla]
        );
        if (mesmaSigla.rows.length > 0) {
          return {
            erro: `Já existe uma instituição com a sigla ${sigla}: ${mesmaSigla.rows[0].nome}. Escolha-a na lista.`,
            status: 409,
          };
        }
      }

      // ON CONFLICT DO NOTHING: se outra pessoa criou o mesmo nome neste instante,
      // o banco não dá erro e não cria de novo; aí é só buscar o que ela criou.
      const nova = await client.query(
        `INSERT INTO instituicao (nome, sigla) VALUES ($1, $2)
         ON CONFLICT ((norm_nome(nome))) DO NOTHING
         RETURNING id_instituicao`,
        [nome, sigla]
      );
      if (nova.rows.length > 0) {
        instituicaoId = nova.rows[0].id_instituicao;
        instituicaoCriada = true;
      } else {
        const criada = await client.query(
          "SELECT id_instituicao FROM instituicao WHERE norm_nome(nome) = norm_nome($1)",
          [nome]
        );
        instituicaoId = criada.rows[0].id_instituicao;
      }
    }
  }

  const novo = await client.query(
    `INSERT INTO curso (nome, fk_instituicao_id_instituicao) VALUES ($1, $2)
     ON CONFLICT (fk_instituicao_id_instituicao, (norm_nome(nome))) DO NOTHING
     RETURNING id_curso`,
    [escolha.curso, instituicaoId]
  );
  if (novo.rows.length > 0) {
    return { cursoId: novo.rows[0].id_curso, instituicaoCriada, cursoCriado: true };
  }
  const existente = await client.query(
    "SELECT id_curso FROM curso WHERE fk_instituicao_id_instituicao = $1 AND norm_nome(nome) = norm_nome($2)",
    [instituicaoId, escolha.curso]
  );
  return { cursoId: existente.rows[0].id_curso, instituicaoCriada, cursoCriado: false };
}
