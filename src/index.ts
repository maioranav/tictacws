import { v4 as uuidv4 } from "uuid";
import * as WebSocket from "ws";
import * as http from "http";
import express from "express";

// Creare l'app Express
const app = express();
const port = 3000;

// Creare un server HTTP
const server = http.createServer(app);

// Creare un server WebSocket
const wss = new WebSocket.Server({ server });

// Mappatura delle sessioni
const sessions: { [key: string]: { players: WebSocket[]; board: string[] } } = {};

// Funzione per creare una nuova sessione
const createSession = (): string => {
   const sessionId = uuidv4(); // Genera un ID di sessione unico
   sessions[sessionId] = { players: [], board: Array(9).fill(null) }; // Inizializza la sessione
   return sessionId;
};

// Gestione delle connessioni WebSocket
wss.on("connection", (ws: WebSocket) => {
   console.log("Nuova connessione WebSocket.");

   ws.on("message", (message: string) => {
      try {
         const data = JSON.parse(message);
         const { type, sessionId, position } = data;

         switch (type) {
            case "create":
               // Creare una nuova sessione di gioco
               const newSessionId = createSession();
               ws.send(JSON.stringify({ type: "session_created", sessionId: newSessionId }));
               break;

            case "join":
               // Aggiungi un giocatore a una sessione esistente
               if (sessionId && sessions[sessionId]) {
                  sessions[sessionId].players.push(ws);
                  if (sessions[sessionId].players.length === 2) {
                     sessions[sessionId].players.forEach((player) =>
                        player.send(
                           JSON.stringify({ type: "start_game", message: "La partita inizia!" })
                        )
                     );
                  }
               } else {
                  ws.send(JSON.stringify({ type: "error", message: "Sessione non trovata." }));
               }
               break;

            case "move":
               // Gestire una mossa di gioco
               if (sessionId && sessions[sessionId] && position != null) {
                  const session = sessions[sessionId];
                  session.board[position] = "X"; // Per semplicità, assegniamo sempre 'X'. In un'implementazione completa gestiremmo turni e convalida.
                  session.players.forEach((player) =>
                     player.send(JSON.stringify({ type: "move", position, board: session.board }))
                  );
               }
               break;

            default:
               ws.send(
                  JSON.stringify({ type: "error", message: "Tipo di messaggio sconosciuto." })
               );
               break;
         }
      } catch (error) {
         ws.send(JSON.stringify({ type: "error", message: "Formato del messaggio non valido." }));
      }
   });

   ws.on("close", () => {
      console.log("Connessione WebSocket chiusa.");
      // Gestire la logica di chiusura del giocatore/sessione, se necessario
   });
});

// Endpoint di test per verificare il server HTTP
app.get("/", (req, res) => {
   res.send("Server Tic Tac Toe attivo.");
});

// Avviare il server
server.listen(port, () => {
   console.log(`Server attivo su http://localhost:${port}`);
});
