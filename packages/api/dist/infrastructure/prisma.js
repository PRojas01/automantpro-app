import { createRequire } from "node:module";
import { applyDatabaseUrl } from "./database-url.js";
// El cliente de Prisma se carga en la primera consulta (no al arrancar): así la API
// arranca y responde los chequeos de salud aunque la base de datos o el cliente
// generado todavía no estén disponibles en la plataforma.
const require = createRequire(import.meta.url);
let client;
function getClient() {
    if (client)
        return client;
    // S1-24: si DATABASE_URL no está definida, se compone desde DB_HOST/DB_PORT/DB_NAME/
    // DB_USER/DB_PASSWORD del MySQL administrado (sin loguear credenciales).
    applyDatabaseUrl();
    const { PrismaClient: Client } = require("@prisma/client");
    if (process.env.NODE_ENV === "production") {
        client = new Client();
    }
    else {
        global.__prisma ??= new Client();
        client = global.__prisma;
    }
    return client;
}
const prisma = new Proxy({}, {
    get(_target, prop) {
        const real = getClient();
        const value = real[prop];
        return typeof value === "function" ? value.bind(real) : value;
    },
});
export { prisma };
//# sourceMappingURL=prisma.js.map