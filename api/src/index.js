const express = require('express');
const { saveReport, readReports, cleanIp } = require('./reportStore');

const app = express();
const port = process.env.port || 3000;
const apiToken = process.env.apiToken;

// El listado de procesos puede ser grande, por eso subo el limite del body
app.use(express.json({ limit: '5mb' }));

// Si se define apiToken, todos los pedidos tienen que traerlo en el header
app.use((req, res, next) => {
  if (apiToken && req.path !== '/api/health') {
    if (req.get('x-api-token') !== apiToken) {
      return res.status(401).json({ error: 'Token invalido' });
    }
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

function isValidReport(body) {
  return (
    body &&
    body.cpu &&
    Array.isArray(body.processes) &&
    Array.isArray(body.loggedUsers) &&
    body.os &&
    body.os.name &&
    body.os.version
  );
}

app.post('/api/report', async (req, res, next) => {
  try {
    const body = req.body;
    if (!isValidReport(body)) {
      return res.status(400).json({
        error: 'Faltan campos: cpu, processes, loggedUsers y os (name, version)'
      });
    }

    // Uso la IP que manda el agente, y si no viene uso la de la conexion
    const serverIp = cleanIp(body.serverIp) ? body.serverIp : req.socket.remoteAddress;
    const fileName = await saveReport(serverIp, body);
    res.status(201).json({ message: 'Informacion guardada', file: fileName });
  } catch (error) {
    next(error);
  }
});

app.get('/api/info', async (req, res, next) => {
  try {
    const { ip, date } = req.query;
    if (!ip || !cleanIp(ip)) {
      return res.status(400).json({ error: 'Falta el parametro ip o no es valido' });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'La fecha debe tener formato AAAA-MM-DD' });
    }

    const results = await readReports(ip, date);
    if (results.length === 0) {
      return res.status(404).json({ error: 'No hay informacion para esa IP' });
    }
    res.json({ ip, results });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El JSON enviado no es valido' });
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
