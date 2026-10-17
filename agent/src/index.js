const { collectInfo } = require('./collector');

const apiUrl = process.env.apiUrl || 'http://localhost:3000';
const apiToken = process.env.apiToken;
// Si se define intervalSeconds el agente repite el envio cada tanto
const intervalSeconds = Number(process.env.intervalSeconds) || 0;

async function sendReport() {
  const report = await collectInfo();

  const headers = { 'Content-Type': 'application/json' };
  if (apiToken) {
    headers['x-api-token'] = apiToken;
  }

  const response = await fetch(`${apiUrl}/api/report`, {
    method: 'POST',
    headers,
    body: JSON.stringify(report)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`La API respondio ${response.status}: ${result.error}`);
  }
  console.log(`Relevamiento enviado desde ${report.serverIp}, archivo ${result.file}`);
}

async function run() {
  try {
    await sendReport();
  } catch (error) {
    console.error(`No se pudo enviar el relevamiento: ${error.message}`);
    if (!intervalSeconds) {
      process.exit(1);
    }
  }

  if (intervalSeconds) {
    setTimeout(run, intervalSeconds * 1000);
  }
}

run();
