const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

const databasePath = path.join(__dirname, 'sampledatabase.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(8000, () =>
      console.log('Server Running at http://localhost:8000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const authenticateToken = async (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send({error_message: 'Authentication required'})
  } else {
    // verify the jwtToken
    await jwt.verify(jwtToken, 'balaji@2023', async (error, user) => {
      if (error) {
        response.status(401)
        response.send({error_message: 'Authentication required'})
      } else {
        // request.username = payload.username;
        next()
      }
    })
  }
}

// Make a api for phone number login 1

app.post('/login', async (request, response) => {
  const {userPhoneNumber, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE userPhoneNumber = '${userPhoneNumber}'`
  const dbUser = await database.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        userPhoneNumber,
      }
      const jwtToken = jwt.sign(payload, 'balaji@2023')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

// 2. Refer to the tables below, Write a sql query for finding the subjects for each
// student, the subjects should be order by alphabetically .

app.get('/customerSubjects/:customerId', async (request, response) => {
  const {customerId} = request.params

  const getDbCustomersQuery = `
  SELECT * from customers where customer_id  = ${customerId}`

  const dbCustomer = await database.get(getDbCustomersQuery)
  //   const {customer_id} = dbCustomer

  if (dbCustomer !== undefined) {
    const getStudentsSubjectsQuery = `
    SELECT
      customers.customer_id as customerId,
      customers.customer_name as customerName,
      GROUP_CONCAT( subjects.subject_name,',') as subjects
    FROM subjects 
    join customers on customers.customer_id = subjects.customer_id
    WHERE customers.customer_id =${customerId}
    AND subjects.subject_name IN ("English","Hindi","Maths") 
    ORDER BY subjects.subject_name;`

    const studentsDetailsArray = await database.get(getStudentsSubjectsQuery)
    response.send({
      customerId: studentsDetailsArray.customerId,
      customerName: studentsDetailsArray.customerName,
      subjects: [...studentsDetailsArray.subjects.split(',')].map(i =>
        i.toLowerCase(),
      ),
    })
  } else {
    response.status(400)
    response.send({error_message: 'invalid user'})
  }

  //
})

// 3. Write a function in node that inserts the following data in mysql , the email should
// be unique and if the email already exists in the system then the name of the customer
// will be updated with the new name that is there in the array for that customer.

app.post('/customers/', authenticateToken, async (request, response) => {
  const getDbCustomersQuery = `
  SELECT * from customers where email  = '${request.body.name}'`
  const dbCustomer = await database.get(getDbCustomersQuery)

  const {email, name} = request.body

  if (dbCustomer === undefined) {
    if (name !== '' && email !== '') {
      const postCustomerQuery = `
        INSERT INTO
            customers(customer_name, email)
        VALUES
            ('${name}', '${email}');`
      await database.run(postCustomerQuery)
      response.send('Customer details Successfully Added')
      response.status(200)
    } else {
      response.status(400)
      response.send({error_message: 'please enter phone number and password'})
    }
  } else {
    response.send({error_message: 'user already exists'})
  }
})

// stuff for adding and checking

// Add  Users api 3
app.post('/users/', async (request, response) => {
  const {userPhoneNumber, password} = request.body

  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE userPhoneNumber = '${userPhoneNumber}'`
  const dbUser = await database.get(selectUserQuery)

  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (userPhoneNumber, password) 
      VALUES 
        (
          '${userPhoneNumber}', 
          '${hashedPassword}' 
        )`
    const dbResponse = await database.run(createUserQuery)
    const newUserId = dbResponse.lastID
    response.send(`Created new user with ${newUserId}`)
  } else {
    response.status = 400
    response.send('User already exists')
  }
})

// API 1 get student details with subjects names

app.get('/customerSubjects/', async (request, response) => {
  const getStudentsSubjectsQuery = `
    SELECT
      customers.customer_id as customerId,
      customers.customer_name as name,
      GROUP_CONCAT( subjects.subject_name,',') as subjects
    FROM subjects 
    join customers on customers.customer_id = subjects.customer_id
    WHERE  subjects.subject_name IN ("English","Hindi","Maths") 
    GROUP BY customers.customer_id
    ORDER BY subjects.subject_name;`

  const studentsDetailsArray = await database.all(getStudentsSubjectsQuery)
  response.send(
    studentsDetailsArray.map(obj => ({
      customerId: obj.customerId,
      name: obj.name,
      subjects: [...obj.subjects.split(',')],
    })),
  )

  //
})

// Api get all customers

app.get('/customers/', async (request, response) => {
  const getCustomersQuery = `
    SELECT
     customer_id as customerId,
      customer_name as name,
        email
    FROM customers
    group by email;`

  const customersArray = await database.all(getCustomersQuery)
  response.send(customersArray)

  //
})
// Api get all subjects

app.get('/subjects/', async (request, response) => {
  const getSubjectsQuery = `
    SELECT
     Distinct(subject_id )as subjectId,
      subject_name as subjectName
    FROM subjects
    order by subject_name;`

  const subjectsDetailsArray = await database.all(getSubjectsQuery)
  response.send(subjectsDetailsArray)

  //
})

// Api 3 delete students or customers details

app.delete('/customers/:customerId/', async (request, response) => {
  const {customerId} = request.params
  const deleteCustomerQuery = `
  DELETE FROM
    customers
  WHERE
    customer_id = ${customerId} 
  `
  await database.run(deleteCustomerQuery)
  response.send('Customer Removed')
})

// end

module.exports = app
