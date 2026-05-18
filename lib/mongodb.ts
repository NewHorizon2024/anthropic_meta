import { Db, MongoClient } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// In development, Next.js hot-reloads constantly which would
// create a new MongoClient on every reload — expensive and buggy.
// We cache the client on the global object to reuse it.
declare global {
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

export async function getDb(): Promise<Db> {
  await client.connect();
  return client.db("ai_shop"); // your database name
}
