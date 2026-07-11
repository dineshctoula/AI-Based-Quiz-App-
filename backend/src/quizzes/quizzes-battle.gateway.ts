import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { QuizzesService } from './quizzes.service';
import { UsersService } from '../users/users.service';
import { Logger } from '@nestjs/common';

/**
 * Interface representing a player in a multiplayer lobby.
 * 
 * multiplayer lobby मा जोडिएको player को विवरण।
 */
interface Player {
  socketId: string;
  userId: number;
  username: string;
  isHost: boolean;
  currentQuestionIndex?: number; // 0-indexed current question index | हालको प्रश्नको index
  scoreSoFar?: number;           // cumulative score earned | हालसम्मको score
  finished?: boolean;            // whether quiz completed | खेल पुरा भएको छ वा छैन
  finalScore?: number;           // final score after submitting | अन्तिम score
}

/**
 * Interface representing a chat message inside the lobby.
 * 
 * lobby भित्रको chat message को ढाँचा।
 */
interface Message {
  sender: string;
  text: string;
  timestamp: Date;
}

/**
 * Interface representing a multiplayer room state stored in memory.
 * 
 * in-memory room state, जसमा room code, quiz details, players र messages हुन्छन्।
 */
interface Room {
  code: string;
  quizId: number;
  quizTitle: string;
  hostId: number;
  players: Player[];
  messages: Message[];
  battleStarted: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for dev development
  },
})
export class QuizzesBattleGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(QuizzesBattleGateway.name);

  @WebSocketServer()
  server: Server;

  // In-memory room manager mapping roomCode -> Room
  // room control को लागि in-memory key-value map
  private rooms = new Map<string, Room>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly quizzesService: QuizzesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Called automatically when the gateway is initialized.
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized successfully | WebSocket Gateway सुरु भयो');
  }

  /**
   * Handle incoming socket connection and verify JWT token.
   * 
   * नयाँ socket connection आउँदा JWT verification गर्ने र user details bind गर्ने।
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake auth or query string
      // handshake वा query parameters बाट token तान्ने
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`No token provided by socket ${client.id}. Disconnecting.`);
        client.disconnect();
        return;
      }

      // Verify signature of the JWT token
      // token verification गर्ने
      const secret =
        process.env.JWT_SECRET || 'dev_local_secret_jwt_signkey_for_quiz_app';
      const payload = this.jwtService.verify(token, { secret });

      // Retrieve user from database to attach to socket data
      // user details तानी socket logic मा associate गर्ने
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`User matching token not found in database. Disconnecting socket ${client.id}`);
        client.disconnect();
        return;
      }

      // Store authenticated user info inside client.data
      // validation सफल भएमा user object लाई socket data मा store गर्ने
      client.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      this.logger.log(`Socket client connected: ${client.id} associated with User: ${user.name}`);
    } catch (err) {
      this.logger.error(`Authentication failed for socket ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle socket client disconnect and perform room cleanups.
   * 
   * connection टुट्दा user लाई active rooms बाट हटाउने र clean up गर्ने।
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
    this.handleClientLeave(client);
  }

  /**
   * Socket event to create a new multiplayer quiz lobby.
   * 
   * नयाँ room create गर्ने event.
   */
  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { quizId: number },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', 'Authentication required | Authentication आवश्यक छ');
      return;
    }

    try {
      // Fetch quiz to ensure it exists and get its title
      // database बाट quiz details तान्ने
      const quiz = await this.quizzesService.findOne(data.quizId);
      
      // Generate a random 5-character alphanumeric room code
      // ५-अक्षरको unique room code generate गर्ने
      let code = '';
      do {
        code = Math.random().toString(36).substring(2, 7).toUpperCase();
      } while (this.rooms.has(code));

      // Construct room details
      // room object तयार पार्ने
      const newRoom: Room = {
        code,
        quizId: quiz.id,
        quizTitle: quiz.title,
        hostId: user.id,
        players: [
          {
            socketId: client.id,
            userId: user.id,
            username: user.name,
            isHost: true,
            currentQuestionIndex: 0,
            scoreSoFar: 0,
            finished: false,
            finalScore: 0,
          },
        ],
        messages: [],
        battleStarted: false,
      };

      // Store room in memory and join the socket to Socket.io room channel
      // room store गर्ने र client लाई room channel मा join गराउने
      this.rooms.set(code, newRoom);
      client.join(`room_${code}`);

      this.logger.log(`Room ${code} created by host ${user.name} for quiz ${quiz.title}`);

      // Emit success details to host
      // host लाई room_created event पठाउने
      client.emit('room_created', newRoom);
    } catch (err) {
      this.logger.error(`Failed to create room: ${err.message}`);
      client.emit('error', 'Failed to retrieve quiz metadata | Quiz data तान्न सकिएन');
    }
  }

  /**
   * Socket event to join an existing multiplayer quiz lobby.
   * 
   * client लाई existing room मा join गराउने event.
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', 'Authentication required | Authentication आवश्यक छ');
      return;
    }

    const code = data.roomCode?.toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      client.emit('error', 'Lobby not found. Please verify code. | यो room भेटिएन। कोड जाँच्नुहोस्।');
      return;
    }

    if (room.battleStarted) {
      client.emit('error', 'Battle already started in this room. | यो room मा खेल सुरु भइसकेको छ।');
      return;
    }

    // Check if player is already inside the room
    // user पहिले नै join भइसकेको छ कि छैन जाँच्ने
    const isPlayerInRoom = room.players.some((p) => p.userId === user.id);
    if (!isPlayerInRoom) {
      room.players.push({
        socketId: client.id,
        userId: user.id,
        username: user.name,
        isHost: false,
        currentQuestionIndex: 0,
        scoreSoFar: 0,
        finished: false,
        finalScore: 0,
      });
    } else {
      // Update socket ID if user reconnected or joined from another window
      // socket reconnect भएमा ID update गर्ने
      const playerIndex = room.players.findIndex((p) => p.userId === user.id);
      room.players[playerIndex].socketId = client.id;
    }

    client.join(`room_${code}`);
    this.logger.log(`Player ${user.name} joined room ${code}`);

    // Notify room participants about the new join
    // room भित्रका सबैलाई notification पठाउने
    this.server.to(`room_${code}`).emit('room_update', room);
    
    // Send join confirmation to the client
    // client लाई join success event पठाउने
    client.emit('join_success', room);
  }

  /**
   * Socket event to broadcast a chat message inside the lobby.
   * 
   * chat message room भित्रका सबैलाई broadcast गर्ने event.
   */
  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; text: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const code = data.roomCode?.toUpperCase();
    const room = this.rooms.get(code);

    if (!room) return;

    const newMessage: Message = {
      sender: user.name,
      text: data.text,
      timestamp: new Date(),
    };

    room.messages.push(newMessage);

    // Broadcast message to everyone in the room
    // room मा message पठाउने
    this.server.to(`room_${code}`).emit('new_message', newMessage);
  }

  /**
   * Socket event to manually leave the room lobby.
   * 
   * lobby बाट manual exit handle गर्ने event.
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    this.handleClientLeave(client, data.roomCode);
  }

  /**
   * Triggered by host to launch the multiplayer quiz session.
   * 
   * Host ले multiplayer start गर्दा play commands broadcast गर्ने।
   */
  @SubscribeMessage('start_battle')
  handleStartBattle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const code = data.roomCode?.toUpperCase();
    const room = this.rooms.get(code);

    if (!room) return;

    // Verify host permission
    // केबल host ले मात्र game start गर्न पाउने
    if (room.hostId !== user.id) {
      client.emit('error', 'Only host can start the battle | Host ले मात्र खेल सुरु गर्न सक्छ');
      return;
    }

    room.battleStarted = true;
    
    // Notify all players that the battle is starting
    // battle load गर्ने command पठाउने
    this.server.to(`room_${code}`).emit('battle_started', {
      quizId: room.quizId,
    });

    this.logger.log(`Battle started for room ${code} on quiz ID ${room.quizId}`);
  }

  /**
   * Socket event to update the player's progress during the quiz.
   * 
   * खेल अवधिमा player को progress (कुन प्रश्नमा छ र कति score छ) update गर्ने event।
   */
  @SubscribeMessage('update_progress')
  handleUpdateProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; currentQuestionIndex: number; scoreSoFar: number },
  ) {
    const user = client.data.user;
    if (!user) return;

    const code = data.roomCode?.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.userId === user.id);
    if (player) {
      player.currentQuestionIndex = data.currentQuestionIndex;
      player.scoreSoFar = data.scoreSoFar;
      
      this.logger.log(`Room ${code}: Player ${user.name} progressed to Q${data.currentQuestionIndex + 1} with score ${data.scoreSoFar}`);
      
      // Broadcast updated room state to all players
      // update भएको room status सबै participants लाई पठाउने
      this.server.to(`room_${code}`).emit('room_update', room);
    }
  }

  /**
   * Socket event to submit the final score when a player completes the quiz.
   * 
   * player ले quiz सकेपछि score submit गर्ने र status finished बनाउने event।
   */
  @SubscribeMessage('player_finished')
  handlePlayerFinished(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; finalScore: number },
  ) {
    const user = client.data.user;
    if (!user) return;

    const code = data.roomCode?.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.userId === user.id);
    if (player) {
      player.finished = true;
      player.finalScore = data.finalScore;
      
      this.logger.log(`Room ${code}: Player ${user.name} finished the quiz with final score ${data.finalScore}`);
      
      // Add system message about completion
      // system message chat मा थप्ने
      room.messages.push({
        sender: 'SYSTEM',
        text: `${user.name} has completed the quiz! Score: ${data.finalScore} | ${user.name} ले क्विज पूरा गर्यो! प्राप्त स्कोर: ${data.finalScore}`,
        timestamp: new Date(),
      });

      // Broadcast updated room state and the new message
      // update भएको room details र notification message अरू player लाई पठाउने
      this.server.to(`room_${code}`).emit('room_update', room);
      this.server.to(`room_${code}`).emit('new_message', room.messages[room.messages.length - 1]);
    }
  }

  /**
   * Private helper to remove a socket client from active rooms.
   * 
   * disconnected वा manually quit भएको client लाई room बाट सफा गर्ने helper.
   */
  private handleClientLeave(client: Socket, explicitRoomCode?: string) {
    const user = client.data.user;
    if (!user) return;

    // Search rooms to find which ones the client is currently in
    this.rooms.forEach((room, code) => {
      // If explicit room code is passed, skip other rooms
      if (explicitRoomCode && code !== explicitRoomCode.toUpperCase()) {
        return;
      }

      const playerIndex = room.players.findIndex((p) => p.socketId === client.id);
      
      if (playerIndex !== -1) {
        const playerWhoLeft = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        client.leave(`room_${code}`);

        this.logger.log(`User ${user.name} removed from room ${code}`);

        // If no players are left, delete the room
        // यदि कोही पनि बाँकी छैन भने room delete गर्ने
        if (room.players.length === 0) {
          this.rooms.delete(code);
          this.logger.log(`Room ${code} is empty. Deleted.`);
        } else {
          // If the host left, delegate host powers to the next player
          // यदि host ले छाड्यो भने अर्को player लाई host बनाउने
          if (playerWhoLeft.isHost) {
            const nextHost = room.players[0];
            nextHost.isHost = true;
            room.hostId = nextHost.userId;
            
            // Add system warning message
            room.messages.push({
              sender: 'SYSTEM',
              text: `Host left. ${nextHost.username} is now the host.`,
              timestamp: new Date(),
            });

            this.logger.log(`Host left Room ${code}. New Host is ${nextHost.username}`);
          }

          // Broadcast updated player list and states
          // update भएको roster अरू player लाई पठाउने
          this.server.to(`room_${code}`).emit('room_update', room);
        }
      }
    });
  }
}
