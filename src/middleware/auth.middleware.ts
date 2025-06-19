import jwt, { JwtPayload } from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { EHttpStatus } from '~/types/httpStatus'


interface IRequestWithUser extends Request {
  user?: JwtPayload
}

export function requireAuth(req: IRequestWithUser, res: Response, next: NextFunction) {
  const authorizationHearder = req.headers.authorization
  if (!authorizationHearder) {
    res.status(EHttpStatus.BAD_REQUEST).json({ error: 'Authorization header is missing' })
    return
  }
  const accessToken = authorizationHearder.split(' ')[1]
  if (!accessToken) {
    res.status(EHttpStatus.BAD_REQUEST).json({
      error: 'AccessToken is missing'
    })
    return
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.SECRETKEY_ACCESSTOKEN as string) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    res.status(EHttpStatus.UNAUTHORIZED).json({
      message: 'unauthorized'
    })
  }
}
