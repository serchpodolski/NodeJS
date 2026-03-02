const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"])
const app = express()
require('dotenv').config()
const Note = require('./models/note')

app.use(cors())
app.use(express.static('dist'))


const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(express.json())
app.use(requestLogger)

app.get('/api/notes', (request, response) => {
  Note.find({}).then(result => {
    response.json(result)
  })
})

app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id).then(note => {
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response) => {
  Note.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))  
})

app.put('/api/notes/:id', (request, response, next) => {
  const {content, important} = request.body

  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        note.content = content
        note.important = important

      note.save()
        .then(updatedNote => {
          response.json(updatedNote)
        })  
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})


app.post('/api/notes', (request, response, next) => {
  const body = request.body
  // Removing this validation to use MongoDB validator
  // if (!body.content) {
  //   return response.status(400).json({
  //     error: 'content missing'
  //   })
  // }
  const note = new Note({
    content: body.content,
    important: body.important || false
  })

  note.save().then(savedNote => {
    response.status(201).json(savedNote)
  })
  .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message }) // Adding validation handling for mongoDB validators
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})