import Post from "./models/post.model";
import User from "./models/user";

const isDev = process.env.NODE_ENV === "development";

const dbInit = () => {
  Post.sync({ alter: isDev });
  User.sync({ alter: isDev });
};
export default dbInit;
