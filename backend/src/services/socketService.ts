import { Server } from 'socket.io';
import { hmsVideoService, UserRole } from './hmsVideoService';
import { User } from '../models/User';
import { LiveSession } from '../models/LiveSession';

export let io: Server;

export const setupSocketIO = (ioInstance: Server): void => {
  io = ioInstance;
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their personal room
    socket.on('user:join', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // User leaves their personal room
    socket.on('user:leave', (userId: string) => {
      socket.leave(`user:${userId}`);
      console.log(`User ${userId} left their room`);
    });

    // Proctoring events - will be implemented in AI Proctoring System task
    socket.on('proctoring:start', (sessionId: string) => {
      socket.join(`proctoring:${sessionId}`);
      console.log(`Proctoring session ${sessionId} started`);
    });

    socket.on('proctoring:end', (sessionId: string) => {
      socket.leave(`proctoring:${sessionId}`);
      console.log(`Proctoring session ${sessionId} ended`);
    });

    // Enhanced video room connection with credential validation
    socket.on('video:room:join', async (data: {
      sessionId: string;
      userId: string;
      userName: string;
      role: UserRole;
    }) => {
      try {
        const { sessionId, userId, userName, role } = data;
        
        console.log(`🎥 User ${userName} (${userId}) attempting to join video room for session ${sessionId} with role ${role}`);
        
        // Validate user exists and has proper permissions
        const user = await User.findById(userId);
        if (!user) {
          socket.emit('video:room:error', {
            error: 'User not found',
            sessionId
          });
          return;
        }
        
        // Validate session exists
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit('video:room:error', {
            error: 'Session not found',
            sessionId
          });
          return;
        }
        
        // Generate HMS token with environment credentials and ensure room is active
        console.log(`🔑 Generating token for room: ${sessionId}`);
        const tokenResponse = await hmsVideoService.generateToken({
          role,
          userName,
          userId,
          roomId: sessionId, // Use sessionId as roomId for consistency
          isRecorder: false
        });
        
        console.log(`✅ Token generated successfully for room: ${tokenResponse.roomId}`);
        
        // Join socket room for session
        socket.join(`session:${sessionId}`);
        socket.join(`video:${sessionId}`);
        
        // Emit success with token and room details
        socket.emit('video:room:joined', {
          success: true,
          sessionId,
          token: tokenResponse.token,
          roomId: tokenResponse.roomId,
          userId: tokenResponse.userId,
          role: tokenResponse.role,
          userName
        });
        
        // Notify other users in the session
        socket.to(`session:${sessionId}`).emit('user:joined', {
          userId,
          userName,
          role,
          timestamp: new Date()
        });
        
        console.log(`✅ User ${userName} successfully joined video room ${tokenResponse.roomId}`);
        
      } catch (error) {
        console.error(`❌ Error joining video room:`, error);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to join video room';
        let errorDetails = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorDetails.includes('HMS credentials validation failed')) {
          errorMessage = 'Video service configuration error';
          errorDetails = 'HMS credentials are not properly configured. Please check environment variables.';
        } else if (errorDetails.includes('Failed to ensure room is active')) {
          errorMessage = 'Room activation failed';
          errorDetails = 'Unable to create or activate the video room. Please try again.';
        } else if (errorDetails.includes('User not found')) {
          errorMessage = 'Authentication error';
          errorDetails = 'User authentication failed. Please log in again.';
        } else if (errorDetails.includes('Session not found')) {
          errorMessage = 'Session error';
          errorDetails = 'The requested session could not be found.';
        }
        
        socket.emit('video:room:error', {
          error: errorMessage,
          details: errorDetails,
          sessionId: data.sessionId,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Legacy session join for backward compatibility
    socket.on('session:join', (sessionId: string, userId: string) => {
      socket.join(`session:${sessionId}`);
      socket.to(`session:${sessionId}`).emit('user:joined', userId);
      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Enhanced video room leave with cleanup
    socket.on('video:room:leave', (data: {
      sessionId: string;
      userId: string;
      userName: string;
    }) => {
      try {
        const { sessionId, userId, userName } = data;
        
        console.log(`🚪 User ${userName} (${userId}) leaving video room for session ${sessionId}`);
        
        // Leave socket rooms
        socket.leave(`session:${sessionId}`);
        socket.leave(`video:${sessionId}`);
        
        // Notify other users
        socket.to(`session:${sessionId}`).emit('user:left', {
          userId,
          userName,
          timestamp: new Date()
        });
        
        socket.emit('video:room:left', {
          success: true,
          sessionId,
          userId
        });
        
        console.log(`✅ User ${userName} successfully left video room`);
        
      } catch (error) {
        console.error(`❌ Error leaving video room:`, error);
        socket.emit('video:room:error', {
          error: 'Failed to leave video room',
          details: error instanceof Error ? error.message : 'Unknown error',
          sessionId: data.sessionId
        });
      }
    });
    
    // Legacy session leave for backward compatibility
    socket.on('session:leave', (sessionId: string, userId: string) => {
      socket.leave(`session:${sessionId}`);
      socket.to(`session:${sessionId}`).emit('user:left', userId);
      console.log(`User ${userId} left session ${sessionId}`);
    });

    socket.on('session:hand-raise', (sessionId: string, userId: string) => {
      socket.to(`session:${sessionId}`).emit('hand:raised', userId);
      console.log(`User ${userId} raised hand in session ${sessionId}`);
    });

    socket.on('session:emoji', (sessionId: string, userId: string, emoji: string) => {
      socket.to(`session:${sessionId}`).emit('emoji:sent', { userId, emoji });
      console.log(`User ${userId} sent emoji ${emoji} in session ${sessionId}`);
    });

    // Chat events
    socket.on('session:chat', (data: {
      sessionId: string;
      userId: string;
      userName: string;
      message: string;
      isTeacher: boolean;
      type: 'message' | 'system' | 'question' | 'poll';
    }) => {
      const chatMessage = {
        id: Date.now().toString(),
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        timestamp: new Date(),
        isTeacher: data.isTeacher,
        type: data.type
      };

      // Broadcast to all users in the session
      io.to(`session:${data.sessionId}`).emit('chat:message', chatMessage);
      console.log(`Chat message from ${data.userName} in session ${data.sessionId}: ${data.message}`);
    });

    // Video stream events
    socket.on('session:video-start', (sessionId: string, userId: string, userName: string) => {
      socket.to(`session:${sessionId}`).emit('video:started', { userId, userName });
      console.log(`User ${userName} started video in session ${sessionId}`);

      // Also emit a direct command to students to show teacher video
      socket.to(`session:${sessionId}`).emit('teacher:video-available', {
        teacherId: userId,
        teacherName: userName,
        message: 'Teacher video is now available'
      });
    });

    socket.on('session:video-stop', (sessionId: string, userId: string, userName: string) => {
      socket.to(`session:${sessionId}`).emit('video:stopped', { userId, userName });
      console.log(`User ${userName} stopped video in session ${sessionId}`);
    });

    // Video frame streaming
    socket.on('video:frame', (data: { sessionId: string; teacherId: string; frameData: string; timestamp: number }) => {
      // Broadcast video frame to all students in the session
      socket.to(`session:${data.sessionId}`).emit('video:frame', {
        teacherId: data.teacherId,
        frameData: data.frameData,
        timestamp: data.timestamp
      });
    });

    // Audio chunk streaming
    socket.on('audio:chunk', (data: { sessionId: string; teacherId: string; audioData: string; timestamp: number }) => {
      // Broadcast audio chunk to all students in the session
      socket.to(`session:${data.sessionId}`).emit('audio:chunk', {
        teacherId: data.teacherId,
        audioData: data.audioData,
        timestamp: data.timestamp
      });
    });

    // Audio events
    socket.on('session:audio-toggle', (sessionId: string, userId: string, userName: string, isAudioOn: boolean) => {
      socket.to(`session:${sessionId}`).emit('audio:toggled', { userId, userName, isAudioOn });
      console.log(`User ${userName} ${isAudioOn ? 'unmuted' : 'muted'} in session ${sessionId}`);
    });

    // Hand raise events
    socket.on('session:hand-toggle', (sessionId: string, userId: string, userName: string, hasRaisedHand: boolean) => {
      socket.to(`session:${sessionId}`).emit('hand:toggled', { userId, userName, hasRaisedHand });
      console.log(`User ${userName} ${hasRaisedHand ? 'raised' : 'lowered'} hand in session ${sessionId}`);
    });

    // Permission events (teacher only)
    socket.on('session:grant-permission', (sessionId: string, teacherId: string, studentId: string, permission: 'speak' | 'video') => {
      socket.to(`user:${studentId}`).emit('permission:granted', { sessionId, permission });
      console.log(`Teacher ${teacherId} granted ${permission} permission to student ${studentId} in session ${sessionId}`);
    });

    socket.on('session:revoke-permission', (sessionId: string, teacherId: string, studentId: string, permission: 'speak' | 'video') => {
      socket.to(`user:${studentId}`).emit('permission:revoked', { sessionId, permission });
      console.log(`Teacher ${teacherId} revoked ${permission} permission from student ${studentId} in session ${sessionId}`);
    });

    // Session status updates
    socket.on('session:status-update', (sessionId: string, status: string, teacherId: string) => {
      socket.to(`session:${sessionId}`).emit('session:status-changed', { status });
      console.log(`Session ${sessionId} status changed to ${status} by teacher ${teacherId}`);
    });

    // WebRTC signaling for video streaming
    socket.on('video:offer', (data: { sessionId: string; targetUserId: string; offer: any }) => {
      socket.to(`user:${data.targetUserId}`).emit('video:offer', {
        fromUserId: socket.id,
        offer: data.offer
      });
      console.log(`Video offer sent from ${socket.id} to ${data.targetUserId}`);
    });

    socket.on('video:answer', (data: { sessionId: string; targetUserId: string; answer: any }) => {
      socket.to(`user:${data.targetUserId}`).emit('video:answer', {
        fromUserId: socket.id,
        answer: data.answer
      });
      console.log(`Video answer sent from ${socket.id} to ${data.targetUserId}`);
    });

    socket.on('video:ice-candidate', (data: { sessionId: string; targetUserId: string; candidate: any }) => {
      socket.to(`user:${data.targetUserId}`).emit('video:ice-candidate', {
        fromUserId: socket.id,
        candidate: data.candidate
      });
      console.log(`ICE candidate sent from ${socket.id} to ${data.targetUserId}`);
    });

    // Chat System Events
    socket.on('chat:join', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined chat system`);
      
      // Update user online status
      User.findByIdAndUpdate(userId, { 
        isOnline: true, 
        lastSeen: new Date() 
      }).catch(err => console.error('Error updating user online status:', err));
      
      // Notify other users that this user is online
      socket.broadcast.emit('user:online', userId);
    });

    socket.on('chat:leave', (userId: string) => {
      socket.leave(`user_${userId}`);
      console.log(`User ${userId} left chat system`);
      
      // Update user offline status
      User.findByIdAndUpdate(userId, { 
        isOnline: false, 
        lastSeen: new Date() 
      }).catch(err => console.error('Error updating user offline status:', err));
      
      // Notify other users that this user is offline
      socket.broadcast.emit('user:offline', userId);
    });

    socket.on('chat:join-room', (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`User joined chat room: ${chatId}`);
    });

    socket.on('chat:leave-room', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User left chat room: ${chatId}`);
    });

    socket.on('chat:typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      socket.to(`chat_${data.chatId}`).emit('user:typing', {
        chatId: data.chatId,
        userId: data.userId,
        isTyping: data.isTyping
      });
    });

    // Real-time message events
    socket.on('message:send', (data: {
      chatId: string;
      senderId: string;
      senderName: string;
      content: string;
      messageType: 'text' | 'image' | 'file';
      recipientId?: string;
    }) => {
      try {
        // Create message object
        const message = {
          _id: Date.now().toString(), // Temporary ID, should be replaced with actual DB ID
          chatId: data.chatId,
          sender: data.senderId,
          senderName: data.senderName,
          content: data.content,
          messageType: data.messageType,
          timestamp: new Date(),
          isRead: false
        };

        // Emit to chat room
        io.to(`chat_${data.chatId}`).emit('message:new', message);

        // If direct message, also emit to recipient's personal room
        if (data.recipientId) {
          io.to(`user_${data.recipientId}`).emit('message:new', message);
          
          // Send notification to recipient (handled by message service)
          console.log(`📨 Real-time message sent from ${data.senderName} to chat ${data.chatId}`);
        }

        console.log(`💬 Message broadcast to chat room: ${data.chatId}`);
      } catch (error) {
        console.error('Error handling real-time message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Message read receipt
    socket.on('message:read', (data: { messageId: string; chatId: string; userId: string }) => {
      socket.to(`chat_${data.chatId}`).emit('message:read-receipt', {
        messageId: data.messageId,
        readBy: data.userId,
        timestamp: new Date()
      });
      console.log(`✅ Message ${data.messageId} marked as read by ${data.userId}`);
    });

    // Notification events
    socket.on('notification:join', (userId: string) => {
      socket.join(`notifications_${userId}`);
      console.log(`🔔 User ${userId} joined notification channel`);
    });

    socket.on('notification:leave', (userId: string) => {
      socket.leave(`notifications_${userId}`);
      console.log(`🔔 User ${userId} left notification channel`);
    });

    // Connection status events
    socket.on('user:status', (data: { userId: string; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      // Broadcast status to all connected users
      socket.broadcast.emit('user:status-update', {
        userId: data.userId,
        status: data.status,
        timestamp: new Date()
      });
      console.log(`👤 User ${data.userId} status changed to ${data.status}`);
    });

    // Connection request events
    socket.on('connection:request', (data: { fromUserId: string; toUserId: string; fromUserName: string }) => {
      // Emit to target user
      io.to(`user_${data.toUserId}`).emit('connection:request-received', {
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        timestamp: new Date()
      });
      console.log(`🤝 Connection request from ${data.fromUserName} to user ${data.toUserId}`);
    });

    socket.on('connection:accept', (data: { fromUserId: string; toUserId: string; accepterName: string }) => {
      // Emit to both users
      io.to(`user_${data.fromUserId}`).emit('connection:accepted', {
        acceptedBy: data.toUserId,
        accepterName: data.accepterName,
        timestamp: new Date()
      });
      
      io.to(`user_${data.toUserId}`).emit('connection:accepted', {
        acceptedBy: data.toUserId,
        accepterName: data.accepterName,
        timestamp: new Date()
      });
      
      console.log(`✅ Connection accepted between ${data.fromUserId} and ${data.toUserId}`);
    });

    // Heartbeat to keep connection alive
    socket.on('heartbeat', (userId: string) => {
      socket.emit('heartbeat-ack', { 
        userId, 
        timestamp: Date.now(),
        socketId: socket.id 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
      
      // You can handle cleanup here if needed
      // For example, update user's last seen timestamp
    });
  });
};
