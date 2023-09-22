import { Request, Response, NextFunction } from 'express'
import { redisClient } from './signin'

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers

  if (!authorization) return res.status(401).send('Unauthorized')

  try {
    const reply = await redisClient.get(authorization as string)

    if (!reply) return res.status(401).send('Unauthorized')

    return next()
  } catch (err) {
    console.error('Error checking authorization:', err)
    return res.status(500).send('Internal Server Error')
  }
}

export { requireAuth }
