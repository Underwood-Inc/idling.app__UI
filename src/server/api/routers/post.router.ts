import { NextFunction, Request, Response, Router } from "express";
import { Filters } from "../../interfaces/filters.interface";
import { PostController } from "../controllers/post";
import { CreatePostDTO, UpdatePostDTO } from "../dto/post.dto";

const postsRouter = Router();
const controller = new PostController();

// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method}:Time: `, Date.now());

  next();
};
postsRouter.use(timeLog);

// get post
postsRouter.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  console.log("id", id);
  const result = await controller.getById(id);

  return res.status(200).send(result);
});

// update post
postsRouter.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload: UpdatePostDTO = req.body;

  const result = await controller.update(id, payload);
  return res.status(201).send(result);
});

// delete post
postsRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await controller.deleteById(id);

  return res.status(204).send(result);
});

// create post
postsRouter.post("/", async (req: Request, res: Response) => {
  const payload: CreatePostDTO = req.body;

  const result = await controller.create(payload);
  return res.status(200).send(result);
});

// get all posts
postsRouter.get("/", async (req: Request, res: Response) => {
  const filters: Filters = req.query;

  const results = await controller.getAll(filters);
  return res.status(200).send(results);
});

export default postsRouter;
