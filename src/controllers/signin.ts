import jwt from 'jsonwebtoken'
import redis from 'redis'
import { Request, Response } from 'express'

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
})

async function redisConnect() {
  return await redisClient.connect()
}

redisConnect()

const signToken = (username: string) => jwt.sign({ username }, 'JWT_SECRET_KEY', { expiresIn: '2 days' })

const setToken = (key: string, value: string) =>
  new Promise<string>((resolve, reject) => {
    redisClient
      .set(key, value)
      .then((reply: any) => {
        resolve(reply)
      })
      .catch((err: any) => {
        reject(err)
      })
  })

const createSession = (user: { email: string; id: string }) => {
  const { email, id } = user
  const token = signToken(email)

  return setToken(token, id)
    .then(() => {
      return { success: 'true', userId: id, token, user }
    })
    .catch(console.log)
}

const handleSignin = (db: any, bcrypt: any, req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) return Promise.reject('incorrect form submission')

  return db
    .select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then((data: any[]) => {
      const isValid = bcrypt.compareSync(password, data[0].hash)
      if (isValid) {
        return db
          .select('*')
          .from('users')
          .where('email', '=', email)
          .then((user: any) => user[0])
          .catch((err: any) => res.status(400).json('unable to get user'))
      } else {
        return Promise.reject('wrong credentials')
      }
    })
    .catch((err: any) => err)
}

const getAuthTokenId = (req: Request, res: Response) => {
  const { authorization } = req.headers

  redisClient
    .get(authorization as string)
    .then((reply: any) => {
      if (!reply) return res.status(401).send('Unauthorized')

      return res.json({ id: reply })
    })
    .catch((err: any) => {
      console.error('Error retrieving token:', err)

      return res.status(500).send('Internal Server Error')
    })
}

const signinAuthentication = (db: any, bcrypt: any) => (req: Request, res: Response) => {
  const { authorization } = req.headers

  return authorization
    ? getAuthTokenId(req, res)
    : handleSignin(db, bcrypt, req, res)
        .then((data: any) => (data.id && data.email ? createSession(data) : Promise.reject(data)))
        .then((session: any) => res.json(session))
        .catch((err: any) => res.status(400).json(err))
}

export default { signinAuthentication, redisClient }
