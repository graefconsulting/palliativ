const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
const localPath = path.join(__dirname, '..', 'prisma', 'dev.db');

const timeout = setTimeout(() => {
    console.error('TIMEOUT: Operation took too long, aborting.');
    conn.end();
    process.exit(1);
}, 30000);

conn.on('ready', () => {
    console.log('Connected!');

    // Step 1: Find the prisma dir inside the palliativteam project
    conn.exec('find /root/palliativteam -name "dev.db" -type f 2>/dev/null; find /root/palliativteam -name "prisma" -type d 2>/dev/null; ls -la /root/palliativteam/', (err, stream) => {
        if (err) { console.error('Exec error:', err); conn.end(); return; }

        let output = '';
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { console.log('STDERR:', data.toString()); });
        stream.on('close', () => {
            console.log('Server structure:\n' + output);

            // Step 2: Upload to the right place
            conn.sftp((err, sftp) => {
                if (err) { console.error('SFTP error:', err); conn.end(); return; }

                // Try uploading to likely paths
                const targets = [
                    '/root/palliativteam/backend/prisma/dev.db',
                    '/root/palliativteam/prisma/dev.db',
                    '/root/palliativteam/dev.db'
                ];

                // Find matching path from output
                const lines = output.trim().split('\n');
                let targetPath = null;
                for (const line of lines) {
                    if (line.includes('dev.db')) {
                        targetPath = line.trim();
                        break;
                    }
                }

                if (!targetPath) {
                    // Check if there's a prisma directory
                    for (const line of lines) {
                        if (line.includes('prisma')) {
                            targetPath = line.trim() + '/dev.db';
                            break;
                        }
                    }
                }

                if (!targetPath) {
                    targetPath = targets[0]; // fallback
                }

                console.log('Uploading to:', targetPath);
                sftp.fastPut(localPath, targetPath, (err) => {
                    if (err) {
                        console.error('Upload error:', err.message);
                        console.log('Trying alternative path...');
                        // Try creating directory and uploading
                        conn.exec('mkdir -p /root/palliativteam/backend/prisma', (err, stream) => {
                            if (err) { console.error(err); conn.end(); return; }
                            stream.on('close', () => {
                                sftp.fastPut(localPath, targets[0], (err) => {
                                    if (err) { console.error('Final upload error:', err.message); }
                                    else { console.log('Upload successful to', targets[0]); }
                                    clearTimeout(timeout);
                                    conn.end();
                                });
                            });
                        });
                    } else {
                        console.log('Upload successful!');
                        clearTimeout(timeout);
                        conn.end();
                    }
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err.message);
    clearTimeout(timeout);
    process.exit(1);
}).connect({
    host: '72.61.80.21',
    port: 22,
    username: 'root',
    password: 'DanielaVeit25?',
    readyTimeout: 10000,
    keepaliveInterval: 5000
});
