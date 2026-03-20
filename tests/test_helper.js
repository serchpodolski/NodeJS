const Note = require('../models/note')
const User = require('../models/user')
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// initialNotes do not include user references; the tests create a user first
// and associate the notes with that user during setup.

const initialNotes = [
  {
    content: 'HTML is easy',
    important: false
  },
  {
    content: 'Browser can execute only JavaScript',
    important: true
  }
]

// helper that creates a user in the database and returns its id
// create a user and optionally return an auth token
const createUser = async ({ username = 'root', password = 'sekret' } = {}) => {
  const passwordHash = await bcrypt.hash(password, 10)
  const user = new User({ username, passwordHash })
  const saved = await user.save()

  // sign a JWT that matches the production login logic
  const userForToken = {
    username: saved.username,
    id: saved._id.toString()
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  return { id: saved._id.toString(), token }
}

const nonExistingId = async () => {
  const note = new Note({ content: 'willremovethissoon' })
  await note.save()
  console.log(note.id)
  await note.deleteOne()
  return note._id.toString()
}

const notesInDb = async () => {
  const notes = await Note.find({})
  return notes.map(note => note.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}


module.exports = {
  initialNotes,
  nonExistingId,
  notesInDb,
  usersInDb,
  createUser
}
