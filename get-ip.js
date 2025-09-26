#!/usr/bin/env node

const os = require('os');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const devName in interfaces) {
        const iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];

            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }

    return 'localhost';
}

const localIP = getLocalIPAddress();
const serverPort = process.env.PORT || 5000;
const clientPort = 3000;

console.log('\n🚀 Development Server URLs:');
console.log('================================');
console.log(`📱 Mobile/LAN Access:`);
console.log(`   Frontend: http://${localIP}:${clientPort}`);
console.log(`   Backend:  http://${localIP}:${serverPort}`);
console.log('');
console.log(`💻 Local Access:`);
console.log(`   Frontend: http://localhost:${clientPort}`);
console.log(`   Backend:  http://localhost:${serverPort}`);
console.log('');
console.log('📋 Make sure both devices are on the same WiFi network!');
console.log('');
