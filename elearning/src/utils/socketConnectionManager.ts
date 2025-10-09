// Socket.IO connection utility for better error handling
export class SocketConnectionManager {
  private static instance: SocketConnectionManager;
  private connectionAttempts = 0;
  private maxAttempts = 5;
  private isConnecting = false;

  public static getInstance(): SocketConnectionManager {
    if (!SocketConnectionManager.instance) {
      SocketConnectionManager.instance = new SocketConnectionManager();
    }
    return SocketConnectionManager.instance;
  }

  // Check if the connection error is recoverable
  public isRecoverableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    // Common recoverable errors
    const recoverableErrors = [
      'xhr poll error',
      'websocket error',
      'connection timeout',
      'network error',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return recoverableErrors.some(recoverableError => 
      errorMessage.toLowerCase().includes(recoverableError.toLowerCase())
    );
  }

  // Get user-friendly error message
  public getUserFriendlyError(error: any): string {
    if (!error) return 'Unknown connection error';
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('xhr poll error')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    if (errorMessage.includes('websocket error')) {
      return 'WebSocket connection failed. Trying alternative connection method.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Connection timeout. The server may be busy.';
    }
    
    if (errorMessage.includes('ECONNREFUSED')) {
      return 'Cannot connect to server. Please try again later.';
    }
    
    return 'Connection error. Please refresh the page.';
  }

  // Check if we should attempt reconnection
  public shouldAttemptReconnection(): boolean {
    return this.connectionAttempts < this.maxAttempts && !this.isConnecting;
  }

  // Increment connection attempts
  public incrementAttempts(): void {
    this.connectionAttempts++;
  }

  // Reset connection attempts
  public resetAttempts(): void {
    this.connectionAttempts = 0;
    this.isConnecting = false;
  }

  // Set connecting state
  public setConnecting(connecting: boolean): void {
    this.isConnecting = connecting;
  }

  // Get connection status message
  public getConnectionStatusMessage(isConnected: boolean, error?: any): string {
    if (isConnected) {
      return 'Connected';
    }
    
    if (error) {
      return this.getUserFriendlyError(error);
    }
    
    if (this.connectionAttempts > 0) {
      return `Reconnecting... (${this.connectionAttempts}/${this.maxAttempts})`;
    }
    
    return 'Connecting...';
  }

  // Get connection status color
  public getConnectionStatusColor(isConnected: boolean, error?: any): 'success' | 'warning' | 'error' {
    if (isConnected) {
      return 'success';
    }
    
    if (error && !this.isRecoverableError(error)) {
      return 'error';
    }
    
    return 'warning';
  }

  // Log connection events with appropriate levels
  public logConnectionEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    
    switch (event) {
      case 'connect':
        console.log(`✅ [${timestamp}] Socket connected:`, data);
        this.resetAttempts();
        break;
        
      case 'disconnect':
        console.log(`❌ [${timestamp}] Socket disconnected:`, data);
        break;
        
      case 'connect_error':
        if (this.isRecoverableError(data)) {
          console.warn(`⚠️ [${timestamp}] Recoverable connection error:`, data);
        } else {
          console.error(`🔥 [${timestamp}] Connection error:`, data);
        }
        break;
        
      case 'reconnect':
        console.log(`🔄 [${timestamp}] Socket reconnected after ${data} attempts`);
        this.resetAttempts();
        break;
        
      case 'reconnect_attempt':
        console.log(`🔄 [${timestamp}] Reconnection attempt ${data}`);
        break;
        
      case 'reconnect_error':
        console.error(`🔥 [${timestamp}] Reconnection error:`, data);
        break;
        
      case 'reconnect_failed':
        console.error(`🔥 [${timestamp}] Reconnection failed - giving up`);
        break;
        
      default:
        console.log(`📡 [${timestamp}] Socket event ${event}:`, data);
    }
  }
}

export const socketConnectionManager = SocketConnectionManager.getInstance();
