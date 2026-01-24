
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('🔧 Iniciando reparación de identidades Auth vs Public...');
    
    // 1. Obtener usuarios de tabla pública (la fuente de la verdad para FKs)
    const { data: publicUsers, error: dbError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email');
        
    if (dbError) throw dbError;

    // Obtener todos los usuarios de Auth para machear en memoria (más rápido)
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    const results = [];

    for (const dbUser of publicUsers) {
        if (!dbUser.email) continue;
        
        // Buscar en Auth por email
        const authUser = authUsers.find(u => u.email?.toLowerCase() === dbUser.email.toLowerCase());

        if (authUser) {
            if (authUser.id === dbUser.id) {
                results.push({ email: dbUser.email, status: 'ok_synced' });
            } else {
                // DESINCRO DETECTADA: El ID de Auth es diferente al de la DB
                console.log(`⚠️ Reparando ${dbUser.email}: AuthID(${authUser.id}) != DbID(${dbUser.id})`);
                
                // A. Borrar usuario auth incorrecto (el nuevo que creé mal)
                const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
                if (delError) {
                    results.push({ email: dbUser.email, status: 'error_deleting_bad_auth', error: delError.message });
                    continue;
                }
                
                // B. Crear usuario auth con ID correcto (el viejo de la DB)
                const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    id: dbUser.id, // <--- CLAVE: FORZAR EL ID
                    email: dbUser.email,
                    password: '12345678', // Password reseteada
                    email_confirm: true,
                    user_metadata: { source: 'reparacion_automatic' }
                });
                
                results.push({ 
                    email: dbUser.email, 
                    status: createError ? 'error_recreating' : 'repaired_id_match',
                    error: createError ? createError.message : null
                });
            }
        } else {
            // Usuario está en DB pero no en Auth -> Crear en Auth con ID de DB (Restauración)
            console.log(`➕ Restaurando Auth para ${dbUser.email}`);
            const { error: createError } = await supabaseAdmin.auth.admin.createUser({
                    id: dbUser.id, // <--- CLAVE
                    email: dbUser.email,
                    password: '12345678',
                    email_confirm: true
            });
             results.push({ 
                 email: dbUser.email, 
                 status: createError ? 'error_restoring' : 'restored_from_db', 
                 error: createError ? createError.message : null 
             });
        }
    }
    
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('❌ Error reparación:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
