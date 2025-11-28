const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

const ips = getLocalIP();

console.log('\n🌐 Your local network IP addresses:\n');
if (ips.length === 0) {
  console.log('❌ No network interfaces found');
} else {
  ips.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip.address} (${ip.interface})`);
  });
  console.log(`\n📱 Use this in your mobile app: http://${ips[0].address}:5000/api`);
  console.log(`\n💡 Make sure your phone is on the same WiFi network as this computer!\n`);
}

