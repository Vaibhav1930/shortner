import { randomInt } from "crypto";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateShortCode(length = 7): string {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += alphabet[randomInt(alphabet.length)];
  }

  return code;
}
