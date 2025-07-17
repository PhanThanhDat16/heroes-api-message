import { Request, Response, NextFunction } from 'express';
import { EHttpStatus } from '~/types/httpStatus';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message || 'Internal Server Error'
  });
};