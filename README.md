# Prex Challenge: relevamiento de servidores

Agente y API para recolectar informacion de un servidor y guardarla en archivos JSON. Todo corre en Docker (alternativa B del challenge).

## Descripcion

**Agente** ("agent"): programa en Node.js que releva procesador, procesos en ejecucion, usuarios con sesion abierta, nombre y version del sistema operativo. Usa la libreria "systeminformation", que funciona igual en Windows y Linux. Despues manda todo por POST a la API.

**API** ("api"): aplicacion en Node.js con Express y tres endpoints.

| Metodo | Ruta                | Que hace                                                        |
| ------ | ------------------- | --------------------------------------------------------------- |
| POST   | "/api/report"       | Recibe el relevamiento y lo guarda en "<IP>\_<AAAA-MM-DD>.json" |
| GET    | "/api/info?ip=<IP>" | Devuelve lo guardado para esa IP. Opcional "&date=AAAA-MM-DD"   |
| GET    | "/api/health"       | Chequeo de estado                                               |

Si el mismo servidor envia varias veces el mismo dia, los relevamientos se agregan al mismo archivo como una lista. Si se define la variable 'apiToken", la API exige el header "x-api-token".

## Requisitos

- Docker y Docker Compose
- Node.js 18 o superior (solo si queres correr el agente directo en tu maquina)

## Como ejecutar

### 1. Levantar la API

"""bash
docker compose up -d --build api
curl http://localhost:3000/api/health
"""

### 2. Correr el agente

Opcion A, dentro de Docker (releva el contenedor):

"""bash
docker compose run --rm agent
"""

Opcion B, directo en tu maquina, Windows o Linux (releva tu equipo real):

"""bash
cd agent
npm install
node src/index.js
"""

En PowerShell, para apuntar a otra IP de la red local:

"""powershell
$env:apiUrl = "http://192.168.0.10:3000"
node src/index.js
"""

Variables del agente: "apiUrl" (por defecto "http://localhost:3000"), "apiToken" e "intervalSeconds" (para repetir el envio).

### 3. Consultar la informacion

"""bash
curl "http://localhost:3000/api/info?ip=<IP que mostro el agente>"
"""

### 4. Ver los archivos guardados

"""bash
docker compose exec api ls /app/data
"""

### Apagar todo

"""bash
docker compose down
"""

Para borrar tambien los datos guardados: "docker compose down -v".
