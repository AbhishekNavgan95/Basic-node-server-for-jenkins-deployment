const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const serverPath = path.join(__dirname, '..', 'index.js');

let serverProcess;
let port;

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const { port: freePort } = server.address();
            server.close(() => resolve(freePort));
        });
        server.on('error', reject);
    });
}

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        }).on('error', reject);
    });
}

async function waitForServer(baseUrl, maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            await get(`${baseUrl}/health`);
            return;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    throw new Error('Server did not start in time');
}

before(async () => {
    port = await getFreePort();
    serverProcess = spawn(process.execPath, [serverPath], {
        env: { ...process.env, PORT: String(port) },
        stdio: 'pipe',
    });

    await waitForServer(`http://127.0.0.1:${port}`);
});

after(() => {
    if (serverProcess && !serverProcess.killed) {
        serverProcess.kill();
    }
});

describe('Server', () => {
    it('GET / returns Hello World v2', async () => {
        const res = await get(`http://127.0.0.1:${port}/`);

        assert.equal(res.status, 200);
        assert.equal(res.body, 'Hello World v2');
    });

    it('GET /health returns ok status', async () => {
        const res = await get(`http://127.0.0.1:${port}/health`);

        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.body), {
            status: 'ok',
            message: 'Server is running',
        });
    });
});
