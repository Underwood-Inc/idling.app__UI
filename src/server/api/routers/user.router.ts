import { NextFunction, Request, Response, Router } from 'express';
import { sign } from 'jsonwebtoken';
import { IUserFilters } from '../../interfaces/user.interface';
import { UserController } from '../controllers/user';
import { AuthUserDTO, CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';

const userRouter = Router();
const controller = new UserController();
const jwtSecret = process.env.JWT_TOKEN;

// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: NextFunction) => {
  console.log(
    `${req.hostname}:${process.env.PORT || 8080}${
      req.originalUrl
    }@${Date.now()}`
  );

  next();
};
userRouter.use(timeLog);

// get user
userRouter.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  console.log('id', id);
  const result = await controller.getById(id);

  return res.status(200).send(result);
});

// update user
userRouter.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload: UpdateUserDTO = req.body;

  const result = await controller.update(id, payload);
  return res.status(201).send(result);
});

// delete user
userRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await controller.deleteById(id);

  return res.status(204).send(result);
});

// create user
userRouter.post('/', async (req: Request, res: Response) => {
  const payload: CreateUserDTO = req.body;

  const result = await controller.create(payload);
  return res.status(200).send(result);
});

// get all users
userRouter.get('/', async (req: Request, res: Response) => {
  const filters: IUserFilters = req.query;

  const results = await controller.getAll(filters);
  return res.status(200).send(results);
});

// authenticate user
// TODO: alias endpoint /login
userRouter.post('/authenticate', async (req: Request, res: Response) => {
  const payload: AuthUserDTO = req.body;

  const user = await controller.authenticate({
    password: payload.password,
    userName: payload.userName,
  });

  if (user) {
    const jwtToken = sign(
      JSON.stringify({
        id: user.id,
        email: user.email,
        userName: user.userName,
      }),
      jwtSecret || 'dumb_secret'
    );

    return res.status(200).send({
      user,
      jwtToken,
    });
  }

  return res.status(403).send('User is not authorized');
});

export default userRouter;
