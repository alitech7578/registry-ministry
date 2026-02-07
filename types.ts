
export enum UserRole {
  STAFF = 'Staff',
  SUPERVISOR = 'Supervisor',
  DIRECTOR = 'Director',
  ADMIN = 'Admin'
}

export enum FileStatus {
  PENDING = 'Pending',
  ACKNOWLEDGED = 'Acknowledged',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  RETURNED = 'Returned',
  COMPLETED = 'Completed'
}

export interface Unit {
  id: string;
  name: string;
  active: boolean;
  description?: string;
}

export interface User {
  id: string;
  staffId: string;
  name: string;
  unitId: string;
  role: UserRole;
  email: string;
  active: boolean;
}

export interface FileRecord {
  id: string;
  refNo: string;
  title: string;
  description: string;
  creatorId: string;
  currentHolderId: string;
  status: FileStatus;
  createdAt: number;
  attachmentName: string;
  unitId: string;
}

export interface TransferRecord {
  id: string;
  fileId: string;
  fromUserId: string;
  toUserId: string;
  comment: string;
  timestamp: number;
  statusAtTransfer: FileStatus;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetId: string;
  timestamp: number;
  details: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: number;
}
