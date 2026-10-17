const os = require('os');
const si = require('systeminformation');

// Busca la primera IPv4 que no sea de loopback
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const address of interfaces[name]) {
      const isIpv4 = address.family === 'IPv4' || address.family === 4;
      if (isIpv4 && !address.internal) {
        return address.address;
      }
    }
  }
  return '127.0.0.1';
}

async function collectInfo() {
  const [cpu, processes, users, osInfo] = await Promise.all([
    si.cpu(),
    si.processes(),
    si.users(),
    si.osInfo()
  ]);

  return {
    serverIp: getLocalIp(),
    hostname: os.hostname(),
    collectedAt: new Date().toISOString(),
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      speedGhz: cpu.speed,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      architecture: os.arch()
    },
    processes: processes.list.map((proc) => ({
      pid: proc.pid,
      name: proc.name,
      user: proc.user,
      cpuPercent: proc.cpu,
      memPercent: proc.mem,
      command: proc.command
    })),
    loggedUsers: users.map((user) => ({
      user: user.user,
      terminal: user.tty,
      date: user.date,
      time: user.time,
      from: user.ip
    })),
    os: {
      name: osInfo.distro,
      version: osInfo.release,
      platform: osInfo.platform,
      kernel: osInfo.kernel
    }
  };
}

module.exports = { collectInfo };
