
import React, { useState, useMemo, useEffect } from 'react';
import { FileRecord, User, UserRole, FileStatus, TransferRecord } from '../types';
import { STATUS_COLORS, UNITS } from '../constants';
import { formatDate } from '../utils';

interface FileCardProps {
  file: FileRecord;
  currentUser: User;
  onTransfer: (fileId: string, toUserId: string, comment: string, nextStatus: FileStatus) => void;
  onAcknowledge: (fileId: string) => void;
  transfers: TransferRecord[];
  users: User[];
}

export const FileCard: React.FC<FileCardProps> = ({ file, currentUser, onTransfer, onAcknowledge, transfers, users }) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [comment, setComment] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  
  // Date range filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isCurrentHolder = file.currentHolderId === currentUser.id;
  const isPending = file.status === FileStatus.PENDING;

  const lastTransfer = [...transfers].sort((a, b) => b.timestamp - a.timestamp)[0];
  const lastSender = lastTransfer ? users.find(u => u.id === lastTransfer.fromUserId) : null;

  const STORAGE_KEY_LAST_RECIPIENT = `ministrack_last_recipient_for_${currentUser.id}`;

  useEffect(() => {
    // Only pre-fill from global localStorage if targetUserId is explicitly empty and we are NOT doing a quick forward
    if (showTransfer && !targetUserId) {
      const lastId = localStorage.getItem(STORAGE_KEY_LAST_RECIPIENT);
      if (lastId) {
        const exists = users.some(u => u.id === lastId);
        if (exists) setTargetUserId(lastId);
      }
    }
  }, [showTransfer, currentUser.id, users, targetUserId]);

  const filteredTransfers = useMemo(() => {
    let result = [...transfers].sort((a, b) => a.timestamp - b.timestamp);
    
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter(t => t.timestamp >= start);
    }
    
    if (endDate) {
      // Set end of day for the end date
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      result = result.filter(t => t.timestamp <= end);
    }
    
    return result;
  }, [transfers, startDate, endDate]);

  const groupedTargets: Record<string, User[]> = useMemo(() => {
    const filteredUsers = users.filter(u => {
      if (u.id === currentUser.id || !u.active) return false;
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DIRECTOR) return true;
      if (currentUser.role === UserRole.SUPERVISOR) return u.unitId === currentUser.unitId;
      if (currentUser.role === UserRole.STAFF) {
        const isSameUnit = u.unitId === currentUser.unitId;
        const isDirector = u.role === UserRole.DIRECTOR;
        const targetUnit = UNITS.find(un => un.id === u.unitId);
        const isSecurityOrCOE = targetUnit?.name === 'Security Unit' || targetUnit?.name === 'Center of Excellence (COE)';
        return isSameUnit || isDirector || isSecurityOrCOE;
      }
      return false;
    });

    const groups: Record<string, User[]> = {};
    filteredUsers.forEach(u => {
      const unit = UNITS.find(un => un.id === u.unitId)?.name || 'General Registry';
      if (!groups[unit]) groups[unit] = [];
      groups[unit].push(u);
    });
    return groups;
  }, [currentUser.id, currentUser.role, currentUser.unitId, users]);

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !comment) return;
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    localStorage.setItem(STORAGE_KEY_LAST_RECIPIENT, targetUserId);
    onTransfer(file.id, targetUserId, comment, FileStatus.PENDING);
    setShowConfirmModal(false);
    setShowTransfer(false);
    setComment('');
  };

  const handleQuickForward = () => {
    if (lastSender) {
      setTargetUserId(lastSender.id);
      setShowTransfer(true);
    }
  };

  const handleReturnFile = () => {
    const returnToId = lastTransfer ? lastTransfer.fromUserId : file.creatorId;
    const returnToUser = users.find(u => u.id === returnToId);
    
    const returnReason = window.prompt(`FILE RETURN PROTOCOL\n\nYou are returning this record to: ${returnToUser?.name || 'the original creator'}.\n\nREQUIRED: Provide a specific reason for returning this file:`);
    
    if (returnReason === null) return;
    if (returnReason.trim().length < 5) {
      alert("Error: A substantial reason is required.");
      return;
    }
    onTransfer(file.id, returnToId, `RETURNED: ${returnReason}`, FileStatus.RETURNED);
  };

  const handleDownload = () => {
    if (!file.attachmentName) return;
    const element = document.createElement("a");
    const fileContent = `MinisTrack Digital Signature Verification\n\nReference: ${file.refNo}\nTitle: ${file.title}`;
    const fileBlob = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${file.attachmentName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    alert("Simulating secure print protocol... Document sent to Ministry Secure Printer Cluster.");
  };

  const targetUserName = users.find(u => u.id === targetUserId)?.name || 'Unknown';
  const canReturn = (currentUser.role === UserRole.SUPERVISOR || currentUser.role === UserRole.DIRECTOR) && 
                   isCurrentHolder && 
                   (file.status === FileStatus.IN_REVIEW || file.status === FileStatus.APPROVED || file.status === FileStatus.ACKNOWLEDGED);

  const renderPreviewContent = () => {
    const fileName = file.attachmentName.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return (
        <div className="w-full min-h-[70vh] bg-white rounded shadow-inner p-12 relative flex flex-col items-center border border-slate-200">
           <div className="absolute top-8 left-8 flex items-center gap-2">
             <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
             </div>
             <div className="h-px w-12 bg-slate-200"></div>
           </div>
           
           <div className="text-center mb-10 mt-4">
              <h2 className="text-xl font-serif font-bold uppercase tracking-widest text-slate-800">OFFICIAL CORRESPONDENCE</h2>
              <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em]">Confidential Ministry Record</p>
           </div>

           <div className="w-full space-y-6">
              <div className="flex justify-between border-b pb-4 border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Reference: <span className="text-slate-900 ml-2 font-mono">{file.refNo}</span></span>
                <span className="text-xs font-bold text-slate-400 uppercase">Date: <span className="text-slate-900 ml-2">{formatDate(file.createdAt)}</span></span>
              </div>
              <div className="pt-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{file.title}</h3>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-50 rounded w-full"></div>
                  <div className="h-4 bg-slate-50 rounded w-full"></div>
                  <div className="h-4 bg-slate-50 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-50 rounded w-full"></div>
                  <div className="h-4 bg-slate-50 rounded w-4/6"></div>
                </div>
              </div>
              <div className="pt-10 flex flex-col items-end">
                <div className="w-32 h-16 border-b border-slate-300 relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Digitally Verified Signature</p>
              </div>
           </div>

           <div className="mt-auto pt-10 text-center">
              <p className="text-[9px] text-slate-300 uppercase tracking-widest italic">-- END OF DIGITAL PREVIEW --</p>
           </div>
        </div>
      );
    }
    
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
      return (
        <div className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <img 
            src={`https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=1000`} 
            alt="Attachment Preview" 
            className="w-full h-auto max-h-[70vh] object-contain mx-auto"
          />
          <div className="p-6 bg-white border-t flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Attachment: {file.attachmentName}</p>
               <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {file.refNo}</p>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">STRICTLY FOR OFFICIAL USE</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-96 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
           <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <h4 className="text-lg font-bold text-slate-600">Document Type Not Supported for Inline Preview</h4>
        <p className="text-sm text-slate-400 mt-2 text-center max-w-xs leading-relaxed">The file format <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{file.attachmentName.split('.').pop()?.toUpperCase()}</span> requires a specialized external viewer.</p>
        <button 
          onClick={handleDownload}
          className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download for Local Inspection
        </button>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isPending && isCurrentHolder ? 'border-amber-300 ring-1 ring-amber-100' : ''}`}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{file.refNo}</span>
              {isPending && isCurrentHolder && (
                <span className="flex items-center gap-2">
                   <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Incoming Task</span>
                </span>
              )}
            </div>
            <h4 className="text-xl font-bold text-slate-800 leading-tight">{file.title}</h4>
            <p className="text-slate-500 text-sm mt-2 line-clamp-2">{file.description}</p>
            
            {isCurrentHolder && lastSender && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registry Source:</span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {lastSender.name} ({lastSender.role})
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 flex sm:flex-col items-end gap-2 text-right">
            <span className="text-xs text-slate-400 font-medium">Registry Location:</span>
            <span className="text-sm font-bold text-slate-700">
               {isCurrentHolder ? 'In Your Possession' : users.find(u => u.id === file.currentHolderId)?.name || 'Central Registry'}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatDate(file.createdAt)}
            </div>
            {file.attachmentName && (
              <div className="flex items-center gap-1 text-slate-500 font-medium group cursor-pointer" onClick={() => setShowPreview(true)}>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span className="group-hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-4">{file.attachmentName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${showHistory ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showHistory ? 'Hide Trail' : 'Audit Trail'}
            </button>
            
            {file.attachmentName && (
              <button 
                onClick={() => setShowPreview(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Preview
              </button>
            )}
            
            {canReturn && (
              <button 
                onClick={handleReturnFile}
                className="px-4 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-all"
              >
                Return Record
              </button>
            )}

            {isCurrentHolder && isPending && (
              <button 
                onClick={() => onAcknowledge(file.id)}
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-all animate-pulse"
              >
                Acknowledge Receipt
              </button>
            )}

            {isCurrentHolder && !isPending && (
              <div className="flex items-center gap-2">
                {lastSender && (
                  <button 
                    onClick={handleQuickForward}
                    className="px-4 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5"
                    title={`Forward back to ${lastSender.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    Quick Forward to {lastSender.name.split(' ')[0]}
                  </button>
                )}
                <button 
                  onClick={() => { setTargetUserId(''); setShowTransfer(true); }}
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-all"
                >
                  Forward / Action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-800 rounded">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">Authenticated Document Review</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{file.refNo} | {file.attachmentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={handlePrint} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Print Securely">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
                 <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors ml-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center shadow-inner custom-scrollbar">
               <div className="w-full max-w-3xl">
                  {renderPreviewContent()}
               </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Integrity Verified</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Ministry Authenticated on {new Date().toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                 <button 
                  onClick={() => setShowPreview(false)} 
                  className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                 >
                   Discard Review
                 </button>
                 <button 
                  onClick={() => { handleDownload(); setShowPreview(false); }} 
                  className="px-8 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download Local Copy
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="bg-slate-50 border-t border-slate-100 p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Transfer Log & Audit Trail</h5>
            
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex flex-col">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From Date</label>
                  <input 
                    type="date" 
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-amber-500"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
               </div>
               <div className="flex flex-col">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">To Date</label>
                  <input 
                    type="date" 
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-amber-500"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
               </div>
               {(startDate || endDate) && (
                 <button 
                   onClick={() => { setStartDate(''); setEndDate(''); }}
                   className="mt-4 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
                 >
                   Clear Filter
                 </button>
               )}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-200"></div>

            <div className="space-y-8">
              {/* Initial Registration always shown if it matches the filter (creator creation is t=file.createdAt) */}
              {(!startDate || file.createdAt >= new Date(startDate).getTime()) && 
               (!endDate || file.createdAt <= new Date(endDate).setHours(23,59,59,999)) && (
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">File Registered</span>
                    <span className="text-[10px] font-medium text-slate-400">• {formatDate(file.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    By <span className="font-semibold text-slate-700">{users.find(u => u.id === file.creatorId)?.name || 'System'}</span>
                  </p>
                </div>
              )}

              {filteredTransfers.map((t, idx) => {
                const sender = users.find(u => u.id === t.fromUserId);
                const recipient = users.find(u => u.id === t.toUserId);
                
                return (
                  <div key={t.id} className="relative pl-10">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-amber-100 border-4 border-white shadow-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{sender?.name}</span>
                          <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          <span className="text-xs font-bold text-slate-700">{recipient?.name}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border-l-2 border-slate-200">
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{t.comment || 'No comment provided.'}"</p>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {formatDate(t.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredTransfers.length === 0 && (startDate || endDate) && (
                 <div className="relative pl-10 py-4 italic text-slate-400 text-xs">
                    No movements recorded within this specific date range.
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Forward To Personnel</h3>
                <button onClick={() => setShowTransfer(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitTransfer} className="p-8 space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Recipient</label>
                    <select 
                        required 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        value={targetUserId}
                        onChange={e => setTargetUserId(e.target.value)}
                    >
                        <option value="">-- Select Recipient --</option>
                        {Object.entries(groupedTargets).map(([unit, usersGroup]) => (
                          <optgroup key={unit} label={unit.toUpperCase()}>
                            {usersGroup.map((u: User) => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                          </optgroup>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comment/Instruction</label>
                    <textarea 
                        required 
                        rows={4} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm" 
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    ></textarea>
                 </div>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => setShowTransfer(false)} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">Confirm & Send</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-amber-50">
              <h3 className="text-xl font-bold text-slate-800">Confirm Dispatch</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Personnel</p>
                  <p className="text-sm font-bold text-slate-900">{targetUserName}</p>
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">By confirming, this record will be formally registered in {targetUserName}'s inbox awaiting their acknowledgment.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Review</button>
                <button onClick={handleFinalConfirm} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-widest">Verify & Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
