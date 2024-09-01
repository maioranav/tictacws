// src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.scss";
interface Props {}

const App: React.FC<Props> = () => {
   const [socket, setSocket] = useState<WebSocket | null>(null);
   const [sessionId, setSessionId] = useState<string>("");
   const [board, setBoard] = useState<string[]>(Array(9).fill(""));
   const [eventMessage, setEventMessage] = useState<string>("");

   useEffect(() => {
      // Inizializza il WebSocket
      const protocol = window.location.protocol === "https:" ? "wss" : "ws"; // Usa "wss" per HTTPS e "ws" per HTTP
      const host = window.location.host; // Ottieni l'host corrente (es. localhost:3000 o il dominio)
      const wsUrl = `${protocol}://${host}`; // Costruisci l'URL completo del WebSocket

      const ws = new WebSocket(wsUrl);
      setSocket(ws);

      ws.onopen = () => {
         console.log("Connesso al server WebSocket");
         setEventMessage("Connesso al server. Avvia una partita o partecipa!");
      };

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         handleSocketMessage(data);
      };

      ws.onclose = () => {
         setEventMessage("Connessione persa. Ricarica la pagina!");
         console.log("Connessione WebSocket chiusa");
      };

      return () => {
         ws.close();
      };
   }, []);

   const handleSocketMessage = async (data: any) => {
      switch (data.type) {
         case "session_created":
            setSessionId(data.sessionId);
            setEventMessage("Sessione avviata, unisciti alla sessione!");
            break;
         case "start_game":
            setEventMessage("Partita in corso!!");
            console.log("La partita inizia!");
            break;
         case "session_join":
            setEventMessage("Sei dentro! Invita un amico");
            console.log("La partita inizia!");
            break;
         case "session_full":
            setEventMessage("La partita è piena, non puoi partecipare");
            break;
         case "move":
            setBoard(data.board);
            break;
         default:
            console.error("Tipo di messaggio sconosciuto");
            break;
      }
   };

   const createSession = () => {
      if (socket) {
         socket.send(JSON.stringify({ type: "create" }));
      }
   };

   const joinSession = (sessionId: string) => {
      if (socket) {
         socket.send(JSON.stringify({ type: "join", sessionId }));
      }
   };

   const makeMove = (index: number) => {
      if (socket && sessionId) {
         socket.send(JSON.stringify({ type: "move", sessionId, position: index }));
      }
   };

   const handleSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSessionId(e.target.value);
   };

   return (
      <div className="container mt-5">
         <h1>Tic Tac Toe</h1>
         <h3 className="status-pill">{eventMessage}</h3>
         <label htmlFor="sessionId">ID Sessione:</label>
         <input
            type="text"
            name="sessionId"
            className="mb-3"
            onChange={handleSessionId}
            value={sessionId}
         />
         {!sessionId ? (
            <div>
               <button className="btn btn-primary" onClick={createSession}>
                  Crea una partita
               </button>
            </div>
         ) : (
            <div>
               <button className="btn btn-secondary" onClick={() => joinSession(sessionId)}>
                  Unisciti alla sessione
               </button>
            </div>
         )}
         <div className="board mt-4">
            {board.map((cell, index) => (
               <button
                  key={index}
                  className="btn btn-outline-dark m-1"
                  style={{ width: "60px", height: "60px" }}
                  onClick={() => makeMove(index)}
               >
                  {cell}
               </button>
            ))}
         </div>
      </div>
   );
};

export default App;
