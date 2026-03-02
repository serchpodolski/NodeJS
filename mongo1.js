const mongoose = require('mongoose')
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);


if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://fstack:${password}@cluster0.ibr8swm.mongodb.net/test`

// mongoose.set('strictQuery',false)
mongoose.set('strictQuery',false)

mongoose.connect(url, { family: 4 })

const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

// const note = new Note({
//   content: 'JS is cool',
//   important: true,
// })



// note.save().then(result => {
//   console.log('note saved!')
//   mongoose.connection.close()
// })

Note.find({content: /JS/i}).then(result => {
  result.forEach(note => {
    console.log(note.content)
    console.log(note.important)
  })
  mongoose.connection.close()
})