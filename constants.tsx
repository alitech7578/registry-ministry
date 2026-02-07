
import React from 'react';
import { UserRole, FileStatus, Unit, User } from './types';

export const UNITS: Unit[] = [
  { id: 'u1', name: 'Information Technology', active: true, description: 'Digital infrastructure and system support.' },
  { id: 'u2', name: 'Human Resources', active: true, description: 'Personnel management and welfare.' },
  { id: 'u3', name: 'Finance & Planning', active: true, description: 'Budgeting and fiscal strategy.' },
  { id: 'u4', name: 'Legal Affairs', active: true, description: 'Legislative compliance and litigation.' },
  { id: 'u5', name: 'Procurement', active: true, description: 'Acquisition of goods and services.' },
  { id: 'u6', name: 'Security Unit', active: true, description: 'Ministry safety and asset protection.' },
  { id: 'u7', name: 'Center of Excellence (COE)', active: true, description: 'Innovation and quality standards.' },
];

export const MOCK_USERS: User[] = [
  { id: '1', staffId: 'ADM-001', name: 'System Admin', unitId: 'u1', role: UserRole.ADMIN, email: 'admin@ministry.gov', active: true },
  { id: '2', staffId: 'STF-102', name: 'John Doe', unitId: 'u2', role: UserRole.STAFF, email: 'john.doe@ministry.gov', active: true },
  { id: '3', staffId: 'SUP-201', name: 'Sarah Smith', unitId: 'u2', role: UserRole.SUPERVISOR, email: 'sarah.smith@ministry.gov', active: true },
  { id: '4', staffId: 'DIR-301', name: 'Dr. Robert King', unitId: 'u2', role: UserRole.DIRECTOR, email: 'robert.king@ministry.gov', active: true },
  
  // New roles specifically requested
  { id: '5', staffId: 'HOD-HR', name: 'Mrs. Angela Hart', unitId: 'u2', role: UserRole.SUPERVISOR, email: 'angela.hart@ministry.gov', active: true }, // HOD HR
  { id: '6', staffId: 'SEC-001', name: 'Capt. James Miller', unitId: 'u6', role: UserRole.SUPERVISOR, email: 'security.head@ministry.gov', active: true }, // Security Head
  { id: '7', staffId: 'COE-001', name: 'Prof. Elena Vance', unitId: 'u7', role: UserRole.DIRECTOR, email: 'coe.lead@ministry.gov', active: true }, // COE Lead
  { id: '8', staffId: 'DIR-SEC', name: 'Hon. Michael Chen', unitId: 'u6', role: UserRole.DIRECTOR, email: 'michael.chen@ministry.gov', active: true }, // Director Security
];

export const STATUS_COLORS: Record<FileStatus, string> = {
  [FileStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [FileStatus.ACKNOWLEDGED]: 'bg-blue-100 text-blue-800',
  [FileStatus.IN_REVIEW]: 'bg-purple-100 text-purple-800',
  [FileStatus.APPROVED]: 'bg-green-100 text-green-800',
  [FileStatus.RETURNED]: 'bg-red-100 text-red-800',
  [FileStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
};

export const ICONS = {
  Dashboard: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  Files: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Users: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-3.833-6.249c-.184 0-.366.022-.539.063a6.75 6.75 0 01-11.74 0 6.748 6.748 0 01-.539-.063 4.125 4.125 0 00-3.833 6.249 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372m12-15.138a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm-12 0a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
    </svg>
  ),
  Audit: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Send: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L6 12zm0 0h7.5" />
    </svg>
  ),
  Upload: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
};
