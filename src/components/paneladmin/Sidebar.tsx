import React from 'react';
import {
  Menu,
  X,
  ClipboardList,
  UserPlus,
  Users,
  Wrench,
  FileText,
  Settings,
  Home,
  ChevronDown,
  ChevronRight,
  IdCard,
  Cog,
  Tag,
  Box,
  Archive,
  FileIcon,
  Layers,
  Clipboard,
  BarChart,
  Scale,
  DollarSign,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const menuItems = [
  {
    name: 'Panel de control',
    icon: Home,
    href: '/paneladmin',
    key: 'dashboard',
  },
  {
    name: 'Documentación',
    icon: FileText,
    href: '/paneladmin/documentacion',
    key: 'documentacion',
  },
  {
    name: 'Órdenes',
    icon: ClipboardList,
    href: '/paneladmin/ordenes',
    key: 'ordenes',
  },
  {
    name: 'Asignar orden',
    icon: UserPlus,
    href: '/paneladmin/asignar',
    key: 'asignar',
  },
  {
    name: 'Clientes',
    icon: Users,
    href: '/paneladmin/clientes',
    key: 'clientes',
  },
  {
    name: 'Maestros',
    icon: Wrench,
    key: 'maestros',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Accesorios',
        icon: Cog,
        key: 'accesorios',
      },
      {
        name: 'Marcas',
        icon: Tag,
        key: 'marcas',
      },
      {
        name: 'Modelos',
        icon: Box,
        key: 'modelos',
      },
      {
        name: 'Inventario',
        icon: Archive,
        key: 'inventario',
      },
      {
        name: 'Tipos de órdenes',
        icon: Clipboard,
        key: 'tipos-ordenes',
      },
      {
        name: 'Tipos de modelos',
        icon: Layers,
        key: 'tipos-modelos',
      },
      {
        name: 'Formularios',
        icon: FileIcon,
        key: 'formularios',
      },
    ],
  },
  {
    name: 'Hojas de vida',
    icon: IdCard,
    href: '/paneladmin/hojas-de-vida',
    key: 'hojas-de-vida',
  },
  {
    name: 'Pagos Bold',
    icon: DollarSign,
    href: '/paneladmin/pagos',
    key: 'pagos',
  },
  {
    name: 'Informes',
    icon: BarChart,
    href: '/paneladmin/informes',
    key: 'informes',
  },
  {
    name: 'Legalización',
    icon: Scale,
    href: '/paneladmin/legalizacion',
    key: 'legalizacion',
  },
  {
    name: 'Configuración',
    icon: Settings,
    href: '/paneladmin/configuracion',
    key: 'configuracion',
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

export default function Sidebar({ 
  isCollapsed, 
  setIsCollapsed, 
  activeSection, 
  onSectionChange, 
  sidebarOpen, 
  setSidebarOpen 
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({});
  const { theme } = useTheme();

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  return (
    <>
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col shadow-xl ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          <div className={`flex h-16 shrink-0 items-center justify-between px-4 border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-dark-bg-tertiary'
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
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuItems.map((item) => (
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
                  className={`group flex items-center px-2 py-2 sidebar-text rounded-md transition-colors duration-200 w-full text-left justify-between ${
                    activeSection === item.key
                      ? (theme === 'light' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-slate-700 text-white')
                      : (theme === 'light'
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-gray-100 hover:bg-gray-700 hover:text-white')
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  {item.hasSubmenu && (
                    expandedMenus[item.key] 
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {/* Submenu */}
                {item.hasSubmenu && item.submenu && expandedMenus[item.key] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.key}
                        onClick={() => {
                          onSectionChange(subItem.key);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-2 py-2 sidebar-submenu rounded-md transition-colors duration-200 w-full text-left ${
                          activeSection === subItem.key
                            ? (theme === 'light' 
                                ? 'bg-mint-50 text-mint-700' 
                                : 'bg-lime-400/5 text-lime-300 border-l-2 border-lime-400')
                            : (theme === 'light'
                                ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                : 'text-gray-300 hover:bg-dark-bg-tertiary hover:text-lime-300')
                        }`}
                      >
                        <subItem.icon className="mr-3 h-4 w-4" />
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          {/* Logo TeamServiceCosta en sidebar móvil */}
          <div className={`px-4 py-4 border-t ${
            theme === 'light' ? 'border-slate-200' : 'border-dark-bg-tertiary'
          }`}>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className={`px-3 py-1 rounded-lg professional-text text-xs ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-mint-600 to-mint-700 text-white'
                    : 'bg-gradient-to-r from-lime-400/20 to-lime-500/20 text-lime-400 border border-lime-400/30'
                }`}>
                  TEAMSERVICECOSTA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className={`flex min-h-0 flex-1 flex-col border-r ${
          theme === 'light' 
            ? 'bg-white border-slate-200' 
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className={`flex h-16 shrink-0 items-center border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-dark-bg-tertiary'
          } ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}>
            {!isCollapsed && (
              <>
                <img 
                  src="/img/logo.jpg" 
                  alt="TeamServiceCosta" 
                  className="h-8 w-auto rounded-lg object-contain"
                />
                <span className={`ml-2 sidebar-title truncate ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  TeamServiceCosta
                </span>
              </>
            )}
            
            {/* Botón de colapso */}
            <button
              type="button"
              className={`p-2 transition-colors duration-200 ${
                theme === 'light' 
                  ? 'text-gray-400 hover:text-gray-600' 
                  : 'text-gray-400 hover:text-gray-300'
              } ${
                isCollapsed ? 'w-full flex justify-center' : ''
              }`}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuItems.map((item) => (
              <div key={item.key}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu) {
                      if (isCollapsed) {
                        // En modo colapsado, expandir y mostrar submenu
                        setIsCollapsed(false);
                        toggleSubmenu(item.key);
                      } else {
                        toggleSubmenu(item.key);
                      }
                    } else {
                      onSectionChange(item.key);
                    }
                  }}
                  className={`group flex items-center px-2 py-2 sidebar-text rounded-md transition-colors duration-200 w-full text-left ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeSection === item.key
                      ? (theme === 'light' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-slate-700 text-white')
                      : (theme === 'light'
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-gray-100 hover:bg-gray-700 hover:text-white')
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center">
                    <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && item.name}
                  </div>
                  {!isCollapsed && item.hasSubmenu && (
                    expandedMenus[item.key] 
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {/* Submenu */}
                {!isCollapsed && item.hasSubmenu && item.submenu && expandedMenus[item.key] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.key}
                        onClick={() => onSectionChange(subItem.key)}
                        className={`group flex items-center px-2 py-2 sidebar-submenu rounded-md transition-colors duration-200 w-full text-left ${
                          activeSection === subItem.key
                            ? (theme === 'light' 
                                ? 'bg-mint-50 text-mint-700' 
                                : 'bg-lime-400/5 text-lime-300 border-l-2 border-lime-400')
                            : (theme === 'light'
                                ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                : 'text-gray-300 hover:bg-dark-bg-tertiary hover:text-lime-300')
                        }`}
                      >
                        <subItem.icon className="mr-3 h-4 w-4" />
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          {/* Logo TeamServiceCosta en la parte inferior */}
          {!isCollapsed && (
            <div className={`px-4 py-4 border-t ${
              theme === 'light' ? 'border-slate-200' : 'border-dark-bg-tertiary'
            }`}>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`px-3 py-1 rounded-lg professional-text text-xs ${
                    theme === 'light'
                      ? 'bg-gradient-to-r from-mint-600 to-mint-700 text-white'
                      : 'bg-gradient-to-r from-lime-400/20 to-lime-500/20 text-lime-400 border border-lime-400/30'
                  }`}>
                    TEAMSERVICECOSTA
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}