const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    conn.exec('docker ps', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '72.61.80.21',
    port: 22,
    username: 'root',
    password: 'DanielaVeit25?',
    readyTimeout: 10000
});
