import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { LocalTreasureService } from './services/local-treasure.service';

async function bootstrap(): Promise<void> {
  try {
    // Attempt database connection if URI provided
    await connectDB();
    void LocalTreasureService.seedInitialTreasuresIfEmpty();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log('==================================================');
      console.log(`🌲 StayLocal Backend API running in [${env.NODE_ENV}] mode`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🩺 Health: http://localhost:${env.PORT}/api/health`);
      console.log(`🌍 CORS Origin: ${env.CORS_ORIGIN}`);
      console.log('==================================================');
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Shutdown] Received ${signal}. Closing StayLocal server gracefully...`);
      server.close(async () => {
        console.log('[Shutdown] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force exit after 10s timeout
      setTimeout(() => {
        console.error('[Shutdown] Forced termination after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('[Bootstrap] Fatal startup error:', error);
    process.exit(1);
  }
}

void bootstrap();
