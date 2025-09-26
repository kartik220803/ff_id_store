#!/usr/bin/env node

const os = require('os');
const { exec } = require('child_process');
const net = require('net');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const devName in interfaces) {
        const iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];

            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                addresses.push({ interface: devName, address: alias.address });
            }
        }
    }

    return addresses;
}

function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(3000);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function runDiagnostics() {
    console.log('🔍 Network Diagnostics for Mobile Development');
    console.log('='.repeat(50));

    // Get all IP addresses
    const addresses = getLocalIPAddress();
    console.log('\n📡 Available Network Interfaces:');
    addresses.forEach(addr => {
        console.log(`   ${addr.interface}: ${addr.address}`);
    });

    if (addresses.length === 0) {
        console.log('❌ No network interfaces found!');
        return;
    }

    const primaryIP = addresses[0].address;
    console.log(`\n🎯 Primary IP: ${primaryIP}`);

    // Check if ports are open
    console.log('\n🔌 Port Connectivity Check:');

    const ports = [3000, 5000];
    for (const port of ports) {
        const isOpen = await checkPort('127.0.0.1', port);
        const status = isOpen ? '✅ OPEN' : '❌ CLOSED';
        console.log(`   Port ${port}: ${status}`);

        if (isOpen) {
            console.log(`      📱 Mobile URL: http://${primaryIP}:${port}`);
        }
    }

    // Firewall check commands
    console.log('\n🛡️  Firewall Check Commands:');
    console.log('   Run these commands to check/configure firewall:');
    console.log('');
    console.log('   Ubuntu/Debian:');
    console.log('   sudo ufw status');
    console.log('   sudo ufw allow 3000');
    console.log('   sudo ufw allow 5000');
    console.log('');
    console.log('   CentOS/RHEL/Fedora:');
    console.log('   sudo firewall-cmd --list-all');
    console.log('   sudo firewall-cmd --add-port=3000/tcp --permanent');
    console.log('   sudo firewall-cmd --add-port=5000/tcp --permanent');
    console.log('   sudo firewall-cmd --reload');

    // Network connectivity test
    console.log('\n🌐 Network Connectivity Test:');
    console.log('   Test from your mobile browser:');
    console.log(`   http://${primaryIP}:3000`);
    console.log(`   http://${primaryIP}:5000`);

    // Additional troubleshooting
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('   1. Ensure both devices are on the same WiFi network');
    console.log('   2. Check firewall settings (commands above)');
    console.log('   3. Verify servers are running with 0.0.0.0 binding');
    console.log('   4. Try accessing from another computer on the network');
    console.log('   5. Restart both servers if needed');

    console.log('\n📋 Quick Commands to Restart Servers:');
    console.log('   Backend:  cd server && npm start');
    console.log('   Frontend: cd client && npm start');

    console.log('\n🔄 If still not working, try these additional steps:');
    console.log('   1. Disable firewall temporarily for testing');
    console.log('   2. Check router/WiFi settings for AP isolation');
    console.log('   3. Try connecting mobile via USB tethering');
    console.log('   4. Check if antivirus is blocking connections');
}

runDiagnostics().catch(console.error);
