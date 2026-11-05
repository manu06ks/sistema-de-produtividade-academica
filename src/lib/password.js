import bcrypt from "bcryptjs";

const CUSTO = 10;

export async function hashPassword(senha) {
  return bcrypt.hash(senha, CUSTO);
}

export async function verifyPassword(senha, hash) {
  return bcrypt.compare(senha, hash);
}