const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const assert = require('node:assert')
const helper = require('../tests/test_helper')
const Note = require('../models/note')
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const User = require('../models/user')


const app = require('../app')
const api = supertest(app)

describe('when there is initially some notes saved', () => {

  let rootUserId
  let rootToken

  beforeEach(async () => {
    await Note.deleteMany({})
    await User.deleteMany({})

    // create a fresh user that the notes will belong to via helper
    const created = await helper.createUser()
    rootUserId = created.id
    rootToken = created.token

    const noteObjects = helper.initialNotes.map(n => new Note({
      ...n,
      user: rootUserId
    }))
    const promises = noteObjects.map(n => n.save())
    await Promise.all(promises)
  })

  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')
    assert.strictEqual(response.body.length, helper.initialNotes.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes')
    const contents = response.body.map(r => r.content)
    assert(contents.includes('HTML is easy'))
  })

  // Tests for the GET route with an ID
  describe('viewing a specific note', () => {
    test('a specific note can be viewed', async () => {
      const notesAtStart = await helper.notesInDb()
      const noteToView = notesAtStart[0]

      // serializing the note fixes the nested ObjectId -> string conversion
      const processedNoteToView = JSON.parse(JSON.stringify(noteToView))

      const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.deepStrictEqual(resultNote.body, processedNoteToView)
    })

    test('fails with statuscode 404 if note does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId()

      await api
        .get(`/api/notes/${validNonexistingId}`)
        .expect(404)
    })

    test('fails with statuscode 400 if id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445'

      await api
        .get(`/api/notes/${invalidId}`)
        .expect(400)
    })
  })

  // Tests for the POST route
  describe('addition of a new note', () => {
    test('succeeds with valid data', async () => {
      // const notesAtStart = await helper.notesInDb()
      const newNote = {
        content: 'async/await simplifies making async calls',
        important: true,
        userId: rootUserId
      }
      console.log(newNote)

      await api
        .post('/api/notes')
        .set('Authorization', `Bearer ${rootToken}`)
        .send(newNote)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      // const response = await api.get('/api/notes')
      const notesAtEnd = await helper.notesInDb()
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

      const contents = notesAtEnd.map(r => r.content)
      assert(contents.includes('async/await simplifies making async calls'))

    })

    test('fails with status code 400 if data invalid', async () => {
      const newNote = {
        important: true
      }

      await api
        .post('/api/notes')
        .set('Authorization', `Bearer ${rootToken}`)
        .send(newNote)
        .expect(400)

      const notesAtEnd = await helper.notesInDb()

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
    })
  })



  // tests for the DELETE route
  describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const notesAtStart = await helper.notesInDb()
      const noteToDelete = notesAtStart[0]

      await api
        .delete(`/api/notes/${noteToDelete.id}`)
        .expect(204)

      const notesAtEnd = await helper.notesInDb()
      const ids = notesAtEnd.map(r => r.id)
      assert(!ids.includes(noteToDelete.id))
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)

    })
  })

  describe('updating a note', () => {
    test('succeeds with status code 200 if id is valid', async () => {
      const notesAtStart = await helper.notesInDb()
      const noteToUpdate = notesAtStart[0]

      await api
        .put(`/api/notes/${noteToUpdate.id}`)
        .send({ ...noteToUpdate, important: true })
        .expect(200)

      const notesAtEnd = await helper.notesInDb()
      const updatedNote = notesAtEnd.find(note => note.id === noteToUpdate.id)
      assert.strictEqual(updatedNote.important, true)
    })
  })

})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    // reuse helper to create root user
    await helper.createUser()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })




})

after(async () => {
  await mongoose.connection.close()
})
