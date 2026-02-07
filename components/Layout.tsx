
import React, { ReactNode } from 'react';
import { ICONS } from '../constants';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  notificationsCount: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, setCurrentPage, notificationsCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard, roles: [UserRole.STAFF, UserRole.SUPERVISOR, UserRole.DIRECTOR, UserRole.ADMIN] },
    { id: 'inbox', label: 'Inbox', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.375a3 3 0 11-6 0 3 3 0 016 0zm19.5.375a3 3 0 11-6 0 3 3 0 016 0zM18.75 10.5V19.5m-13.5-9V19.5m13.5-9l-3.375-4.875A1.125 1.125 0 0014.218 4.5H9.782a1.125 1.125 0 00-.907.45L5.25 10.5m13.5 0h-13.5" />
      </svg>
    ), roles: [UserRole.STAFF, UserRole.SUPERVISOR, UserRole.DIRECTOR, UserRole.ADMIN] },
    { id: 'files', label: 'All Files', icon: ICONS.Files, roles: [UserRole.STAFF, UserRole.SUPERVISOR, UserRole.DIRECTOR, UserRole.ADMIN] },
    { id: 'users', label: 'User Management', icon: ICONS.Users, roles: [UserRole.ADMIN] },
    { id: 'units-mgmt', label: 'Unit Management', icon: ICONS.Dashboard, roles: [UserRole.ADMIN] },
    { id: 'audit', label: 'Audit Logs', icon: ICONS.Audit, roles: [UserRole.ADMIN, UserRole.DIRECTOR] },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2 .712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">MinisTrack</span>
        </div>

        <nav className="flex-1 mt-6">
          {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                currentPage === item.id ? 'sidebar-item-active' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {typeof item.icon === 'function' ? <item.icon className="w-5 h-5" /> : item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentPage.replace('-', ' ')}</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {notificationsCount}
                  </span>
                )}
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <span className="text-sm font-medium text-slate-600">{user.email}</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
};
