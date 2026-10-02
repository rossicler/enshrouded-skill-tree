import { MongoClient } from "mongodb";

const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// MongoDB is optional: it only backs short share URLs. Without MONGODB_URI the
// client is never created and callers get a MongoNotConfiguredError instead.
export class MongoNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set; database features are disabled.");
    this.name = "MongoNotConfiguredError";
  }
}

export const isMongoConfigured = () => Boolean(process.env.MONGODB_URI);

let clientPromise: Promise<MongoClient> | undefined;

// Lazily connects on first use and shares the connection across calls.
export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new MongoNotConfiguredError());

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    global._mongoClientPromise ??= new MongoClient(uri, options).connect();
    return global._mongoClientPromise;
  }

  clientPromise ??= new MongoClient(uri, options).connect();
  return clientPromise;
}
