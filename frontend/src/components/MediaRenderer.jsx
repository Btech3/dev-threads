import { Download, FileText, Image as ImageIcon, Music4, Play, Video as VideoIcon } from 'lucide-react';

const getTypeFromUrl = (mediaUrl = '', fallback = 'document') => {
  const url = String(mediaUrl).toLowerCase();

  if (/(png|jpe?g|gif|webp|svg|bmp)/.test(url)) return 'image';
  if (/(mp4|webm|ogg|mov|avi|m4v)/.test(url)) return 'video';
  if (/(mp3|wav|m4a|aac|ogg|flac)/.test(url)) return 'audio';

  return fallback || 'document';
};

export default function MediaRenderer({ messageType, mediaUrl, fileName, className = '' }) {
  const normalizedType = String(messageType || getTypeFromUrl(mediaUrl, 'document')).toLowerCase();
  const displayName = fileName || mediaUrl?.split('/').pop() || 'Attachment';

  const handleOpen = () => {
    if (!mediaUrl) return;
    window.open(mediaUrl, '_blank', 'noopener,noreferrer');
  };

  if (!mediaUrl) return null;

  if (normalizedType === 'image') {
    return (
      <button type="button" onClick={handleOpen} className={`block overflow-hidden rounded-xl ${className}`}>
        <img src={mediaUrl} alt={displayName} className="max-h-64 w-full rounded-xl object-cover" />
      </button>
    );
  }

  if (normalizedType === 'video') {
    return (
      <button type="button" onClick={handleOpen} className={`block overflow-hidden rounded-xl ${className}`}>
        <video controls src={mediaUrl} className="max-h-64 w-full rounded-xl object-cover bg-slate-900" />
      </button>
    );
  }

  if (normalizedType === 'audio') {
    return (
      <div className={`w-64 rounded-2xl border border-slate-200 bg-slate-100 p-3 ${className}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Music4 className="h-4 w-4" />
            <span className="text-xs font-medium">Voice note</span>
          </div>
          <button type="button" onClick={handleOpen} className="rounded-full bg-indigo-600 p-2 text-white">
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
        <audio controls src={mediaUrl} className="w-full" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`flex w-64 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {normalizedType === 'document' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{normalizedType === 'document' ? 'Document' : 'Attachment'}</p>
      </div>
      <Download className="h-4 w-4 text-slate-500" />
    </button>
  );
}
