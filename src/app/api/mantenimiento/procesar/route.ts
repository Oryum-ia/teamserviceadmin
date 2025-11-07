import { NextRequest, NextResponse } from 'next/server';
import { procesarNotificacionesMantenimiento } from '@/lib/services/mantenimientoNotificationService';

/**
 * API Route para procesar notificaciones de mantenimiento
 * GET /api/mantenimiento/procesar
 * 
 * Este endpoint puede ser llamado:
 * 1. Manualmente para pruebas
 * 2. Por un cron job externo (ej: cron-job.org, EasyCron, GitHub Actions)
 * 3. Por pg_cron usando pg_net extension (si está disponible)
 * 
 * IMPORTANTE: En producción, proteger este endpoint con autenticación/token
 */
export async function GET(request: NextRequest) {
  try {
    // Opcional: Validar token de seguridad para evitar accesos no autorizados
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🔄 Iniciando procesamiento de notificaciones de mantenimiento...');
    
    const resultado = await procesarNotificacionesMantenimiento();
    
    return NextResponse.json({
      success: resultado.success,
      timestamp: new Date().toISOString(),
      procesadas: resultado.procesadas,
      errores: resultado.errores,
      detalles: resultado.detalles
    }, {
      status: resultado.success ? 200 : 207 // 207 = Multi-Status (algunos éxitos, algunos errores)
    });

  } catch (error) {
    console.error('❌ Error en endpoint de mantenimiento:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * También soportar POST para mayor flexibilidad
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
