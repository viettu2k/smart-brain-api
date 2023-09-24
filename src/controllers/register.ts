import { Request, Response } from 'express'

const handleRegister = (req: Request, res: Response, db: any, bcrypt: any) => {
  const { email, name, password } = req.body

  if (!email || !name || !password) return res.status(400).json('incorrect form submission')

  const hash = bcrypt.hashSync(password, 10)

  db.transaction((trx: any) => {
    trx
      .insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then((loginEmail: string[]) => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then((user: any[]) => {
            res.json(user[0])
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
  }).catch((err: any) => res.status(400).json('unable to register'))
}

export default { handleRegister }
