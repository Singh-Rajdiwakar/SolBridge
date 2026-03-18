import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { env } from "./env.js";

let memoryServer;

export async function connectDatabase() {
  const uri = env.mongoUri || (await getMemoryUri());

  await mongoose.connect(uri, {
    dbName: env.mongoUri ? undefined : "solanablocks",
  });

  return mongoose.connection;
}

async function getMemoryUri() {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: "solanablocks",
      },
    });
  }

  return memoryServer.getUri();
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
