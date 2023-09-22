import { Request, Response } from 'express'
import Clarifai from 'clarifai'

const app = new Clarifai.App({
  apiKey: 'CLARIFI_API_KEY'
})

const handleApiCall = (req: Request, res: Response) => {
  app.models
    .predict('face-detection', req.body.input)
    .then((data: any) => {
      res.json(data)
    })
    .catch((err: any) => res.status(400).json('unable to work with API'))
}

const handleImage = (req: Request, res: Response, db: any) => {
  const { id } = req.body

  db('users')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then((entries: any) => {
      res.json(entries[0].entries)
    })
    .catch((err: any) => res.status(400).json('unable to get entries'))
}

export default {
  handleImage,
  handleApiCall
}
