import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";

const DB_NAME = "skill-planner";

export type Code = {
  code: string;
};

export const getCode = async (id: string): Promise<string | undefined> => {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection("codes");
  const results = await collection.findOne<Code>({ _id: new ObjectId(id) });
  if (results) {
    return results.code;
  }
};

export const saveCode = async (code: string): Promise<string> => {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection("codes");
  const id = new ObjectId();
  await collection.insertOne({ _id: id, code });
  return id.toString();
};
