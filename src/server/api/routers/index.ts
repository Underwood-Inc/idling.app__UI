import { Router } from "express";
import postsRouter from "./post.router";
import userRouter from "./user.router";

const router = Router();

router.use("/posts", postsRouter);
router.use("/users", userRouter);

export default router;
