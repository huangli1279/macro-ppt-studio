import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 健康检查端点
 * 用于 Docker 容器和负载均衡器的健康监控
 */
export async function GET() {
  try {
    // 检查数据库连接
    await db.execute({ sql: 'SELECT 1', args: [] });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'hongguanai4',
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'hongguanai4',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

