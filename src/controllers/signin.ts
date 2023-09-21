import jwt from 'jsonwebtoken'
import redis from 'redis'
import { Request, Response } from 'express'

const redisClient = redis.createClient({
  url: 'redis://alice:foobared@awesome.redis.server:6380'
})

async function redisConnect() {
  return await redisClient.connect()
}

redisConnect()

const signToken = (username: string) => jwt.sign({ username }, 'JWT_SECRET_KEY', { expiresIn: '2 days' })

const setToken = (key: string, value: string) =>
  new Promise<string>((resolve, reject) => {
    redisClient.set(key, value, (err: any, reply: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(reply)
      }
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

  return redisClient.get(authorization as string, (err: any, reply: any) => {
    if (err || !reply) return res.status(401).send('Unauthorized')

    return res.json({ id: reply })
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

export { signinAuthentication, redisClient }
