const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://ems_user:pass@127.0.0.1:5432/ems_studio',
});

console.log('Connecting...');

client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.query('SELECT 1');
    })
    .then(res => {
        console.log('Query result:', res.rows[0]);
        return client.end();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
