import { generateKeyPairSync } from "crypto";
import fs from "fs";

function gen(name: string) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048, // 2048-3072
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }, // BEGIN PRIVATE KEY
  });
  fs.writeFileSync(`${name}_private.pem`, privateKey);
  fs.writeFileSync(`${name}_public.pem`, publicKey);
  console.log(`Wrote ${name}_private.pem & ${name}_public.pem`);
}

gen("access");
gen("refresh"); // ถ้าอยากใช้ชุดเดียวกัน ลบบรรทัดนี้แล้วคัดลอก access → refresh ก็ได้
