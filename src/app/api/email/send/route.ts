import { NextRequest, NextResponse } from 'next/server';
import { 
  enviarCorreoCambioFase, 
  enviarCorreoConfirmacionOrden, 
  enviarCorreoRespuestaPQR,
  enviarCorreoRecordatorioMantenimiento
} from '@/lib/email/emailService';

/**
 * API Route para envío de correos
 * POST /api/email/send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, ...data } = body;

    if (!tipo) {
      return NextResponse.json(
        { error: 'El campo "tipo" es requerido' },
        { status: 400 }
      );
    }

    let resultado = false;

    switch (tipo) {
      case 'cambio_fase':
        // Validar campos requeridos
        if (!data.clienteEmail || !data.clienteNombre || !data.ordenId || !data.faseActual) {
          return NextResponse.json(
            { error: 'Campos requeridos: clienteEmail, clienteNombre, ordenId, faseActual' },
            { status: 400 }
          );
        }
        resultado = await enviarCorreoCambioFase(data);
        break;

      case 'confirmacion_orden':
        // Validar campos requeridos
        if (!data.clienteEmail || !data.clienteNombre || !data.ordenId || !data.fechaCreacion) {
          return NextResponse.json(
            { error: 'Campos requeridos: clienteEmail, clienteNombre, ordenId, fechaCreacion' },
            { status: 400 }
          );
        }
        resultado = await enviarCorreoConfirmacionOrden(data);
        break;

      case 'respuesta_pqr':
        // Validar campos requeridos
        if (!data.clienteEmail || !data.clienteNombre || !data.pqrId || !data.tipoPQR || !data.respuesta || !data.fechaRespuesta) {
          return NextResponse.json(
            { error: 'Campos requeridos: clienteEmail, clienteNombre, pqrId, tipoPQR, respuesta, fechaRespuesta' },
            { status: 400 }
          );
        }
        resultado = await enviarCorreoRespuestaPQR(data);
        break;

      case 'recordatorio_mantenimiento':
        // Validar campos requeridos
        if (!data.clienteEmail || !data.clienteNombre || !data.ordenId || !data.fechaMantenimiento || !data.equipoDescripcion) {
          return NextResponse.json(
            { error: 'Campos requeridos: clienteEmail, clienteNombre, ordenId, fechaMantenimiento, equipoDescripcion' },
            { status: 400 }
          );
        }
        resultado = await enviarCorreoRecordatorioMantenimiento(data);
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de correo no válido: ${tipo}` },
          { status: 400 }
        );
    }

    if (resultado) {
      return NextResponse.json(
        { success: true, message: 'Correo enviado exitosamente' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Error al enviar el correo' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en API de correo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
