'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ThemeInitializer } from '../../components/ThemeInitializer';
import SidebarNuevo from '../../components/paneladmin/SidebarNuevo';
import DashboardNuevo from '../../components/paneladmin/DashboardNuevo';
import OrdenesNuevo from '../../components/paneladmin/OrdenesNuevo';
import Clientes from '../../components/paneladmin/Clientes';
import Comentarios from '../../components/paneladmin/Comentarios';
import Usuarios from '../../components/paneladmin/Usuarios';
import UserProfileDropdown from '../../components/paneladmin/UserProfileDropdown';
import LogoutConfirmModal from '../../components/paneladmin/LogoutConfirmModal';
import { NotificationBell } from '../../components/NotificationBell';
import { StoreNotificationBell } from '../../components/StoreNotificationBell';
import Marcas from '../../components/paneladmin/inventario/Marcas';
import Modelos from '../../components/paneladmin/inventario/Modelos';
import Accesorios from '../../components/paneladmin/inventario/Accesorios';
import Repuestos from '../../components/paneladmin/inventario/Repuestos';
import EquiposInv from '../../components/paneladmin/inventario/Equipos';
import Categorias from '../../components/paneladmin/inventario/Categorias';
import ProductosTienda from '../../components/paneladmin/ProductosTienda';
import Carrusel from '../../components/paneladmin/Carrusel';
import Encuestas from '../../components/paneladmin/Encuestas';
import PQR from '../../components/paneladmin/PQR';
import Indicadores from '../../components/paneladmin/Indicadores';
import Desempeno from '../../components/paneladmin/Desempeno';
import Cupones from '../../components/paneladmin/Cupones';
import { verificarOrdenesBodegaVencidas } from '@/lib/services/bodegaNotificationService';

interface UserSession {
  email: string;
  rol: string;
  nombre: string;
  isAuthenticated: boolean;
  loginTime: string;
  userId: string;
}

function PanelAdminContent() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [filtroFase, setFiltroFase] = useState<string | undefined>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  // Función para cambiar de sección
  const handleSectionChange = (section: string, fase?: string) => {
    setActiveSection(section);
    if (section === 'ordenes' && fase) {
      setFiltroFase(fase);
    } else {
      setFiltroFase(undefined);
    }
  };

  useEffect(() => {
    // SSR protection - verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    try {
      const session = window.localStorage.getItem('userSession');
      console.log('🔍 Panel Admin - Verificando sesión:', session);

      if (session) {
        try {
          const parsedSession = JSON.parse(session);
          console.log('📦 Sesión parseada:', parsedSession);

          if (parsedSession.isAuthenticated) {
            console.log('✅ Sesión válida, cargando panel...');
            setUserSession(parsedSession);
          } else {
            console.log('❌ Sesión inválida, redirigiendo a login...');
            router.push('/');
          }
        } catch (parseError) {
          console.error('❌ Error al parsear sesión:', parseError);
          window.localStorage.removeItem('userSession');
          router.push('/');
        }
      } else {
        console.log('❌ No hay sesión, redirigiendo a login...');
        router.push('/');
      }
    } catch (error) {
      console.error('❌ Error al acceder a localStorage:', error);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section');
    const faseFromQuery = searchParams.get('fase') || undefined;

    if (sectionFromQuery) {
      setActiveSection(sectionFromQuery);
      setFiltroFase(sectionFromQuery === 'ordenes' ? faseFromQuery : undefined);
    }
  }, [searchParams]);

  // Verificar órdenes en bodega vencidas al cargar el panel
  useEffect(() => {
    if (userSession) {
      verificarOrdenesBodegaVencidas();
    }
  }, [userSession]);

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error cerrando sesión Supabase:', e);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('userSession');
      // Limpiar tokens persistentes de Supabase
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          window.localStorage.removeItem(key);
        }
      });
    }
    router.push('/');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardNuevo onSectionChange={handleSectionChange} />;
      case 'ordenes':
        return <OrdenesNuevo key={filtroFase || 'all'} />;
      case 'clientes':
        return <Clientes />;
      case 'comentarios':
        return <Comentarios />;
      case 'usuarios':
        return <Usuarios />;

      // Inventario
      case 'inventario-marcas':
        return <Marcas />;
      case 'inventario-modelos':
        return <Modelos />;
      case 'inventario-accesorios':
        return <Accesorios />;
      case 'inventario-repuestos':
        return <Repuestos />;
      case 'inventario-equipos':
        return <EquiposInv />;

      // Admin Tienda
      case 'admin-tienda-productos':
        return <ProductosTienda />;
      case 'admin-tienda-categorias':
        return <Categorias />;
      case 'admin-tienda-carrusel':
        return <Carrusel />;
      case 'admin-tienda-encuestas':
        return <Encuestas />;
      case 'admin-tienda-pqr':
        return <PQR />;
      case 'admin-tienda-cupones':
        return <Cupones />;

      // Estadísticas
      case 'indicadores':
        return <Indicadores />;
      case 'desempeno':
        return <Desempeno />;
      default:
        return <DashboardNuevo onSectionChange={setActiveSection} />;
    }
  };

  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`admin-panel flex h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
      }`}>
      <ThemeInitializer />
      <SidebarNuevo
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Header */}
      <header className={`fixed top-0 right-0 h-16 transition-all duration-300 z-10 left-0 ${isCollapsed ? 'lg:left-16' : 'lg:left-64'
        } ${theme === 'light'
          ? 'bg-white border-b border-gray-200 shadow-sm'
          : 'bg-gray-800 border-b border-gray-700 shadow-sm'
        }`}>
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Botón toggle sidebar solo para móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${theme === 'light'
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className={`text-xl font-semibold hidden lg:block ${theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <StoreNotificationBell />
            <NotificationBell />
            <ThemeToggle />
            <UserProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto pt-16 p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
        }`}>
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default function PanelAdmin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PanelAdminContent />
    </Suspense>
  );
}