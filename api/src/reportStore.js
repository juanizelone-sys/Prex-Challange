const fs = require('fs/promises');
const path = require('path');
const net = require('net');

const dataDir = process.env.dataDir || path.resolve('data');

// Cola simple para que dos envios al mismo archivo no se pisen entre si
let pendingWrites = Promise.resolve();

// Saca el prefijo de IPv4 mapeada en IPv6 y cambia los dos puntos para que
// el nombre del archivo sea valido tambien en Windows
function cleanIp(rawIp) {
  const ip = String(rawIp || '').replace('::ffff:', '');
  if (!net.isIP(ip)) {
    return null;
  }
  return ip.replace(/:/g, '.');
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function buildFileName(safeIp, day) {
  return `${safeIp}_${day}.json`;
}

async function writeReport(safeIp, report) {
  await fs.mkdir(dataDir, { recursive: true });
  const day = todayString();
  const fileName = buildFileName(safeIp, day);
  const filePath = path.join(dataDir, fileName);

  // Si ya hay un archivo del dia se agrega el relevamiento nuevo al final
  let reports = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    reports = JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  reports.push({ receivedAt: new Date().toISOString(), ...report });
  await fs.writeFile(filePath, JSON.stringify(reports, null, 2), 'utf8');
  return fileName;
}

function saveReport(rawIp, report) {
  const safeIp = cleanIp(rawIp);
  if (!safeIp) {
    return Promise.reject(new Error('IP invalida'));
  }
  const job = pendingWrites.then(() => writeReport(safeIp, report));
  pendingWrites = job.catch(() => {});
  return job;
}

async function readReports(rawIp, day) {
  const safeIp = cleanIp(rawIp);
  if (!safeIp) {
    return null;
  }

  let files = [];
  try {
    files = await fs.readdir(dataDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const prefix = buildFileName(safeIp, '').replace('.json', '');
  const matches = files
    .filter((file) => file.startsWith(prefix) && file.endsWith('.json'))
    .filter((file) => !day || file === buildFileName(safeIp, day))
    .sort();

  const results = [];
  for (const file of matches) {
    const content = await fs.readFile(path.join(dataDir, file), 'utf8');
    results.push({
      file,
      date: file.slice(prefix.length, -5),
      reports: JSON.parse(content)
    });
  }
  return results;
}

module.exports = { saveReport, readReports, cleanIp };
