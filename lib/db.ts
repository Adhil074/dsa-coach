import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in .env.local");

interface CachedConnection {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongoose ?? { 
  conn: null, 
  promise: null 
};

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase(): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function getSubmissionsCollection(): Promise<mongoose.mongo.Collection> {
  await connectToDatabase();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection not ready (db missing)");
  }

  return db.collection("submissions");
}