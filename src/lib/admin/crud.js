import { query } from "@/lib/db";
import { NOMES_TABELAS, tabelaConhecida } from "./tabelas";

export const POR_PAGINA = 20;

const q = (identificador) => `"${String(identificador).replace(/"/g, '""')}"`;

export class ErroCrud extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

// ---------------------------------------------------------------------
// Metadados: lidos do próprio catálogo do PostgreSQL, então o CRUD acompanha o DDL.
// ---------------------------------------------------------------------
function tipoDeEntrada(tipo) {
  const t = tipo.toLowerCase();
  if (t.startsWith("integer") || t.startsWith("smallint") || t.startsWith("bigint")) return "inteiro";
  if (t.startsWith("numeric") || t.startsWith("double") || t.startsWith("real")) return "decimal";
  if (t.startsWith("boolean")) return "booleano";
  if (t === "date") return "data";
  if (t.startsWith("timestamp")) return "datahora";
  if (t === "text") return "textolongo";
  return "texto";
}

export async function metadados() {
  const colunas = await query(
    `SELECT c.relname AS tabela,
            a.attnum,
            a.attname::text AS coluna,
            format_type(a.atttypid, a.atttypmod) AS tipo,
            a.attnotnull AS obrigatoria,
            pg_get_expr(d.adbin, d.adrelid) AS padrao
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND a.attnum > 0 AND NOT a.attisdropped
        AND c.relname = ANY($1)
      ORDER BY c.relname, a.attnum`,
    [NOMES_TABELAS]
  );

  const restricoes = await query(
    `SELECT c.relname AS tabela,
            con.conname::text AS nome,
            con.contype AS tipo,
            rc.relname AS tabela_ref,
            (SELECT array_agg(a.attname::text ORDER BY k.ord)
               FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum) AS colunas,
            (SELECT array_agg(a.attname::text ORDER BY k.ord)
               FROM unnest(con.confkey) WITH ORDINALITY k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum) AS colunas_ref,
            con.confdeltype AS ao_excluir
       FROM pg_constraint con
       JOIN pg_class c ON c.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       LEFT JOIN pg_class rc ON rc.oid = con.confrelid
      WHERE n.nspname = 'public' AND con.contype IN ('p', 'f') AND c.relname = ANY($1)
      ORDER BY c.relname, con.conname`,
    [NOMES_TABELAS]
  );

  const REGRA = { a: "NO ACTION", r: "RESTRICT", c: "CASCADE", n: "SET NULL", d: "SET DEFAULT" };
  const porTabela = {};
  for (const t of NOMES_TABELAS) porTabela[t] = { nome: t, colunas: [], chave: [], fks: [] };

  for (const r of colunas.rows) {
    porTabela[r.tabela].colunas.push({
      nome: r.coluna,
      tipo: r.tipo,
      entrada: tipoDeEntrada(r.tipo),
      obrigatoria: r.obrigatoria,
      padrao: r.padrao,
      automatica: typeof r.padrao === "string" && r.padrao.startsWith("nextval("),
      pk: false,
      fk: null,
    });
  }
  for (const r of restricoes.rows) {
    const t = porTabela[r.tabela];
    if (r.tipo === "p") {
      t.chave = r.colunas;
      for (const c of t.colunas) if (r.colunas.includes(c.nome)) c.pk = true;
    } else {
      const fk = {
        nome: r.nome,
        colunas: r.colunas,
        tabela_ref: r.tabela_ref,
        colunas_ref: r.colunas_ref,
        simples: r.colunas.length === 1,
        ao_excluir: REGRA[r.ao_excluir] ?? r.ao_excluir,
      };
      t.fks.push(fk);
      for (const c of t.colunas) if (r.colunas.includes(c.nome)) c.fk = fk;
    }
  }
  return porTabela;
}

async function metaDaTabela(nome) {
  if (!tabelaConhecida(nome)) throw new ErroCrud("Tabela desconhecida.", 404);
  const todas = await metadados();
  const meta = todas[nome];
  if (!meta || meta.colunas.length === 0) {
    throw new ErroCrud("A tabela não existe. Use a opção 'Criar tabelas' em Banco de dados.", 409);
  }
  return meta;
}

const selecionarTexto = (meta) => meta.colunas.map((c) => `${q(c.nome)}::text AS ${q(c.nome)}`).join(", ");
const ordenar = (meta) => (meta.chave.length ? meta.chave.map(q).join(", ") : q(meta.colunas[0].nome));

function normalizar(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "true" : "false";
  const s = String(v);
  return s.trim() === "" ? null : s;
}

function condicaoDaChave(meta, chave, primeiroParametro) {
  if (!chave || typeof chave !== "object") throw new ErroCrud("Chave do registro não informada.");
  const partes = [];
  const valores = [];
  for (const nome of meta.chave) {
    const v = normalizar(chave[nome]);
    if (v === null) throw new ErroCrud("Chave do registro incompleta.");
    valores.push(v);
    partes.push(`${q(nome)} = $${primeiroParametro + valores.length - 1}`);
  }
  return { sql: partes.join(" AND "), valores };
}

// ---------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------
export async function descreverTabela(nome) {
  const meta = await metaDaTabela(nome);
  const total = await query(`SELECT count(*)::int AS n FROM ${q(nome)}`);
  return { ...meta, titulo: tabelaConhecida(nome).titulo, total: total.rows[0].n };
}

export async function listar(nome, pagina) {
  const meta = await metaDaTabela(nome);
  const total = (await query(`SELECT count(*)::int AS n FROM ${q(nome)}`)).rows[0].n;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const atual = Math.min(Math.max(1, Number(pagina) || 1), paginas);
  const r = await query(
    `SELECT ${selecionarTexto(meta)} FROM ${q(nome)} ORDER BY ${ordenar(meta)} LIMIT $1 OFFSET $2`,
    [POR_PAGINA, (atual - 1) * POR_PAGINA]
  );
  return { linhas: r.rows, total, pagina: atual, paginas, porPagina: POR_PAGINA };
}

export async function inserir(nome, valores) {
  const meta = await metaDaTabela(nome);
  const cols = [];
  const vals = [];
  for (const c of meta.colunas) {
    const v = normalizar(valores?.[c.nome]);
    if (v === null) continue; // em branco: vale o padrão (SERIAL, DEFAULT) ou NULL
    cols.push(c.nome);
    vals.push(v);
  }
  const sql = cols.length
    ? `INSERT INTO ${q(nome)} (${cols.map(q).join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING ${selecionarTexto(meta)}`
    : `INSERT INTO ${q(nome)} DEFAULT VALUES RETURNING ${selecionarTexto(meta)}`;
  const r = await query(sql, vals);
  return r.rows[0];
}

export async function alterar(nome, chave, valores) {
  const meta = await metaDaTabela(nome);
  const sets = [];
  const vals = [];
  for (const c of meta.colunas) {
    if (c.automatica) continue; // identificador SERIAL não é editado
    if (!valores || !Object.prototype.hasOwnProperty.call(valores, c.nome)) continue;
    vals.push(normalizar(valores[c.nome]));
    sets.push(`${q(c.nome)} = $${vals.length}`);
  }
  if (sets.length === 0) throw new ErroCrud("Nenhum campo para alterar.");
  const onde = condicaoDaChave(meta, chave, vals.length + 1);
  const r = await query(
    `UPDATE ${q(nome)} SET ${sets.join(", ")} WHERE ${onde.sql} RETURNING ${selecionarTexto(meta)}`,
    [...vals, ...onde.valores]
  );
  if (r.rowCount === 0) throw new ErroCrud("Registro não encontrado (talvez já tenha sido excluído).", 404);
  return r.rows[0];
}

export async function excluir(nome, chave) {
  const meta = await metaDaTabela(nome);
  const onde = condicaoDaChave(meta, chave, 1);
  const r = await query(`DELETE FROM ${q(nome)} WHERE ${onde.sql}`, onde.valores);
  if (r.rowCount === 0) throw new ErroCrud("Registro não encontrado (talvez já tenha sido excluído).", 404);
}

// Lista de valores possíveis de uma coluna que é chave estrangeira simples (para o <select>).
export async function opcoesDeFk(nome, coluna) {
  const meta = await metaDaTabela(nome);
  const col = meta.colunas.find((c) => c.nome === coluna);
  if (!col?.fk?.simples) return [];
  const ref = await metaDaTabela(col.fk.tabela_ref);
  const chaveRef = col.fk.colunas_ref[0];
  const rotulo =
    ref.colunas.find((c) => !c.pk && (c.entrada === "texto" || c.entrada === "textolongo"))?.nome ?? chaveRef;
  const r = await query(
    `SELECT ${q(chaveRef)}::text AS valor, ${q(rotulo)}::text AS rotulo
       FROM ${q(col.fk.tabela_ref)}
      ORDER BY ${q(rotulo)} NULLS LAST, ${q(chaveRef)}
      LIMIT 500`
  );
  return r.rows;
}

// ---------------------------------------------------------------------
// Erros do PostgreSQL -> mensagens em português (o que a pessoa precisa para corrigir)
// ---------------------------------------------------------------------
const titulo = (n) => tabelaConhecida(n)?.titulo ?? n;

// Mensagens claras para as regras mais conhecidas do esquema (o resto cai na mensagem genérica).
const MENSAGEM_DA_REGRA = {
  uq_usuario_email: "Já existe um usuário com este e-mail.",
  uq_instituicao_nome: "Já existe uma instituição com este nome (a comparação ignora acentos, maiúsculas e espaços extras).",
  uq_curso_instituicao_nome: "Esta instituição já tem um curso com este nome.",
  uq_disciplina_codigo: "Já existe uma disciplina com este código de compartilhamento.",
  uq_grupo_codigo: "Já existe um grupo com este código de convite.",
  uq_material_url: "Já existe um material com esta URL.",
  uq_material_anexo_atividade: "Esta atividade já tem um anexo (só é permitido um por atividade).",
  uq_sessao_aberta_por_usuario: "Este estudante já tem uma sessão de estudo aberta (só pode haver uma por vez). Encerre a anterior primeiro.",
  ck_atividade_tipo: "O tipo da atividade deve ser Tarefa, Prova ou Trabalho.",
};

async function lerRestricao(err) {
  if (!err.constraint) return null;
  try {
    const r = await query(
      `SELECT con.conrelid::regclass::text AS filha,
              con.confrelid::regclass::text AS pai,
              pg_get_constraintdef(con.oid) AS definicao
         FROM pg_constraint con
        WHERE con.conname = $1 AND con.connamespace = 'public'::regnamespace
        LIMIT 1`,
      [err.constraint]
    );
    return r.rows[0] ?? null;
  } catch {
    return null;
  }
}

// operacao: "inserir" | "alterar" | "excluir"
export async function traduzirErro(err, operacao, tabela) {
  if (err instanceof ErroCrud) return { status: err.status, erro: err.message };

  switch (err.code) {
    case "23503": {
      const rs = await lerRestricao(err);
      // A tabela com a FK é a própria tabela alterada? Então o valor informado aponta para um registro
      // que não existe. Caso contrário, outro registro depende deste e impede a operação.
      const referenciaInvalida = operacao === "inserir" || (operacao === "alterar" && rs?.filha === tabela);
      if (!referenciaInvalida) {
        const dependente = rs ? titulo(rs.filha) : "outra tabela";
        return {
          status: 409,
          erro: `Não é possível ${operacao === "excluir" ? "excluir" : "alterar a chave de"} este registro: ainda existem registros em ${dependente} que dependem dele. Exclua primeiro os registros dependentes.`,
        };
      }
      const pai = rs ? titulo(rs.pai) : "outra tabela";
      return {
        status: 409,
        erro: `Referência inválida: o valor informado não existe em ${pai}. Cadastre antes o registro em ${pai} (ou escolha um valor existente).`,
      };
    }
    case "23505":
      return {
        status: 409,
        erro:
          MENSAGEM_DA_REGRA[err.constraint] ??
          (String(err.constraint ?? "").endsWith("_pkey") ? "Já existe um registro com esta chave primária." : null) ??
          `Valor duplicado: já existe um registro com esse valor (regra ${err.constraint ?? "de unicidade"}).`,
      };
    case "23502":
      return { status: 400, erro: `O campo "${err.column ?? "obrigatório"}" é obrigatório.` };
    case "23514": {
      if (MENSAGEM_DA_REGRA[err.constraint]) return { status: 400, erro: MENSAGEM_DA_REGRA[err.constraint] };
      const rs = await lerRestricao(err);
      return {
        status: 400,
        erro: `Valor fora da regra de validação ${err.constraint ?? ""}${rs?.definicao ? `: ${rs.definicao}` : ""}.`,
      };
    }
    case "22P02":
    case "22007":
    case "22008":
    case "22003":
      return { status: 400, erro: "Valor em formato inválido para o tipo do campo (confira números, datas e true/false)." };
    case "22001":
      return { status: 400, erro: "Texto maior do que o tamanho permitido para o campo." };
    case "42P01":
      return { status: 409, erro: "A tabela não existe. Use a opção 'Criar tabelas' em Banco de dados." };
    default:
      console.error("Erro no painel admin:", err);
      return { status: 500, erro: "Erro ao executar a operação no banco de dados." };
  }
}
