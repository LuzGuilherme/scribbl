import { getSupabaseClient } from './client';
import type { ScribblElement, AppState } from '@/types';

export interface Drawing {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  elements: ScribblElement[];
  app_state: Partial<AppState>;
  thumbnail: string | null;
  is_public: boolean;
  public_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

// Drawing CRUD operations
export async function createDrawing(
  name: string = 'Untitled',
  folderId: string | null = null
): Promise<Drawing | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('drawings')
    .insert({
      user_id: user.id,
      name,
      folder_id: folderId,
      elements: [],
      app_state: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating drawing:', error);
    return null;
  }

  return data as Drawing;
}

export async function getDrawing(id: string): Promise<Drawing | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching drawing:', error);
    return null;
  }

  return data as Drawing;
}

export async function getPublicDrawing(publicId: string): Promise<Drawing | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .eq('public_id', publicId)
    .eq('is_public', true)
    .single();

  if (error) {
    console.error('Error fetching public drawing:', error);
    return null;
  }

  return data as Drawing;
}

export async function updateDrawing(
  id: string,
  updates: Partial<Pick<Drawing, 'name' | 'elements' | 'app_state' | 'thumbnail' | 'folder_id'>>
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('drawings')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating drawing:', error);
    return false;
  }

  return true;
}

export async function deleteDrawing(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('drawings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting drawing:', error);
    return false;
  }

  return true;
}

export async function getUserDrawings(folderId: string | null = null): Promise<Drawing[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('drawings')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  } else {
    query = query.is('folder_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching drawings:', error);
    return [];
  }

  return data as Drawing[];
}

export async function makeDrawingPublic(id: string): Promise<string | null> {
  const supabase = getSupabaseClient();

  // Generate a random public ID
  const publicId = generatePublicId();

  const { error } = await supabase
    .from('drawings')
    .update({
      is_public: true,
      public_id: publicId,
    })
    .eq('id', id);

  if (error) {
    console.error('Error making drawing public:', error);
    return null;
  }

  return publicId;
}

export async function makeDrawingPrivate(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('drawings')
    .update({
      is_public: false,
      public_id: null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error making drawing private:', error);
    return false;
  }

  return true;
}

// Folder CRUD operations
export async function createFolder(
  name: string,
  parentId: string | null = null
): Promise<Folder | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating folder:', error);
    return null;
  }

  return data as Folder;
}

export async function getUserFolders(parentId: string | null = null, all: boolean = false): Promise<Folder[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  // If not getting all folders, filter by parent
  if (!all) {
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }

  return data as Folder[];
}

export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, 'name' | 'parent_id'>>
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating folder:', error);
    return false;
  }

  return true;
}

export async function deleteFolder(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting folder:', error);
    return false;
  }

  return true;
}

// Helper function to generate public ID
function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Library types and operations
export interface Library {
  id: string;
  user_id: string;
  name: string;
  elements: ScribblElement[];
  is_preset: boolean;
  created_at: string;
}

export async function createLibraryItem(
  name: string,
  elements: ScribblElement[]
): Promise<Library | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('libraries')
    .insert({
      user_id: user.id,
      name,
      elements,
      is_preset: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating library item:', error);
    return null;
  }

  return data as Library;
}

export async function getUserLibraries(): Promise<Library[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('libraries')
    .select('*')
    .or(`user_id.eq.${user.id},is_preset.eq.true`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching libraries:', error);
    return [];
  }

  return data as Library[];
}

export async function deleteLibraryItem(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('libraries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting library item:', error);
    return false;
  }

  return true;
}

export async function updateLibraryItem(
  id: string,
  updates: Partial<Pick<Library, 'name' | 'elements'>>
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('libraries')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating library item:', error);
    return false;
  }

  return true;
}

// Generate thumbnail from elements
export function generateThumbnailFromElements(
  elements: ScribblElement[],
  renderScene: (canvas: HTMLCanvasElement, elements: ScribblElement[], appState: AppState, selectedElementIds: Record<string, boolean>, alignmentGuides: never[], editingElementId: null) => void,
  maxSize = 300
): string {
  const visibleElements = elements.filter(el => !el.isDeleted);
  if (visibleElements.length === 0) return '';

  // Calculate bounding box of all elements
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  visibleElements.forEach(el => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  const padding = 20;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  // Calculate scale to fit in maxSize while maintaining aspect ratio
  const scale = Math.min(maxSize / contentWidth, maxSize / contentHeight, 2);
  const canvasWidth = Math.ceil(contentWidth * scale);
  const canvasHeight = Math.ceil(contentHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Create app state for rendering
  const thumbnailAppState: AppState = {
    tool: 'selection',
    selectedElementIds: {},
    zoom: scale,
    scrollX: (-minX + padding) * scale,
    scrollY: (-minY + padding) * scale,
    currentColor: '#000000',
    currentBackgroundColor: 'transparent',
    currentStrokeWidth: 1,
    currentFillStyle: 'hachure',
    currentRoughness: 1,
    currentOpacity: 100,
    showGrid: false,
    gridSize: 20,
    isDrawing: false,
    isPanning: false,
    cursorPosition: null,
  };

  // Render elements to the canvas
  renderScene(canvas, visibleElements, thumbnailAppState, {}, [], null);

  return canvas.toDataURL('image/png', 0.7);
}

// Legacy function - kept for compatibility
export function generateThumbnail(canvas: HTMLCanvasElement, maxSize = 200): string {
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return '';

  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
  tempCanvas.width = canvas.width * scale;
  tempCanvas.height = canvas.height * scale;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

  return tempCanvas.toDataURL('image/png', 0.5);
}
