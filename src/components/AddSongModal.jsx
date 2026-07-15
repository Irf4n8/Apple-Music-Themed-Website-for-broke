import React, { useState, useRef } from 'react';
import { X, Upload, Link2, Disc } from 'lucide-react';

// Helper to parse custom lyrics (supporting standard LRC timestamps like [00:12.30] or [12.34])
const parseCustomLyrics = (rawText) => {
  if (!rawText || !rawText.trim()) return [];
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const parsedLines = [];
  
  // Regex to match:
  // 1. LRC standard: [00:12.34] text or [01:15] text
  // 2. Direct seconds in brackets: [12.34] text
  const lrcRegex = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
  const secRegex = /^\[(\d+(?:\.\d+)?)\](.*)/;
  
  let hasTimestamps = false;
  
  for (const line of lines) {
    const lrcMatch = line.match(lrcRegex);
    if (lrcMatch) {
      hasTimestamps = true;
      const minutes = parseInt(lrcMatch[1], 10);
      const seconds = parseFloat(lrcMatch[2]);
      const text = lrcMatch[3].trim();
      parsedLines.push({ time: minutes * 60 + seconds, text });
      continue;
    }
    
    const secMatch = line.match(secRegex);
    if (secMatch) {
      hasTimestamps = true;
      const seconds = parseFloat(secMatch[1]);
      const text = secMatch[2].trim();
      parsedLines.push({ time: seconds, text });
      continue;
    }
    
    // If no timestamp is found, push with time -1 to process later
    parsedLines.push({ time: -1, text: line });
  }
  
  if (hasTimestamps) {
    let lastTime = 0;
    return parsedLines
      .map((item) => {
        if (item.time === -1) {
          lastTime += 5; // Default spacing for untimestamped lines
          return { time: lastTime, text: item.text };
        }
        lastTime = item.time;
        return item;
      })
      .sort((a, b) => a.time - b.time);
  }
  
  // Default fallback: space lines evenly every 5 seconds
  return lines.map((lineText, index) => ({
    time: index * 5,
    text: lineText
  }));
};

export default function AddSongModal({ isOpen, onClose, onAddSong }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'upload'
  
  // Link Tab State
  const [songUrl, setSongUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songAlbum, setSongAlbum] = useState('');
  const [songCover, setSongCover] = useState('');
  const [songLyrics, setSongLyrics] = useState('');

  // Upload Tab State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState('Uploaded Track');
  const [uploadCoverFile, setUploadCoverFile] = useState(null);
  const [uploadCoverUrl, setUploadCoverUrl] = useState('');
  const [uploadLyrics, setUploadLyrics] = useState('');

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  if (!isOpen) return null;

  // Helper to extract artist and title from filename
  const parseFilename = (name) => {
    const cleanName = name.replace(/\.[^/.]+$/, ""); // strip extension
    const parts = cleanName.split(" - ");
    if (parts.length > 1) {
      return { artist: parts[0].trim(), title: parts[1].trim() };
    }
    return { artist: 'Unknown Artist', title: cleanName.trim() };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      const { artist, title } = parseFilename(file.name);
      setUploadTitle(title);
      setUploadArtist(artist);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadCoverFile(file);
      const localUrl = URL.createObjectURL(file);
      setUploadCoverUrl(localUrl);
    }
  };

  const handleAddLinkSong = (e) => {
    e.preventDefault();
    if (!songUrl) return;

    const lyricsData = parseCustomLyrics(songLyrics, songTitle, songArtist);

    const newSong = {
      id: 'custom-link-' + Date.now(),
      title: songTitle.trim() || 'Untitled Song',
      artist: songArtist.trim() || 'Unknown Artist',
      album: songAlbum.trim() || 'Single',
      cover: songCover.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
      url: songUrl.trim(),
      duration: 0,
      lyrics: lyricsData
    };

    onAddSong(newSong);
    resetForm();
    onClose();
  };

  const handleAddUploadSong = (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    const fileUrl = URL.createObjectURL(uploadedFile);
    const lyricsData = parseCustomLyrics(uploadLyrics, uploadTitle, uploadArtist);

    const newSong = {
      id: 'custom-upload-' + Date.now(),
      title: uploadTitle.trim() || 'Untitled Track',
      artist: uploadArtist.trim() || 'Unknown Artist',
      album: uploadAlbum.trim() || 'Local Album',
      cover: uploadCoverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      url: fileUrl,
      duration: 0,
      lyrics: lyricsData
    };

    onAddSong(newSong);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSongUrl('');
    setSongTitle('');
    setSongArtist('');
    setSongAlbum('');
    setSongCover('');
    setSongLyrics('');
    setUploadedFile(null);
    setUploadTitle('');
    setUploadArtist('');
    setUploadAlbum('Uploaded Track');
    setUploadCoverFile(null);
    setUploadCoverUrl('');
    setUploadLyrics('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Add Music to Library</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <Link2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Paste Audio Link
          </button>
          <button 
            className={`modal-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Upload Song File
          </button>
        </div>

        {/* Tab 1: Paste Audio Link */}
        {activeTab === 'link' && (
          <form onSubmit={handleAddLinkSong}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Audio File URL or YouTube Link*</label>
                <input 
                  type="url" 
                  required 
                  className="form-input" 
                  placeholder="https://example.com/song.mp3 or youtube.com/watch?v=..."
                  value={songUrl}
                  onChange={(e) => setSongUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Song Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Starboy"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Artist</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. The Weeknd"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Album</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Starboy Album"
                  value={songAlbum}
                  onChange={(e) => setSongAlbum(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Art Image URL</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://example.com/cover.jpg"
                  value={songCover}
                  onChange={(e) => setSongCover(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lyrics (Optional - Paste text line-by-line)</label>
                <textarea 
                  className="form-input" 
                  placeholder="Paste lyrics here. We will auto-sync them for playback!"
                  rows="4"
                  value={songLyrics}
                  onChange={(e) => setSongLyrics(e.target.value)}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!songUrl}>Add Song</button>
            </div>
          </form>
        )}

        {/* Tab 2: Upload Song File */}
        {activeTab === 'upload' && (
          <form onSubmit={handleAddUploadSong}>
            <div className="modal-body">
              {/* File Dropzone */}
              <div 
                className="dropzone"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={28} style={{ color: 'var(--apple-accent)' }} />
                {uploadedFile ? (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{uploadedFile.name}</p>
                    <p style={{ fontSize: '0.78rem' }}>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Drag & Drop or Click to Upload</p>
                    <p style={{ fontSize: '0.76rem' }}>Supports MP3, WAV, M4A, OGG</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="audio/*" 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {uploadedFile && (
                <>
                  <div className="form-group">
                    <label className="form-label">Song Title*</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      placeholder="e.g. My Custom Track"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Artist</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Me"
                      value={uploadArtist}
                      onChange={(e) => setUploadArtist(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Album</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={uploadAlbum}
                      onChange={(e) => setUploadAlbum(e.target.value)}
                    />
                  </div>

                  {/* Optional Custom Cover Upload */}
                  <div className="form-group">
                    <label className="form-label">Upload Cover Art (Optional)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div 
                        onClick={() => coverInputRef.current.click()}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-app)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {uploadCoverUrl ? (
                          <img src={uploadCoverUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Disc size={20} style={{ color: 'var(--text-tertiary)', margin: 'auto' }} />
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => coverInputRef.current.click()}
                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      >
                        Choose Image
                      </button>
                      <input 
                        type="file" 
                        ref={coverInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={handleCoverChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lyrics (Optional - Paste text line-by-line)</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Paste lyrics here. We will auto-sync them for playback!"
                      rows="4"
                      value={uploadLyrics}
                      onChange={(e) => setUploadLyrics(e.target.value)}
                      style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!uploadedFile}>Add Song</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
