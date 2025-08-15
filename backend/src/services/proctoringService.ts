import { Server as SocketIOServer, Socket } from 'socket.io';

interface ProctoringSession {
  studentId: string;
  studentName: string;
  studentEmail: string;
  assessmentId: string;
  assessmentTitle: string;
  joinedAt: Date;
  lastActivity: Date;
  violations: ProctoringViolation[];
  status: 'active' | 'flagged' | 'disconnected';
}

interface ProctoringViolation {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

interface AdminConnection {
  socketId: string;
  adminId: string;
  connectedAt: Date;
}

class ProctoringService {
  private io: SocketIOServer | null = null;
  private activeSessions: Map<string, ProctoringSession> = new Map();
  private adminConnections: Map<string, AdminConnection> = new Map();

  setSocketIO(socketInstance: SocketIOServer) {
    this.io = socketInstance;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log('Socket connected:', socket.id);

      // Handle joining proctoring session
      socket.on('join_proctoring_session', (data) => {
        this.handleJoinProctoringSession(socket, data);
      });

      // Handle video frames from students
      socket.on('video_frame', (data) => {
        this.handleVideoFrame(socket, data);
      });

      // Handle proctoring violations
      socket.on('proctoring_violation', (data) => {
        this.handleProctoringViolation(socket, data);
      });

      // Handle admin messages to students
      socket.on('admin_message', (data) => {
        this.handleAdminMessage(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  private handleJoinProctoringSession(socket: Socket, data: any) {
    const { role, studentId, assessmentId, studentName, studentEmail, assessmentTitle, adminId } = data;

    if (role === 'student') {
      // Student joining proctoring session
      const session: ProctoringSession = {
        studentId,
        studentName: studentName || 'Unknown Student',
        studentEmail: studentEmail || '',
        assessmentId,
        assessmentTitle: assessmentTitle || 'Unknown Assessment',
        joinedAt: new Date(),
        lastActivity: new Date(),
        violations: [],
        status: 'active'
      };

      this.activeSessions.set(studentId, session);
      socket.join(`student:${studentId}`);
      socket.join(`assessment:${assessmentId}`);

      console.log(`Student ${studentId} joined proctoring session for assessment ${assessmentId}`);

      // Notify all connected admins
      this.notifyAdmins('student_joined_proctoring', {
        studentId,
        studentName,
        studentEmail,
        assessmentId,
        assessmentTitle,
        joinedAt: session.joinedAt.toISOString()
      });

    } else if (role === 'admin') {
      // Admin joining proctoring monitoring
      const adminConnection: AdminConnection = {
        socketId: socket.id,
        adminId: adminId || 'unknown',
        connectedAt: new Date()
      };

      this.adminConnections.set(socket.id, adminConnection);
      socket.join('admin:proctoring');

      console.log(`Admin ${adminId} connected to proctoring monitoring`);

      // Send current active sessions to the newly connected admin
      const activeSessions = Array.from(this.activeSessions.values());
      socket.emit('active_sessions_update', activeSessions);
    }
  }

  private handleVideoFrame(socket: Socket, data: any) {
    const { studentId, assessmentId, frame, timestamp, metadata } = data;

    // Update session activity
    const session = this.activeSessions.get(studentId);
    if (session) {
      session.lastActivity = new Date();
      this.activeSessions.set(studentId, session);
    }

    // Forward video frame to all connected admins
    this.notifyAdmins('video_frame', {
      studentId,
      assessmentId,
      frame,
      timestamp,
      metadata
    });

    console.log(`Received video frame from student ${studentId}`);
  }

  private handleProctoringViolation(socket: Socket, data: any) {
    const { studentId, assessmentId, violation } = data;

    // Create violation record
    const violationRecord: ProctoringViolation = {
      id: Date.now().toString(),
      type: violation.type,
      description: violation.description,
      severity: violation.severity,
      timestamp: new Date(violation.timestamp)
    };

    // Update session with violation
    const session = this.activeSessions.get(studentId);
    if (session) {
      session.violations.push(violationRecord);
      session.lastActivity = new Date();
      
      // Update status if high severity violation
      if (violation.severity === 'high') {
        session.status = 'flagged';
      }
      
      this.activeSessions.set(studentId, session);
    }

    // Notify all connected admins
    this.notifyAdmins('proctoring_violation', {
      studentId,
      assessmentId,
      violation: violationRecord,
      sessionStatus: session?.status
    });

    console.log(`Proctoring violation from student ${studentId}: ${violation.description}`);
  }

  private handleAdminMessage(socket: Socket, data: any) {
    const { studentId, type, message } = data;

    // Send message to specific student
    this.io?.to(`student:${studentId}`).emit('admin_message', {
      type,
      message,
      timestamp: new Date().toISOString()
    });

    console.log(`Admin message sent to student ${studentId}: ${type} - ${message}`);

    // If it's an auto-submit, remove the student from active sessions
    if (type === 'auto_submit') {
      const session = this.activeSessions.get(studentId);
      if (session) {
        session.status = 'disconnected';
        this.activeSessions.set(studentId, session);
        
        // Notify other admins about the auto-submit
        this.notifyAdmins('student_auto_submitted', {
          studentId,
          reason: message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private handleDisconnection(socket: Socket) {
    console.log('Socket disconnected:', socket.id);

    // Check if it was an admin connection
    const adminConnection = this.adminConnections.get(socket.id);
    if (adminConnection) {
      this.adminConnections.delete(socket.id);
      console.log(`Admin ${adminConnection.adminId} disconnected from proctoring monitoring`);
      return;
    }

    // Check if it was a student connection
    for (const [studentId, session] of this.activeSessions.entries()) {
      // Note: We can't directly match socket to student without storing socket ID
      // In a production system, you'd want to store socket ID in the session
      // For now, we'll handle this through a timeout mechanism
    }
  }

  private notifyAdmins(event: string, data: any) {
    if (!this.io) return;
    
    this.io.to('admin:proctoring').emit(event, data);
  }

  // Public methods for external use
  public getActiveSessions(): ProctoringSession[] {
    return Array.from(this.activeSessions.values());
  }

  public getSessionByStudentId(studentId: string): ProctoringSession | undefined {
    return this.activeSessions.get(studentId);
  }

  public removeSession(studentId: string): boolean {
    return this.activeSessions.delete(studentId);
  }

  public getSessionStats() {
    const sessions = Array.from(this.activeSessions.values());
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      flagged: sessions.filter(s => s.status === 'flagged').length,
      disconnected: sessions.filter(s => s.status === 'disconnected').length,
      totalViolations: sessions.reduce((sum, s) => sum + s.violations.length, 0)
    };
  }

  // Cleanup inactive sessions (call this periodically)
  public cleanupInactiveSessions(timeoutMinutes: number = 30) {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    for (const [studentId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoffTime && session.status !== 'disconnected') {
        session.status = 'disconnected';
        this.activeSessions.set(studentId, session);
        
        // Notify admins about timeout
        this.notifyAdmins('student_timeout', {
          studentId,
          lastActivity: session.lastActivity.toISOString(),
          timeoutMinutes
        });
      }
    }
  }
}

export const proctoringService = new ProctoringService();
export default proctoringService;