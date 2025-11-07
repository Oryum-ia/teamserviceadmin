import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ClipboardList,
  Users,
  Home,
  ChevronDown,
  ChevronRight,
  BarChart,
  MessageSquare,
  UserCog,
  Store,
  Package,
  TrendingUp,
  Activity,
  Tag,
  Wrench,
  Box,
  Component,
  ShoppingBag,
  Image,
  Folder,
  ClipboardCheck,
  MessageCircle,
  Ticket
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

type SidebarMenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  hasSubmenu?: boolean;
  submenu?: SidebarMenuItem[];
  requireRole?: string;
};

const menuItems: SidebarMenuItem[] = [
  {
    name: 'Panel de control',
    icon: Home,
    key: 'dashboard',
  },
  {
    name: 'Órdenes',
    icon: ClipboardList,
    key: 'ordenes',
  },
  {
    name: 'Clientes',
    icon: Users,
    key: 'clientes',
  },
  {
    name: 'Estadísticas',
    icon: BarChart,
    key: 'estadisticas',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Indicadores',
        icon: TrendingUp,
        key: 'indicadores',
      },
      {
        name: 'Desempeño',
        icon: Activity,
        key: 'desempeno',
      },
    ],
  },
  {
    name: 'Comentarios',
    icon: MessageSquare,
    key: 'comentarios',
    requireRole: 'super-admin', // Solo visible para super-admin
  },
  {
    name: 'Usuarios',
    icon: UserCog,
    key: 'usuarios',
  },
  {
    name: 'Admin-tienda',
    icon: Store,
    key: 'admin-tienda',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Productos',
        icon: ShoppingBag,
        key: 'admin-tienda-productos',
      },
      {
        name: 'Categorías',
        icon: Folder,
        key: 'admin-tienda-categorias',
      },
      {
        name: 'Carrusel',
        icon: Image,
        key: 'admin-tienda-carrusel',
      },
      {
        name: 'Encuestas',
        icon: ClipboardCheck,
        key: 'admin-tienda-encuestas',
      },
      {
        name: 'PQR',
        icon: MessageCircle,
        key: 'admin-tienda-pqr',
      },
      {
        name: 'Cupones',
        icon: Ticket,
        key: 'admin-tienda-cupones',
      },
    ],
  },
  {
    name: 'Inventario',
    icon: Package,
    key: 'inventario',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Equipos',
        icon: Activity,
        key: 'inventario-equipos',
      },
      {
        name: 'Marcas',
        icon: Tag,
        key: 'inventario-marcas',
      },
      {
        name: 'Modelos',
        icon: Component,
        key: 'inventario-modelos',
      },
      {
        name: 'Accesorios',
        icon: Wrench,
        key: 'inventario-accesorios',
      },
      {
        name: 'Repuestos',
        icon: Box,
        key: 'inventario-repuestos',
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function SidebarNuevo({
  isCollapsed,
  setIsCollapsed,
  activeSection,
  onSectionChange,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string>('');
  const { theme } = useTheme();

  // Obtener el rol del usuario desde localStorage
  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      const parsedSession = JSON.parse(session);
      setUserRole(parsedSession.rol || '');
    }
  }, []);

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filtrar items del menú basados en el rol
  const filterMenuItemsByRole = (items: SidebarMenuItem[]): SidebarMenuItem[] => {
    const itemsByRequiredRole = items.filter(item => {
      // Si el item requiere un rol específico, verificar que coincida
      if (item.requireRole) {
        return userRole === item.requireRole;
      }
      return true;
    });

    if (userRole === 'tecnico') {
      const allowedKeys = new Set(['ordenes', 'inventario']);

      return itemsByRequiredRole
        .filter(item => allowedKeys.has(item.key))
        .map(item => {
          if (item.hasSubmenu && item.submenu) {
            return {
              ...item,
              submenu: item.submenu
            };
          }
          return item;
        });
    }

    if (userRole === 'administrador') {
      const excludedKeys = new Set(['admin-tienda', 'usuarios']);

      return itemsByRequiredRole
        .filter(item => !excludedKeys.has(item.key));
    }

    return itemsByRequiredRole;
  };

  const filteredMenuItems = filterMenuItemsByRole(menuItems);

  return (
    <>
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col shadow-xl ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          <div className={`flex h-16 shrink-0 items-center justify-between px-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <img
              src="/img/logo.jpg"
              alt="TeamServiceCosta"
              className="h-8 w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              className={`transition-colors duration-200 ${
                theme === 'light'
                  ? 'text-gray-400 hover:text-gray-600'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <div key={item.key}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleSubmenu(item.key);
                    } else {
                      onSectionChange(item.key);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 w-full text-left justify-between ${
                    activeSection === item.key
                      ? (theme === 'light'
                          ? 'bg-yellow-100 text-yellow-900 font-medium'
                          : 'bg-yellow-900/30 text-yellow-400 font-medium')
                      : (theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  {item.hasSubmenu && (
                    expandedMenus[item.key] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )
                  )}
                </button>

                {/* Submenu */}
                {item.hasSubmenu && expandedMenus[item.key] && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <button
                        key={subItem.key}
                        onClick={() => {
                          onSectionChange(subItem.key);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 w-full text-left ${
                          activeSection === subItem.key
                            ? (theme === 'light'
                                ? 'bg-yellow-50 text-yellow-900'
                                : 'bg-yellow-900/20 text-yellow-300')
                            : (theme === 'light'
                                ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white')
                        }`}
                      >
                        <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-30 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${
        theme === 'light' ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700'
      }`}>
        <div className={`flex h-16 shrink-0 items-center justify-between px-4 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          {!isCollapsed && (
            <img
              src="/img/logo.jpg"
              alt="TeamServiceCosta"
              className="h-8 w-auto rounded-lg object-contain"
            />
          )}
          <button
            type="button"
            className={`transition-colors duration-200 ${
              theme === 'light'
                ? 'text-gray-400 hover:text-gray-600'
                : 'text-gray-400 hover:text-gray-300'
            } ${isCollapsed ? 'mx-auto' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.hasSubmenu) {
                    toggleSubmenu(item.key);
                  } else {
                    onSectionChange(item.key);
                  }
                }}
                className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 w-full text-left justify-between ${
                  activeSection === item.key
                    ? (theme === 'light'
                        ? 'bg-yellow-100 text-yellow-900 font-medium'
                        : 'bg-yellow-900/30 text-yellow-400 font-medium')
                    : (theme === 'light'
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <div className="flex items-center min-w-0">
                  <item.icon className={`flex-shrink-0 h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!isCollapsed && item.hasSubmenu && (
                  expandedMenus[item.key] ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )
                )}
              </button>

              {/* Submenu */}
              {!isCollapsed && item.hasSubmenu && expandedMenus[item.key] && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu?.map((subItem) => (
                    <button
                      key={subItem.key}
                      onClick={() => onSectionChange(subItem.key)}
                      className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 w-full text-left ${
                        activeSection === subItem.key
                          ? (theme === 'light'
                              ? 'bg-yellow-50 text-yellow-900'
                              : 'bg-yellow-900/20 text-yellow-300')
                          : (theme === 'light'
                              ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              : 'text-gray-400 hover:bg-gray-700/50 hover:text-white')
                      }`}
                    >
                      <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{subItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
