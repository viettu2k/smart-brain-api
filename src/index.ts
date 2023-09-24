import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt-nodejs'
import cors from 'cors'
import knex from 'knex'
import morgan from 'morgan'

import register from './controllers/register'
import signin from './controllers/signin'
import profile from './controllers/profile'
import image from './controllers/image'
import auth from './controllers/authorization'

// Database Setup
const db = knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI as string // Assuming POSTGRES_URI is a string
})

const app = express()

const whitelist = ['http://localhost:3001']
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin as string) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(morgan('combined'))
app.use(cors(corsOptions))
app.use(express.json())

app.post('/signin', signin.signinAuthentication(db, bcrypt))
app.post('/register', (req: Request, res: Response) => {
  register.handleRegister(req, res, db, bcrypt)
})
app.get('/profile/:id', auth.requireAuth, (req: Request, res: Response) => {
  profile.handleProfileGet(req, res, db)
})
app.post('/profile/:id', auth.requireAuth, (req: Request, res: Response) => {
  profile.handleProfileUpdate(req, res, db)
})
app.put('/image', auth.requireAuth, (req: Request, res: Response) => {
  image.handleImage(req, res, db)
})
app.post('/imageurl', auth.requireAuth, (req: Request, res: Response) => {
  image.handleApiCall(req, res)
})

app.listen(3000, () => {
  console.log('app is running on port 3000')
})
