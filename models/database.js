const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/template1';

const client = new pg.Client(connectionString);
client.connect();
const query = client.query(
  'CREATE TABLE articles(id SERIAL PRIMARY KEY, title varchar(100) not null UNIQUE, author varchar(100), image varchar(200), timestamp timestamp default current_timestamp, url varchar(200), source varchar(100))');
query.on('end', () => { client.end(); })