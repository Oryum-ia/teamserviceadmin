
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('🔄 Sincronizando usuarios Auth -> Public Table...');
    
    // 1. Obtener todos los usuarios de Auth
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    if (authError) {
        return NextResponse.json({ error: 'Error fetching auth users', details: authError }, { status: 500 });
    }

    const results = [];

    for (const user of users) {
      // 2. Verificar existencia en tabla public.usuarios
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Validación extra: Buscar por email por si existe con ID desincronizado
        const { data: userByEmail } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

        if (userByEmail) {
             console.log(`⚠️ Usuario ${user.email} con ID viejo. Actualizando ID ${userByEmail.id} -> ${user.id}...`);
             
             // Actualizar ID para volver a vincular
             const { error: updateError } = await supabaseAdmin
                .from('usuarios')
                .update({ id: user.id })
                .eq('email', user.email);

             if (updateError) {
                 results.push({ email: user.email, status: 'error_updating_id', error: updateError.message });
             } else {
                 results.push({ email: user.email, status: 'id_synced', old: userByEmail.id, new: user.id });
             }
             continue;
        }

        // 3. Crear usuario si no existe
        const nombre = user.user_metadata?.nombre_completo || user.email?.split('@')[0] || 'Sin Nombre';
        
        // Determinar rol basado en email (heuristicas simples)
        let rol = 'tecnico'; // Default seguro
        const email = user.email?.toLowerCase() || '';
        
        if (email.includes('admi') || email.includes('admin')) rol = 'administrador';
        else if (email.includes('recep')) rol = 'recepcion';
        
        console.log(`➕ Creando perfil para ${email} (Rol: ${rol})`);

        const { error: insertError } = await supabaseAdmin
          .from('usuarios')
          .insert({
            id: user.id, // VINCULACIÓN CRÍTICA: Mismo ID que Auth
            email: user.email,
            nombre: nombre, // CORREGIDO: nombre_completo -> nombre
            rol: rol,
            sede: 'Sede Principal',
            // nickname eliminado
            activo: true,   // CORREGIDO: estado -> activo (boolean)
            created_at: new Date().toISOString()
          });

        if (insertError) {
             console.error(`❌ Error creando usuario ${email}:`, insertError);
             results.push({ email, status: 'error', error: insertError.message });
        } else {
             results.push({ email, status: 'created', rol });
        }
      } else {
        results.push({ email: user.email, status: 'exists' });
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Procesados ${users.length} usuarios`, 
        results: results.filter(r => r.status !== 'exists') // Solo mostrar cambios
    });

  } catch (error: any) {
    console.error('❌ Error general sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
