import { randomInt } from "crypto";

// Sem 0/O e 1/I, que se confundem ao digitar
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarCodigo(tamanho = 6) {
  let codigo = "";
  for (let i = 0; i < tamanho; i++) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}