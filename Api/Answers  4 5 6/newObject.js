const person = {
  id: 2,
  gender: 'male',
}
const student = {
  name: 'ravi',
  email: 'ravi11@yopmail.com',
}

const newObject = {...person, ...student}

module.exports = newObject

// console.log(newObject)
