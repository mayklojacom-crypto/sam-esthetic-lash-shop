import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/pedidos', icon: Package, label: 'Pedidos' },
  { path: '/admin/produtos', icon: ShoppingBag, label: 'Produtos' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, email } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebar = (
    <>
      <div className="p-4 md:p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Sam Esthetic</h1>
          <p className="text-xs text-slate-400 mt-0.5">Painel Admin</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 truncate mb-2">{email}</p>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 md:px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-slate-900 text-white flex-col shrink-0">
        {sidebar}
      </aside>
    </>
  );
};

export default AdminSidebar;
