import { type IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'tasker-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Сохраняет изображение в IndexedDB
 * @param imageId - Уникальный ID изображения
 * @param imageData - Base64 строка изображения (data:image/...)
 * @returns Promise с imageId
 */
export const saveImage = async (imageId: string, imageData: string): Promise<string> => {
  const db = await getDB();

  // Преобразуем base64 в Blob
  const response = await fetch(imageData);
  const blob = await response.blob();

  await db.put(STORE_NAME, blob, imageId);
  return imageId;
};

/**
 * Получает изображение из IndexedDB и создает blob:URL
 * @param imageId - ID изображения
 * @returns Promise с blob:URL или null, если изображение не найдено
 */
export const getImageUrl = async (imageId: string): Promise<string | null> => {
  const db = await getDB();
  const blob = await db.get(STORE_NAME, imageId);

  if (!blob) {
    return null;
  }

  return URL.createObjectURL(blob);
};

/**
 * Удаляет изображение из IndexedDB
 * @param imageId - ID изображения
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE_NAME, imageId);
};

/**
 * Генерирует уникальный ID для изображения
 */
export const generateImageId = (): string => {
  return `img_${crypto.randomUUID()}`;
};
