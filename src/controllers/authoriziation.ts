import { Request, Response, NextFunction } from 'express'
import { redisClient } from './signin' // Assuming that 'redisClient' is exported from './signin'

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers

  if (!authorization) return res.status(401).send('Unauthorized')

  return redisClient.get(authorization as string, (err, reply) => {
    if (err || !reply) return res.status(401).send('Unauthorized')

    return next()
  })
}

export { requireAuth }
