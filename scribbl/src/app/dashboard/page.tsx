'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Drawing,
  Folder,
  getUserDrawings,
  getUserFolders,
  createDrawing,
  createFolder,
  deleteDrawing,
  deleteFolder,
  updateFolder,
  updateDrawing,
} from '@/lib/supabase/drawings';
import { DashboardDecorations, PencilIllustration } from '@/components/ui/Decorations';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type SortOption = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';
type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]); // For breadcrumb
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Edit state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [editingDrawingName, setEditingDrawingName] = useState('');

  // Move dialog state
  const [movingDrawingId, setMovingDrawingId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<'drawing' | 'folder'>('drawing');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setLoading(true);
      const [drawingsData, foldersData, allFoldersData] = await Promise.all([
        getUserDrawings(currentFolder),
        getUserFolders(currentFolder),
        getUserFolders(null, true), // Get all folders for breadcrumb
      ]);
      setDrawings(drawingsData);
      setFolders(foldersData);
      setAllFolders(allFoldersData);
      setLoading(false);
    }

    loadData();
  }, [user, currentFolder]);

  // Filter and sort drawings
  const filteredDrawings = useMemo(() => {
    let result = [...drawings];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'updated_desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated_asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [drawings, searchQuery, sortBy]);

  // Filter folders by search
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    const query = searchQuery.toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(query));
  }, [folders, searchQuery]);

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!currentFolder) return [];

    const path: Folder[] = [];
    let folderId: string | null = currentFolder;

    while (folderId) {
      const folder = allFolders.find(f => f.id === folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parent_id;
      } else {
        break;
      }
    }

    return path;
  }, [currentFolder, allFolders]);

  const handleCreateDrawing = async () => {
    setCreating(true);
    const drawing = await createDrawing('Untitled', currentFolder);
    if (drawing) {
      router.push(`/draw/${drawing.id}`);
    }
    setCreating(false);
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      const folder = await createFolder(name, currentFolder);
      if (folder) {
        setFolders(prev => [...prev, folder]);
        setAllFolders(prev => [...prev, folder]);
      }
    }
  };

  const handleDeleteDrawing = (id: string) => {
    setDeleteTargetId(id);
    setDeleteTargetType('drawing');
    setDeleteConfirmOpen(true);
  };

  const handleDeleteFolder = (id: string) => {
    setDeleteTargetId(id);
    setDeleteTargetType('folder');
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    if (deleteTargetType === 'drawing') {
      const success = await deleteDrawing(deleteTargetId);
      if (success) {
        setDrawings(prev => prev.filter(d => d.id !== deleteTargetId));
      }
    } else {
      const success = await deleteFolder(deleteTargetId);
      if (success) {
        setFolders(prev => prev.filter(f => f.id !== deleteTargetId));
        setAllFolders(prev => prev.filter(f => f.id !== deleteTargetId));
      }
    }

    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    if (newName.trim()) {
      const success = await updateFolder(id, { name: newName.trim() });
      if (success) {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName.trim() } : f));
        setAllFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName.trim() } : f));
      }
    }
    setEditingFolderId(null);
  };

  const handleRenameDrawing = async (id: string, newName: string) => {
    if (newName.trim()) {
      const success = await updateDrawing(id, { name: newName.trim() });
      if (success) {
        setDrawings(prev => prev.map(d => d.id === id ? { ...d, name: newName.trim() } : d));
      }
    }
    setEditingDrawingId(null);
  };

  const handleMoveDrawing = async (drawingId: string, targetFolderId: string | null) => {
    const success = await updateDrawing(drawingId, { folder_id: targetFolderId });
    if (success) {
      // Remove from current view
      setDrawings(prev => prev.filter(d => d.id !== drawingId));
    }
    setMovingDrawingId(null);
    setShowMoveDialog(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeDate = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-gradient">
        <div className="text-gray-500 font-virgil text-xl animate-pulse-soft">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-gradient relative overflow-x-hidden">
      {/* Decorative background elements */}
      <DashboardDecorations />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-virgil bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                Scribbl
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`hover:text-indigo-500 transition-colors ${!currentFolder ? 'text-gray-800 font-virgil text-base' : ''}`}
          >
            My Drawings
          </button>
          {breadcrumbPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => setCurrentFolder(folder.id)}
                className={`hover:text-gray-700 ${index === breadcrumbPath.length - 1 ? 'text-gray-900 font-medium' : ''}`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search drawings and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCreateDrawing}
              disabled={creating}
              className="btn-soft flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 whitespace-nowrap shadow-md shadow-indigo-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {creating ? 'Creating...' : 'New Drawing'}
            </button>
            <button
              onClick={handleCreateFolder}
              className="btn-soft flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-white hover:border-gray-300 whitespace-nowrap shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">New Folder</span>
            </button>
          </div>
        </div>

        {/* Sort and View Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="updated_desc">Last modified</option>
              <option value="updated_asc">Oldest first</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-gray-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              title="Grid view"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              title="List view"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-virgil text-lg animate-pulse-soft">Loading your drawings...</div>
        ) : (
          <>
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-virgil text-gray-500 mb-4">
                  Folders {searchQuery && `(${filteredFolders.length})`}
                </h2>
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                  : "space-y-2"
                }>
                  {filteredFolders.map(folder => (
                    viewMode === 'grid' ? (
                      <div
                        key={folder.id}
                        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 card-hover cursor-pointer hover:border-indigo-200"
                        onClick={() => !editingFolderId && setCurrentFolder(folder.id)}
                      >
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-yellow-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                          </svg>
                          {editingFolderId === folder.id ? (
                            <input
                              type="text"
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onBlur={() => handleRenameFolder(folder.id, editingFolderName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameFolder(folder.id, editingFolderName);
                                if (e.key === 'Escape') setEditingFolderId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="text-sm font-medium text-center w-full px-1 py-0.5 border border-indigo-500 rounded focus:outline-none"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900 text-center truncate w-full">
                              {folder.name}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-500"
                            title="Rename"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={folder.id}
                        className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => !editingFolderId && setCurrentFolder(folder.id)}
                      >
                        <svg className="w-8 h-8 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                        {editingFolderId === folder.id ? (
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.id, editingFolderName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id, editingFolderName);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 text-sm font-medium px-2 py-1 border border-indigo-500 rounded focus:outline-none"
                          />
                        ) : (
                          <span className="flex-1 text-sm font-medium text-gray-900">{folder.name}</span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-500"
                            title="Rename"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Drawings */}
            <div>
              <h2 className="text-sm font-virgil text-gray-500 mb-4">
                Drawings {searchQuery && `(${filteredDrawings.length})`}
              </h2>
              {filteredDrawings.length === 0 ? (
                <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
                  {searchQuery ? (
                    <>
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500 mb-4 font-virgil">No drawings match "{searchQuery}"</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <PencilIllustration size={100} className="mx-auto animate-float" />
                      </div>
                      <h3 className="text-xl font-virgil text-gray-700 mb-2">No drawings yet</h3>
                      <p className="text-gray-400 mb-6">Start creating something beautiful!</p>
                      <button
                        onClick={handleCreateDrawing}
                        disabled={creating}
                        className="btn-soft px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 shadow-lg shadow-indigo-200"
                      >
                        Create your first drawing
                      </button>
                    </>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredDrawings.map(drawing => (
                    <div
                      key={drawing.id}
                      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden card-hover"
                    >
                      <Link href={`/draw/${drawing.id}`}>
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          {drawing.thumbnail ? (
                            <img
                              src={drawing.thumbnail}
                              alt={drawing.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="p-4">
                        {editingDrawingId === drawing.id ? (
                          <input
                            type="text"
                            value={editingDrawingName}
                            onChange={(e) => setEditingDrawingName(e.target.value)}
                            onBlur={() => handleRenameDrawing(drawing.id, editingDrawingName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameDrawing(drawing.id, editingDrawingName);
                              if (e.key === 'Escape') setEditingDrawingId(null);
                            }}
                            autoFocus
                            className="w-full font-medium px-1 py-0.5 border border-indigo-500 rounded focus:outline-none"
                          />
                        ) : (
                          <Link href={`/draw/${drawing.id}`}>
                            <h3 className="font-medium text-gray-800 truncate hover:text-indigo-500 transition-colors">{drawing.name}</h3>
                          </Link>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeDate(drawing.updated_at)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setMovingDrawingId(drawing.id);
                            setShowMoveDialog(true);
                          }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-indigo-500 transition-colors"
                          title="Move to folder"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingDrawingId(drawing.id);
                            setEditingDrawingName(drawing.name);
                          }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-indigo-500 transition-colors"
                          title="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDrawing(drawing.id);
                          }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Public indicator */}
                      {drawing.is_public && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-green-100/90 backdrop-blur-sm text-green-600 text-xs rounded-full font-medium">
                          Public
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {filteredDrawings.map(drawing => (
                    <div
                      key={drawing.id}
                      className="group flex items-center gap-4 p-4 hover:bg-white/50 transition-colors"
                    >
                      <Link href={`/draw/${drawing.id}`} className="flex-shrink-0">
                        <div className="w-20 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {drawing.thumbnail ? (
                            <img
                              src={drawing.thumbnail}
                              alt={drawing.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        {editingDrawingId === drawing.id ? (
                          <input
                            type="text"
                            value={editingDrawingName}
                            onChange={(e) => setEditingDrawingName(e.target.value)}
                            onBlur={() => handleRenameDrawing(drawing.id, editingDrawingName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameDrawing(drawing.id, editingDrawingName);
                              if (e.key === 'Escape') setEditingDrawingId(null);
                            }}
                            autoFocus
                            className="font-medium px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        ) : (
                          <Link href={`/draw/${drawing.id}`}>
                            <h3 className="font-medium text-gray-800 truncate hover:text-indigo-500 transition-colors">{drawing.name}</h3>
                          </Link>
                        )}
                        <p className="text-sm text-gray-400">
                          Modified {formatRelativeDate(drawing.updated_at)}
                        </p>
                      </div>
                      {drawing.is_public && (
                        <span className="px-2.5 py-1 bg-green-100/80 text-green-600 text-xs rounded-full font-medium">
                          Public
                        </span>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={() => {
                            setMovingDrawingId(drawing.id);
                            setShowMoveDialog(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-500"
                          title="Move to folder"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingDrawingId(drawing.id);
                            setEditingDrawingName(drawing.name);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-500"
                          title="Rename"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDrawing(drawing.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Move to Folder Dialog */}
        {showMoveDialog && movingDrawingId && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md mx-4 border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-virgil text-gray-800">Move to folder</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select a destination folder for "{drawings.find(d => d.id === movingDrawingId)?.name}"
                </p>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleMoveDrawing(movingDrawingId, null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                    currentFolder === null ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium text-gray-700">My Drawings (Root)</span>
                </button>
                {allFolders
                  .filter(f => f.id !== currentFolder)
                  .map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveDrawing(movingDrawingId, folder.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                      <span className="text-gray-700">{folder.name}</span>
                    </button>
                  ))}
                {allFolders.length === 0 && currentFolder !== null && (
                  <p className="text-center text-gray-400 py-4 font-virgil">No other folders available</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => {
                    setShowMoveDialog(false);
                    setMovingDrawingId(null);
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title={deleteTargetType === 'drawing' ? 'Delete Drawing' : 'Delete Folder'}
          message={
            deleteTargetType === 'drawing'
              ? 'Are you sure you want to delete this drawing? This action cannot be undone.'
              : 'Are you sure you want to delete this folder and all its contents? This action cannot be undone.'
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </main>
    </div>
  );
}
