import { v4 as uuidv4 } from "uuid";
import * as WebSocket from "ws";
import * as http from "http";
import express from "express";
import path from "path";

// Creare l'app Express
const app = express();
const port = 3000;

// Servire i file statici dell'app React
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

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

// Funzione per pulire le sessioni morte o complete
const cleanupSessions = () => {
   for (const sessionId in sessions) {
      const session = sessions[sessionId];

      // Verifica se tutti i giocatori della sessione sono disconnessi
      const allPlayersDisconnected = session.players.every(
         (player) => player.readyState === WebSocket.CLOSED
      );

      // Rimuovi sessioni "morte" (tutti i giocatori disconnessi)
      if (allPlayersDisconnected) {
         console.log(`Rimozione sessione ${sessionId}: tutti i giocatori disconnessi.`);
         delete sessions[sessionId];
         continue;
      }

      // Verifica se la sessione è "completa" (partita terminata)
      const isBoardFull = session.board.every((cell) => cell !== null);
      if (isBoardFull) {
         console.log(`Rimozione sessione ${sessionId}: partita completa.`);
         delete sessions[sessionId];
      }
   }
};

// Esegui cleanup ogni 60 secondi
setInterval(cleanupSessions, 60000);

// Gestione delle connessioni WebSocket
wss.on("connection", (ws: WebSocket) => {
   console.log("Nuova connessione WebSocket.");

   ws.on("message", (message: string) => {
      try {
         const data = JSON.parse(message);
         const { type, sessionId, position } = data;

         switch (type) {
            case "create":
               const newSessionId = createSession();
               ws.send(JSON.stringify({ type: "session_created", sessionId: newSessionId }));
               break;

            case "join":
               if (sessionId && sessions[sessionId]) {
                  sessions[sessionId].players.push(ws);
                  if (sessions[sessionId].players.length === 2) {
                     sessions[sessionId].players.forEach((player) =>
                        player.send(
                           JSON.stringify({ type: "start_game", message: "La partita inizia!" })
                        )
                     );
                  } else if (sessions[sessionId].players.length < 2) {
                     ws.send(
                        JSON.stringify({
                           type: "session_join",
                           message: "Manca un giocatore per iniziare"
                        })
                     );
                  } else {
                     ws.send(
                        JSON.stringify({
                           type: "session_full",
                           message: "La partita è gia piena!"
                        })
                     );
                  }
               } else {
                  ws.send(JSON.stringify({ type: "error", message: "Sessione non trovata." }));
               }
               break;

            case "move":
               if (sessionId && sessions[sessionId] && position != null) {
                  const session = sessions[sessionId];
                  session.board[position] = session.players[0] == ws ? "X" : "O";
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
   });
});

// Endpoint per gestire tutte le richieste e servire l'app React
app.get("*", (req, res) => {
   res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

// Avviare il server
server.listen(port, () => {
   console.log(`Server attivo su http://localhost:${port}`);
});
