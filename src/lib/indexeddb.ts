import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface CollabLANDB extends DBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      sender: string;
      text: string;
      timestamp: number;
      color: string;
    };
    indexes: { 'by-time': number };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      status: 'pending' | 'in-progress' | 'done';
      assignee: string;
      lastEdited: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { 'by-status': string };
  };
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      size: number;
      type: string;
      data: ArrayBuffer;
      sender: string;
      timestamp: number;
    };
  };
}

let dbInstance: IDBPDatabase<CollabLANDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<CollabLANDB>('collablan', 1, {
    upgrade(db) {
      const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
      msgStore.createIndex('by-time', 'timestamp');

      const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
      taskStore.createIndex('by-status', 'status');

      db.createObjectStore('files', { keyPath: 'id' });
    },
  });
  return dbInstance;
}

export async function saveMessage(msg: CollabLANDB['messages']['value']) {
  const db = await getDB();
  await db.put('messages', msg);
}

export async function getMessages() {
  const db = await getDB();
  return db.getAllFromIndex('messages', 'by-time');
}

export async function saveTask(task: CollabLANDB['tasks']['value']) {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function getTasks() {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function deleteTask(id: string) {
  const db = await getDB();
  await db.delete('tasks', id);
}

export async function saveFile(file: CollabLANDB['files']['value']) {
  const db = await getDB();
  await db.put('files', file);
}

export async function getFiles() {
  const db = await getDB();
  return db.getAll('files');
}

export type { CollabLANDB };
