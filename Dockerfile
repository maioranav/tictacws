# Utilizzare una versione ufficiale di Node.js come base
FROM node:18

# Impostare la directory di lavoro per il frontend
WORKDIR /app/frontend

# Copiare i file del frontend nel container
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./

# Creare la build del frontend
RUN npm run build

# Impostare la directory di lavoro per il backend (root)
WORKDIR /app

# Copiare i file del backend nel container
COPY package*.json ./
RUN npm install
COPY . .

# Esporre la porta utilizzata dall'app
EXPOSE 3000

# Avviare l'applicazione
CMD ["npm", "start"]
