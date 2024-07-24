import { NextApiRequest, NextApiResponse } from "next";

const createItem = (data: Record<string, number>): number => Math.floor(Math.random())

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = req.body;
  console.log('data', data)
  const id = await createItem(data); // Implement your data creation logic
  res.status(200).json({ id });
}