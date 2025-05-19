import { WebSocketServer, WebSocket, RawData } from 'ws';
import { GameMessage } from './model/GameMessage';
import { RegResponse } from './model/payload/reg/RegResponse';
import MessageType from './model/MessageType';
import { EOL, userInfo } from 'node:os';
import { Handler } from './ws/Handler';
import { RegRequest } from './model/payload/reg/RegRequest';
import { AddUserToRoom } from './model/payload/room/AddUserToRoom';
import { Game } from './model/payload/game/Game';
import { BiMap } from './type/BiMap';
import { AddShips } from './model/payload/game/AddShips';
import { Attack } from './model/payload/attack/Attack';
import { Turn } from './model/payload/turn/Turn';
import { Finish } from './model/payload/finish/Finish';
import { AttackResult } from './model/payload/attack/AttackResult';
import AttackStatus from './model/payload/attack/AttackStatus';
import { RandomAttack } from './model/payload/attack/RandomAttack';

let wss: WebSocketServer = new WebSocketServer({ port: 3000 });

const clients: Array<WebSocket> = [];
const players: BiMap<WebSocket, string> = new BiMap()
const handler = new Handler()

// todo separate playerId from userId
wss.on('connection', (ws) => {
  console.log('new client connected!');
  clients.push(ws);

  ws.on('message', (message: RawData) => {
    // console.log(`message received: ${message}`);
    let personal: GameMessage[] = []
    let opponentMessage: [string, GameMessage] | undefined
    let both: [string, string, GameMessage] | undefined
    let broadcast: GameMessage[] = []

    try {
      const incomming: GameMessage = JSON.parse(message.toLocaleString());
      if (incomming.type == MessageType.REG) {
        const credentials = handler.payload<RegRequest>(incomming.data)
        const registration = handler.reg(credentials)
        if (!registration.error) {
          players.add(ws, <string>registration.index)
        }
        personal.push(GameMessage.make(MessageType.REG, registration))
        broadcast.push(GameMessage.make(MessageType.UPDATE_ROOM, handler.updateRoom()))
        const winners = handler.getWinners()
        broadcast.push(GameMessage.make(MessageType.UPDATE_WINNERS, winners))
      } else {
        let player = players.get(ws)
        if (player === undefined) {
          personal.push(GameMessage.make(MessageType.REG, new RegResponse(undefined, undefined, true, 'unauthorized')))
          console.log('unauthorized socket')
          ws.close()
        }
        let userId = player!

        switch (incomming.type) {
          case MessageType.CREATE_ROOM:
            const roomId = handler.createRoom(userId)
            broadcast.push(GameMessage.make(MessageType.UPDATE_ROOM, handler.updateRoom()))
            break;
          case MessageType.ADD_USER_TO_ROOM:
            const room = handler.payload<AddUserToRoom>(incomming.data)
            const result = handler.addUserToRoom(userId, room.indexRoom)
            broadcast.push(GameMessage.make(MessageType.UPDATE_ROOM, handler.updateRoom()))
            if (result.success) {
              const firstPlayer = handler.createGame(room.indexRoom)
              if (firstPlayer !== undefined) {
                personal.push(GameMessage.make(MessageType.CREATE_GAME, new Game(room.indexRoom, userId)))
                opponentMessage = [firstPlayer, GameMessage.make(MessageType.CREATE_GAME, new Game(room.indexRoom, firstPlayer))]
              }
            }
            break;
          case MessageType.SINGLE_PLAY: // bot
            const singleRoom = handler.singlePlayRoom(userId)            
            broadcast.push(GameMessage.make(MessageType.UPDATE_ROOM, handler.updateRoom()))
            personal.push(GameMessage.make(MessageType.CREATE_GAME, new Game(singleRoom, userId)))
          
            break;
          case MessageType.ADD_SHIPS:
            const addShips = handler.payload<AddShips>(incomming.data)
            if (handler.addShips(addShips)) {
              const game = handler.startGame(addShips.gameId, addShips.indexPlayer)
              
              if (game[0].currentPlayerIndex === userId) {
                personal.push(GameMessage.make(MessageType.START_GAME, game[0]))
                opponentMessage = [game[1].currentPlayerIndex, GameMessage.make(MessageType.START_GAME, game[1])]
              } else {
                personal.push(GameMessage.make(MessageType.START_GAME, game[1]))
                opponentMessage = [game[0].currentPlayerIndex, GameMessage.make(MessageType.START_GAME, game[0])]
              }
              broadcast.push(GameMessage.make(MessageType.UPDATE_ROOM, handler.updateRoom()))
              both = [game[0].currentPlayerIndex, game[1].currentPlayerIndex, GameMessage.make(MessageType.TURN, new Turn(game[0].currentPlayerIndex))]
            }
            break;
          case MessageType.ATTACK:
            const attackPayload = handler.payload<Attack>(incomming.data)
            // if not your turn
            console.log(attackPayload.indexPlayer)
            if (handler.getTurn(attackPayload.gameId) != attackPayload.indexPlayer) break;
            console.log('attack proceed', userId, attackPayload.indexPlayer)
            const attackResult = handler.attack(attackPayload)
            const attackNotifications = handler.attackNotification(attackPayload, attackResult)
            if (attackNotifications.personal) personal = attackNotifications.personal
            if (attackNotifications.opponentMessage) opponentMessage = attackNotifications.opponentMessage
            if (attackNotifications.both) both = attackNotifications.both
            if (attackNotifications.broadcast) broadcast = attackNotifications.broadcast
            break;
          case MessageType.RANDOMATTACK:
            const randomAttack = handler.payload<RandomAttack>(incomming.data)
            const randomAttackResult = handler.randomAttack(randomAttack)
            const rNotifications = handler.attackNotification(randomAttack, randomAttackResult)
            if (rNotifications.personal) personal = rNotifications.personal
            if (rNotifications.opponentMessage) opponentMessage = rNotifications.opponentMessage
            if (rNotifications.both) both = rNotifications.both
            if (rNotifications.broadcast) broadcast = rNotifications.broadcast
            break;
          default:
            console.log("unexpected message type")
            personal.push(GameMessage.make(MessageType.REG, { "message": "unexpected message type" }))
        }
      }
    } catch (e) {
      console.log(e)
      personal.push(GameMessage.make(MessageType.REG, new RegResponse(undefined, undefined, true, 'invalid message')))
    }

    for (const p of personal) {
      ws.send(JSON.stringify(p))
    }

    if (opponentMessage !== undefined) {
      sendToUser(opponentMessage[0], opponentMessage[1])
    }
    if (both !== undefined) {
      sendToUser(both[0], both[2])
      sendToUser(both[1], both[2])
    }
    for (const res of broadcast) {
      wss.clients.forEach(cl => cl.send(JSON.stringify(res)));
    }
  });

  ws.on('close', () => {
    console.log('client has gone!');
    clients.splice(clients.indexOf(ws), 1);
  });

  ws.on('pong', () => {
    console.log('pong called')
  });
});

function sendToUser(userId: string, message: GameMessage) {
  const userWs = players.getReversed(userId)
  if (userWs !== undefined) {
    userWs.send(JSON.stringify(message))
  }
}


process.on('SIGINT', function () {
  for (const client of clients) {
    client.close();
  }
  console.log(EOL + 'Buttleship Server stopped');
  process.exit();
});