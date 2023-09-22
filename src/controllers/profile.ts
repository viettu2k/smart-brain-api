import { Request, Response } from 'express'

const handleProfileGet = (req: Request, res: Response, db: any): void => {
  const { id } = req.params

  db.select('*')
    .from('users')
    .where({ id })
    .then((user: any[]) => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch((err: any) => res.status(400).json('error getting user'))
}

const handleProfileUpdate = (req: Request, res: Response, db: any): void => {
  const { id } = req.params
  const { name } = req.body.formInput

  db('users')
    .where({ id })
    .update({ name: name })
    .then((resp: number) => {
      if (resp) {
        res.json('success')
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch((err: any) => res.status(400).json('error updating user'))
}

export { handleProfileGet, handleProfileUpdate }
