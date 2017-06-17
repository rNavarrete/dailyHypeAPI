const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/template1';

const client = new pg.Client(connectionString);

client.connect();

const query = client.query('CREATE TABLE releases(id SERIAL PRIMARY KEY, model varchar(100) not null UNIQUE, image varchar(200), releaseDate varchar(200), timestamp timestamp default current_timestamp, price varchar(100), source varchar(10))');

query.on('end', () => { client.end(); })
