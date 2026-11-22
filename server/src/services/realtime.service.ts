import { Request, Response } from 'express';

interface ClientConnection {
  id: string;
  res: Response;
  stayId: string;
}

class RealtimeService {
  private clients: Map<string, Set<ClientConnection>> = new Map();

  /**
   * Registers a client response stream for SSE availability updates on a specific homestay.
   */
  public registerClient(stayId: string, res: Response): () => void {
    const normStayId = stayId.toLowerCase();
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const connection: ClientConnection = {
      id: clientId,
      res,
      stayId: normStayId,
    };

    if (!this.clients.has(normStayId)) {
      this.clients.set(normStayId, new Set());
    }

    this.clients.get(normStayId)!.add(connection);

    // Initial connection acknowledgment
    res.write(`data: ${JSON.stringify({ event: 'connected', stayId: normStayId, timestamp: new Date().toISOString() })}\n\n`);

    // Cleanup function
    return () => {
      const set = this.clients.get(normStayId);
      if (set) {
        set.delete(connection);
        if (set.size === 0) {
          this.clients.delete(normStayId);
        }
      }
    };
  }

  /**
   * Broadcasts an availability update to all active listeners for a stay.
   * Only includes safe, non-sensitive notification metadata.
   */
  public broadcastAvailabilityChange(stayId: string): void {
    const normStayId = stayId.toLowerCase();
    const listeners = this.clients.get(normStayId);

    if (!listeners || listeners.size === 0) {
      return;
    }

    const payload = JSON.stringify({
      event: 'availability_updated',
      stayId: normStayId,
      timestamp: new Date().toISOString(),
    });

    for (const client of listeners) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch {
        // Socket may have closed unexpectedly
        listeners.delete(client);
      }
    }
  }

  /**
   * Returns active connection count (useful for health diagnostics).
   */
  public getActiveListenerCount(stayId?: string): number {
    if (stayId) {
      return this.clients.get(stayId.toLowerCase())?.size || 0;
    }
    let total = 0;
    for (const set of this.clients.values()) {
      total += set.size;
    }
    return total;
  }
}

export const realtimeService = new RealtimeService();

/**
 * Express SSE endpoint handler for real-time stay availability stream.
 */
export function handleStayAvailabilityStream(req: Request, res: Response): void {
  const stayId = req.params.id as string;
  if (!stayId) {
    res.status(400).json({ error: 'Stay ID is required' });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const cleanup = realtimeService.registerClient(stayId, res);

  // Keep-alive heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    cleanup();
  });
}
