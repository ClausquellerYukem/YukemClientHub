const mod = process.env.DATABASE_URL ? await import("./storage.db") : await import("./storage.memory");
export const storage = mod.storage;
