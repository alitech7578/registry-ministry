
import React, { useState, useEffect, useRef } from 'react';
import { User, FileRecord, TransferRecord, AuditLog, Notification, UserRole, FileStatus, Unit } from './types';
import { MOCK_USERS as INITIAL_USERS, UNITS as INITIAL_UNITS, STATUS_COLORS } from './constants';
import { Layout } from './components/Layout';
import { DashboardOverview } from './components/DashboardOverview';
import { FileCard } from './components/FileCard';
import { UserManagement } from './components/UserManagement';
import { generateRefNo, formatDate } from './utils';

const STORAGE_KEY_FILES = 'ministrack_files_v1';
const STORAGE_KEY_TRANSFERS = 'ministrack_transfers_v1';
const STORAGE_KEY_LOGS = 'ministrack_logs_v1';
const STORAGE_KEY_UNITS = 'ministrack_units_v1';
const STORAGE_KEY_USERS = 'ministrack_users_v1';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY_FILES);
    const savedTransfers = localStorage.getItem(STORAGE_KEY_TRANSFERS);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedUnits = localStorage.getItem(STORAGE_KEY_UNITS);
    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);

    if (savedFiles) setFiles(JSON.parse(savedFiles));
    if (savedTransfers) setTransfers(JSON.parse(savedTransfers));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedUnits) setUnits(JSON.parse(savedUnits)); else setUnits(INITIAL_UNITS);
    if (savedUsers) setUsers(JSON.parse(savedUsers)); else setUsers(INITIAL_USERS);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [files, transfers, logs, units, users]);

  const addLog = (userId: string, action: string, targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      targetId,
      timestamp: Date.now(),
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const notifyUser = (userId: string, message: string) => {
    setNotifications(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      userId,
      message,
      read: false,
      timestamp: Date.now()
    }, ...prev]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginForm.email);
    if (user) {
      if (!user.active) { alert('Account deactivated by Ministry Administrator.'); return; }
      setCurrentUser(user);
      setShowLoginModal(false);
      addLog(user.id, 'LOGIN', user.id, `User session started.`);
    } else {
      alert('Authentication failed. Check credentials.');
    }
  };

  const handleQuickLogin = (user: User) => {
    if (!user.active) return;
    setCurrentUser(user);
    setShowLoginModal(false);
    addLog(user.id, 'LOGIN', user.id, `Logged in via Quick Access.`);
  };

  const handleLogout = () => {
    if (currentUser) addLog(currentUser.id, 'LOGOUT', currentUser.id, `Session terminated.`);
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const createFile = (title: string, description: string, attachmentName: string) => {
    if (!currentUser) return;
    const unit = units.find(u => u.id === currentUser.unitId);
    const newFile: FileRecord = {
      id: Math.random().toString(36).substr(2, 9),
      refNo: generateRefNo(unit?.name || 'GEN'),
      title,
      description,
      creatorId: currentUser.id,
      currentHolderId: currentUser.id,
      status: FileStatus.PENDING,
      createdAt: Date.now(),
      attachmentName,
      unitId: currentUser.unitId
    };
    setFiles(prev => [newFile, ...prev]);
    addLog(currentUser.id, 'FILE_CREATE', newFile.id, `Record ${newFile.refNo} initialized in system.`);
  };

  const transferFile = (fileId: string, toUserId: string, comment: string, nextStatus: FileStatus) => {
    if (!currentUser) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) return { ...f, currentHolderId: toUserId, status: nextStatus };
      return f;
    }));

    const newTransfer: TransferRecord = {
      id: Math.random().toString(36).substr(2, 9),
      fileId,
      fromUserId: currentUser.id,
      toUserId,
      comment,
      timestamp: Date.now(),
      statusAtTransfer: nextStatus
    };
    setTransfers(prev => [...prev, newTransfer]);
    addLog(currentUser.id, 'FILE_TRANSFER', fileId, `Transferred to ${users.find(u => u.id === toUserId)?.name} as ${nextStatus}.`);
    
    const file = files.find(f => f.id === fileId);
    notifyUser(toUserId, `URGENT: ${file?.refNo} assigned to your registry by ${currentUser.name}.`);
    if (nextStatus === FileStatus.RETURNED) notifyUser(file?.creatorId!, `ALERT: Record ${file?.refNo} was returned for corrections.`);
  };

  const acknowledgeFile = (fileId: string) => {
    if (!currentUser) return;
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) return { ...f, status: FileStatus.ACKNOWLEDGED };
      return f;
    }));
    addLog(currentUser.id, 'FILE_ACKNOWLEDGE', fileId, `Registry acknowledgment signed.`);
    const file = files.find(f => f.id === fileId);
    if (file) notifyUser(file.creatorId, `Acknowledgment: ${file.refNo} is now being processed by ${currentUser.name}.`);
  };

  // Admin Management Actions
  const handleAddUser = (userData: any) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      active: true
    };
    setUsers(prev => [...prev, newUser]);
    addLog(currentUser?.id || 'SYSTEM', 'USER_ADD', newUser.id, `New personnel ${newUser.name} registered.`);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addLog(currentUser?.id || 'SYSTEM', 'USER_UPDATE', id, `Updated personnel profile.`);
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    const user = users.find(u => u.id === id);
    addLog(currentUser?.id || 'SYSTEM', 'USER_STATUS', id, `Personnel ${user?.name} access ${user?.active ? 'suspended' : 'restored'}.`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen lumina-gradient relative overflow-hidden flex flex-col">
        <header className="relative z-30 flex items-center justify-between px-8 py-8 lg:px-20">
          <div className="flex items-center gap-3">
            <div className="lumina-bg-gold p-2.5 rounded-lg shadow-xl shadow-amber-500/10">
              <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2 .712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight text-shadow">MINISTRACK</span>
          </div>
          <button onClick={() => setShowLoginModal(true)} className="lumina-bg-gold text-slate-900 px-10 py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-amber-400 transition-all shadow-2xl">SECURE LOGIN</button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 -mt-16">
          <div className="hero-plus opacity-10">+</div>
          <h1 className="text-5xl md:text-8xl text-white font-serif mb-8 leading-tight max-w-5xl text-shadow">Excellence in <br /><span className="lumina-gold italic">Registry</span> Automation</h1>
          <p className="text-slate-300 text-lg md:text-2xl max-w-3xl mb-14 font-light leading-relaxed">Integrated workflow ecosystem for Ministry personnel. Secure, accountable, and transparent record management for the digital era.</p>
          <button onClick={() => setShowLoginModal(true)} className="lumina-bg-gold text-slate-900 px-12 py-5 rounded-xl font-black flex items-center gap-3 hover:bg-amber-400 transition-all uppercase tracking-widest">Authorize Session</button>
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowLoginModal(false)}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="lumina-gradient p-10 md:w-1/2 text-white">
                <h3 className="text-3xl font-serif font-bold mb-6">Credential Pool</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                  {users.map(u => (
                    <button key={u.id} onClick={() => handleQuickLogin(u)} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500 transition-all text-left">
                      <div><p className="font-bold text-white text-sm">{u.name}</p><p className="text-[10px] text-slate-400 font-mono">{u.role}</p></div>
                      <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-slate-300">{u.staffId}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-10 md:w-1/2 bg-white flex flex-col justify-center">
                <h4 className="text-2xl font-bold text-slate-800 mb-6">Personnel Login</h4>
                <form onSubmit={handleLogin} className="space-y-6">
                  <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Official Email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
                  <input type="password" disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg outline-none text-slate-400" placeholder="••••••••" value="password" />
                  <button type="submit" className="w-full py-4 bg-amber-500 text-slate-900 font-bold rounded-lg shadow-xl uppercase tracking-widest text-sm">Sign In</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      notificationsCount={notifications.filter(n => n.userId === currentUser.id && !n.read).length}
    >
      {currentPage === 'dashboard' && (
        <DashboardPage user={currentUser} files={files} transfers={transfers} onTransfer={transferFile} onAcknowledge={acknowledgeFile} units={units} users={users} />
      )}
      {currentPage === 'inbox' && (
        <InboxPage user={currentUser} files={files} transfers={transfers} onTransfer={transferFile} onAcknowledge={acknowledgeFile} users={users} />
      )}
      {currentPage === 'files' && (
        <FilesPage user={currentUser} files={files} transfers={transfers} onCreate={createFile} onTransfer={transferFile} onAcknowledge={acknowledgeFile} units={units} users={users} />
      )}
      {currentPage === 'users' && (
        <UserManagement users={users} units={units} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onToggleUserStatus={handleToggleUserStatus} />
      )}
      {currentPage === 'units-mgmt' && (
        <UnitManagementPage units={units} />
      )}
      {currentPage === 'audit' && (
        <AuditPage logs={logs} users={users} />
      )}
    </Layout>
  );
};

const DashboardPage: React.FC<{ 
    user: User, 
    files: FileRecord[], 
    transfers: TransferRecord[],
    onTransfer: any,
    onAcknowledge: any,
    units: Unit[],
    users: User[]
}> = ({ user, files, transfers, onTransfer, onAcknowledge, units, users }) => {
  const myPending = files.filter(f => f.currentHolderId === user.id && f.status === FileStatus.PENDING);
  const myInitiatedFiles = files.filter(f => f.creatorId === user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Department Dashboard: {units.find(u => u.id === user.unitId)?.name}</h2>
          <p className="text-slate-500 font-medium">Registry Personnel: {user.name}</p>
        </div>
      </div>

      <DashboardOverview files={files} userId={user.id} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            Assigned Task Registry
          </h3>
          
          {myPending.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
               <svg className="w-16 h-16 mx-auto opacity-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 13l4 4L19 7" /></svg>
               <p className="font-bold uppercase tracking-tight text-slate-500">Task Pool Cleared</p>
               <p className="text-sm mt-1">There are no incoming records awaiting your action.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPending.map(file => (
                <FileCard key={file.id} file={file} currentUser={user} onTransfer={onTransfer} onAcknowledge={onAcknowledge} transfers={transfers.filter(t => t.fileId === file.id)} users={users} />
              ))}
            </div>
          )}

          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pt-6">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            My Dispatched Records
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                     <th className="px-6 py-4">Ref No</th>
                     <th className="px-6 py-4">Current Possession</th>
                     <th className="px-6 py-4">Last Movement</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {myInitiatedFiles.map(f => {
                       const currentHolder = users.find(u => u.id === f.currentHolderId);
                       return (
                         <tr key={f.id} className="text-sm hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                             <p className="font-mono font-bold text-indigo-600">{f.refNo}</p>
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">{f.title}</p>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">{currentHolder?.name[0]}</div>
                               <span className="font-medium text-slate-700">{f.currentHolderId === user.id ? 'Self' : currentHolder?.name}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-400">
                             {formatDate(f.createdAt)}
                           </td>
                         </tr>
                       );
                    })}
                    {myInitiatedFiles.length === 0 && <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">No records registered by this account.</td></tr>}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-lg font-bold text-slate-800">Ministry Log</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
               {transfers.slice(-15).reverse().map(t => (
                 <div key={t.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                   <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">{users.find(u => u.id === t.fromUserId)?.name[0]}</div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-800 leading-snug">
                       <span className="text-indigo-600">{users.find(u => u.id === t.fromUserId)?.name}</span> forwarded to <span className="text-amber-600">{users.find(u => u.id === t.toUserId)?.name}</span>
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter flex items-center gap-1">
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {new Date(t.timestamp).toLocaleTimeString()}
                     </p>
                   </div>
                 </div>
               ))}
               {transfers.length === 0 && <p className="p-8 text-center text-slate-400 text-xs italic">No registry movements recorded.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

const InboxPage: React.FC<{ 
  user: User, 
  files: FileRecord[], 
  transfers: TransferRecord[], 
  onTransfer: any, 
  onAcknowledge: any, 
  users: User[] 
}> = ({ user, files, transfers, onTransfer, onAcknowledge, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const myFiles = files.filter(f => f.currentHolderId === user.id);
  
  const filteredFiles = myFiles.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.refNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'pending') return matchesSearch && f.status === FileStatus.PENDING;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Official Personnel Registry</h2>
          <p className="text-slate-500 mt-1 font-medium">Review and process documents currently assigned to you.</p>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="bg-amber-50 px-5 py-3 rounded-xl border border-amber-100 text-center shadow-sm">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Incoming</p>
            <p className="text-2xl font-bold text-amber-700">{myFiles.filter(f => f.status === FileStatus.PENDING).length}</p>
          </div>
          <div className="bg-slate-900 px-5 py-3 rounded-xl text-center shadow-lg">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Held</p>
            <p className="text-2xl font-bold text-white">{myFiles.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-8 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Assigned
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-8 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Requires Receipt
          </button>
        </div>

        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredFiles.map(file => (
          <FileCard 
            key={file.id} 
            file={file} 
            currentUser={user} 
            onTransfer={onTransfer} 
            onAcknowledge={onAcknowledge} 
            transfers={transfers.filter(t => t.fileId === file.id)} 
            users={users} 
          />
        ))}

        {filteredFiles.length === 0 && (
          <div className="py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
            <p className="text-xl font-bold text-slate-600 uppercase tracking-tighter">Inbox Optimized</p>
            <p className="text-sm text-slate-400 mt-2">No records found matching your current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilesPage: React.FC<{ user: User, files: FileRecord[], transfers: TransferRecord[], onCreate: any, onTransfer: any, onAcknowledge: any, units: Unit[], users: User[] }> = ({ user, files, transfers, onCreate, onTransfer, onAcknowledge, units, users }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newFile, setNewFile] = useState({ title: '', description: '' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
           <h3 className="text-xl font-bold text-slate-800">Operational Registry</h3>
           <p className="text-xs text-slate-500 font-medium">Managing records associated with your profile.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
           Register New Document
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {files.filter(f => f.creatorId === user.id || f.currentHolderId === user.id).reverse().map(file => (
          <FileCard key={file.id} file={file} currentUser={user} onTransfer={onTransfer} onAcknowledge={onAcknowledge} transfers={transfers.filter(t => t.fileId === file.id)} users={users} />
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200 border border-slate-200">
            <div className="p-6 bg-slate-900 text-white">
               <h3 className="text-xl font-bold">Document Initiation</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Official Registry Activation</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Title</label>
                 <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="E.g. Departmental Correspondence" value={newFile.title} onChange={e => setNewFile({...newFile, title: e.target.value})} />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contextual Details</label>
                 <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm h-32" placeholder="Describe the document purpose..." value={newFile.description} onChange={e => setNewFile({...newFile, description: e.target.value})} />
              </div>
              <button onClick={() => { onCreate(newFile.title, newFile.description, 'registry_document.pdf'); setShowCreate(false); setNewFile({title: '', description: ''}); }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                 Authorize Initiation
              </button>
              <button onClick={() => setShowCreate(false)} className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditPage = ({ logs, users }: any) => (
  <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
        <tr>
          <th className="px-8 py-5">Timestamp</th>
          <th className="px-8 py-5">Personnel</th>
          <th className="px-8 py-5">Operation</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {logs.map((l: any) => (
          <tr key={l.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-8 py-5 text-slate-500 font-mono text-[11px]">{new Date(l.timestamp).toLocaleString()}</td>
            <td className="px-8 py-5">
               <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-800">{users.find((u: any) => u.id === l.userId)?.name}</span>
               </div>
            </td>
            <td className="px-8 py-5 text-slate-600 font-medium">{l.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const UnitManagementPage = ({ units }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {units.map((u: any) => (
      <div key={u.id} className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-xl transition-all group">
         <h4 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{u.name}</h4>
         <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{u.description || 'Primary Ministry Unit'}</p>
         <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
            </span>
         </div>
      </div>
    ))}
  </div>
);

export default App;
