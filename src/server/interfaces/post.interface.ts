import { Optional } from "sequelize";
import { TimeStamps } from "./common.interface";

export interface Post extends TimeStamps {
  id: number;
  name: string;
  slug: string;
}

export type IPostInput = Optional<Post, "id" | "slug">;
export type IPostOutput = Required<Post>;
