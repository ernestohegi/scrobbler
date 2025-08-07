import { Request, Response } from "express";

export type HandleAuth = {
  req: Request;
  res: Response;
};
