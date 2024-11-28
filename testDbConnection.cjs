const { Client } = require('pg');

// Connection details
const client = new Client({
  host: "localhost",       
  port: 5432,       
  user: "ayushjain1",       
  password: "fynd_hr_application",
  database: "fynd_hr_application"
});

// Test the connection
client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database!');
    // Run a simple query to check if the database is working
    return client.query('SELECT 1');
  })
  .then((res) => {
    console.log('Query result:', res.rows);
  })
  .catch((err) => {
    console.error('Error connecting to the database', err);
  })
  .finally(() => {
    client.end();
  });
