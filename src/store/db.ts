import { openDB, type IDBPDatabase } from 'idb'
import type { Project } from '../types'

const DB_NAME = 'caro-catalogo'
const DB_VERSION = 1
const KV = 'kv'
const IMAGES = 'images'
const PROJECT_KEY = 'project'

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV)
        if (!d.objectStoreNames.contains(IMAGES)) d.createObjectStore(IMAGES)
      }
    })
  }
  return dbPromise
}

export async function loadProject(): Promise<Project | undefined> {
  return (await db()).get(KV, PROJECT_KEY)
}

export async function saveProject(project: Project): Promise<void> {
  await (await db()).put(KV, project, PROJECT_KEY)
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  await (await db()).put(IMAGES, blob, id)
}

export async function getImage(id: string): Promise<Blob | undefined> {
  return (await db()).get(IMAGES, id)
}

export async function deleteImage(id: string): Promise<void> {
  await (await db()).delete(IMAGES, id)
}

export async function allImageKeys(): Promise<IDBValidKey[]> {
  return (await db()).getAllKeys(IMAGES)
}

export async function clearAll(): Promise<void> {
  const d = await db()
  await d.clear(KV)
  await d.clear(IMAGES)
}
