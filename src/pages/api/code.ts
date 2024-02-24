// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { saveCode } from "@/lib/api/code";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  code?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "POST") {
    const { code } = req.body;
    try {
      const result = await saveCode(code);
      console.log("result", result);
      return res.status(200).json({ code: result });
    } catch (e: any) {
      console.log(e);
      return res.status(500).json({ error: e.toString() });
    }
  } else {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
