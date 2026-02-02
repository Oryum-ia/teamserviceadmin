import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const startTime = Date.now();
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Test 1: Verificar conexión básica
    const { data: healthData, error: healthError } = await supabase
      .from('pqr')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (healthError) {
      return NextResponse.json({
        success: false,
        error: healthError.message,
        details: {
          code: healthError.code,
          hint: healthError.hint,
          message: healthError.message,
        },
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        vpsUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      }, { status: 500 });
    }

    // Test 2: Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con Supabase VPS',
      tests: {
        database: {
          status: 'OK',
          responseTime: `${responseTime}ms`,
        },
        auth: {
          status: authError ? 'ERROR' : 'OK',
          hasSession: !!session,
          error: authError?.message,
        },
      },
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
