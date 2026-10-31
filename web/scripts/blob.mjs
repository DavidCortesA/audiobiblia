// Subidor de audios para la Mac (lo llama audiobiblias/audio.py).
//   node scripts/blob.mjs put <archivo> <ruta> [tipo]   → imprime la URL pública (tipo: audio/mp4 por defecto)
//   node scripts/blob.mjs del <url> [url...]
//   node scripts/blob.mjs list <prefijo>          → JSON con url, pathname, size
// Requiere BLOB_READ_WRITE_TOKEN en el entorno.
import { readFile } from "node:fs/promises";
import { del, list, put } from "@vercel/blob";

const [accion, ...args] = process.argv.slice(2);

if (accion === "put") {
  const [archivo, ruta, tipo = "audio/mp4"] = args;
  const blob = await put(ruta, await readFile(archivo), {
    access: "public",
    contentType: tipo,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });
  console.log(blob.url);
} else if (accion === "del") {
  if (args.length) await del(args);
} else if (accion === "list") {
  const todos = [];
  let cursor;
  do {
    const r = await list({ prefix: args[0] ?? "", cursor, limit: 1000 });
    todos.push(...r.blobs.map(({ url, pathname, size }) => ({ url, pathname, size })));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  console.log(JSON.stringify(todos));
} else {
  console.error("uso: blob.mjs put|del|list");
  process.exit(1);
}
