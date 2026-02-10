
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { EditHistoryItem, EditMode, ToolConfig, AspectRatio, Unit } from './types';
import { TOOLS, ASPECT_RATIOS, BEAUTY_PRESETS } from './constants';
import { editImageWithGemini } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';
import HistorySidebar from './components/HistorySidebar';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeTool, setActiveTool] = useState<ToolConfig>(TOOLS[0]);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  
  // Viewport State (Zoom & Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Brush State
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasMaskData, setHasMaskData] = useState(false);

  // Scene Composer / Face Swap State
  const [sourceFaceImage, setSourceFaceImage] = useState<string | null>(null);
  const [composerAssets, setComposerAssets] = useState<string[]>([]);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const currentImage = useMemo(() => {
    if (historyIndex >= 0 && historyIndex < history.length) {
      return history[historyIndex].url;
    }
    return null;
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  const imgRef = useRef<HTMLImageElement>(null);
  const isBrushTool = [EditMode.REMOVE, EditMode.ADD_OBJECT, EditMode.BEAUTY, EditMode.FACE_SWAP].includes(activeTool.id);

  useEffect(() => {
    clearMask();
  }, [activeTool.id, currentImage]);

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasMaskData(false);
    }
  };

  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!currentImage) return;
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(scale + delta * zoomSpeed * scale, 0.1), 10);
    
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = (mouseX - position.x) / scale;
      const dy = (mouseY - position.y) / scale;
      const newX = mouseX - dx * newScale;
      const newY = mouseY - dy * newScale;
      setScale(newScale);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentImage || e.button !== 0) return;
    if (isSpacePressed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (isBrushTool) {
      setIsDrawing(true);
      draw(e);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (isDrawing && isBrushTool && !isSpacePressed) {
      draw(e);
    }
  };

  const draw = (e: React.MouseEvent) => {
    const canvas = maskCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.fillStyle = '#ff0000';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasMaskData(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDrawing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
        if (e.repeat) return;
        e.preventDefault();
      }
      if (isBrushTool && !isSpacePressed) {
        if (e.key === '[') setBrushSize(prev => Math.max(prev - 5, 5));
        if (e.key === ']') setBrushSize(prev => Math.min(prev + 5, 150));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.shiftKey ? redo() : undo();
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); handleResetView(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, isBrushTool, isSpacePressed]);

  const [expandMode, setExpandMode] = useState<'preset' | 'custom'>('preset');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [customWidth, setCustomWidth] = useState<string>('1920');
  const [customHeight, setCustomHeight] = useState<string>('1080');
  const [unit, setUnit] = useState<Unit>('px');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculatedAspectRatio = useMemo((): AspectRatio => {
    if (expandMode === 'preset') return selectedRatio;
    const w = parseFloat(customWidth), h = parseFloat(customHeight);
    // Fix: Corrected typo 'iiisNaN' to 'isNaN'
    if (isNaN(w) || isNaN(h) || h === 0) return '1:1';
    const r = w / h;
    if (Math.abs(r - 1) < 0.1) return '1:1';
    if (Math.abs(r - (16/9)) < 0.1) return '16:9';
    if (Math.abs(r - (9/16)) < 0.1) return '9:16';
    if (Math.abs(r - (4/3)) < 0.1) return '4:3';
    if (Math.abs(r - (3/4)) < 0.1) return '3:4';
    return r >= 1.5 ? '16:9' : r >= 1.2 ? '4:3' : r >= 0.8 ? '1:1' : r >= 0.65 ? '3:4' : '9:16';
  }, [expandMode, selectedRatio, customWidth, customHeight]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const result = re.target?.result as string;
        setSourceImage(result);
        setHistory([{ id: 'original', url: result, prompt: 'Original Image', timestamp: Date.now() }]);
        setHistoryIndex(0); setError(null); handleResetView();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setSourceFaceImage(re.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (re) => {
          setComposerAssets(prev => [...prev, re.target?.result as string].slice(-4));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const getMaskedImageBase64 = (): string | null => {
    const img = imgRef.current, maskCanvas = maskCanvasRef.current;
    if (!img || !maskCanvas) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0); ctx.globalAlpha = 1.0;
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const downloadImage = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage; link.download = `nisal-ai-${Date.now()}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleApplyEdit = async () => {
    if (!currentImage) return setError("Please upload an image first.");
    if (activeTool.id === EditMode.FACE_SWAP && !sourceFaceImage) return setError("Please upload a source face image first.");
    if (activeTool.id === EditMode.COMPOSER && composerAssets.length === 0) return setError("Please upload at least one additional photo to merge.");
    if (isBrushTool && !hasMaskData) return setError(`Please brush over the target area.`);
    
    const isPromptRequired = ![EditMode.EXPAND, EditMode.REMOVE, EditMode.FACE_SWAP].includes(activeTool.id);
    if (!prompt.trim() && isPromptRequired) return setError(`Please provide instructions.`);

    setIsProcessing(true); setError(null);
    try {
      let inputImageBase64 = currentImage;
      if (isBrushTool) {
        const masked = getMaskedImageBase64();
        if (masked) inputImageBase64 = masked;
      }

      const ratio = activeTool.id === EditMode.EXPAND ? calculatedAspectRatio : undefined;
      const userPrompt = prompt.trim() || (
        activeTool.id === EditMode.REMOVE ? "Remove objects highlighted in red." : 
        activeTool.id === EditMode.FACE_SWAP ? "Swap face using the provided source." : ""
      );

      const additionalImages = activeTool.id === EditMode.FACE_SWAP 
        ? [sourceFaceImage!] 
        : activeTool.id === EditMode.COMPOSER 
          ? composerAssets 
          : undefined;
      
      const editedBase64 = await editImageWithGemini(
        inputImageBase64, 
        userPrompt, 
        activeTool.systemPrompt || '', 
        ratio, 
        additionalImages
      );
      
      const newItem: EditHistoryItem = {
        id: Math.random().toString(36).substring(7),
        url: editedBase64,
        prompt: prompt || activeTool.name,
        timestamp: Date.now(),
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newItem);
      setHistory(newHistory); setHistoryIndex(newHistory.length - 1);
      setPrompt(''); clearMask();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <i className="fa-solid fa-camera-retro text-white text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Nisal</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Ai photo studio</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Edit Toolkit</h3>
            <div className="grid grid-cols-1 gap-1">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool); setError(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    activeTool.id === tool.id 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <i className={`fa-solid ${tool.icon} w-5 text-center`}></i>
                  <span className="font-medium">{tool.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-inner">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <i className={`fa-solid ${activeTool.icon} text-indigo-400 text-xs`}></i>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">{activeTool.name}</h4>
              </div>
            </div>
            
            {activeTool.id === EditMode.FACE_SWAP && (
              <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">Upload Source Face</label>
                  <div 
                    onClick={() => faceInputRef.current?.click()}
                    className="relative aspect-square w-full bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden"
                  >
                    {sourceFaceImage ? (
                      <img src={sourceFaceImage} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <i className="fa-solid fa-user-plus text-slate-700 text-2xl group-hover:text-indigo-500 transition-colors mb-2"></i>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-center px-4">Click to Upload Face</span>
                      </>
                    )}
                    <input type="file" ref={faceInputRef} onChange={handleFaceUpload} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>
            )}

            {activeTool.id === EditMode.COMPOSER && (
              <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Additional Photos</label>
                    <span className="text-[9px] font-bold text-slate-500">{composerAssets.length}/4</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {composerAssets.map((asset, idx) => (
                      <div key={idx} className="relative aspect-square bg-slate-900 rounded-lg border border-slate-700 overflow-hidden group">
                        <img src={asset} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setComposerAssets(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fa-solid fa-times text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                    
                    {composerAssets.length < 4 && (
                      <button 
                        onClick={() => assetInputRef.current?.click()}
                        className="aspect-square bg-slate-900 rounded-lg border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center group"
                      >
                        <i className="fa-solid fa-plus text-slate-600 group-hover:text-indigo-400"></i>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Add</span>
                        <input type="file" ref={assetInputRef} onChange={handleAssetUpload} accept="image/*" className="hidden" multiple />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTool.id === EditMode.EXPAND && (
              <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-inner">
                  <button onClick={() => setExpandMode('preset')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${expandMode === 'preset' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Presets</button>
                  <button onClick={() => setExpandMode('custom')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${expandMode === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Custom</button>
                </div>
                {expandMode === 'preset' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Aspect Ratio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button key={ratio.value} onClick={() => setSelectedRatio(ratio.value)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedRatio === ratio.value ? 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>{ratio.label}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Width</label>
                        <input type="number" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Height</label>
                        <input type="number" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isBrushTool && (
              <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brush Size</label>
                    <span className="text-[10px] font-black text-indigo-400">{brushSize}px</span>
                  </div>
                  <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
                {activeTool.id === EditMode.BEAUTY && (
                  <div className="space-y-4">
                    {Object.entries(BEAUTY_PRESETS).map(([category, options]) => (
                      <div key={category} className="space-y-1.5">
                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">{category}</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((opt) => (
                            <button key={opt.label} onClick={() => setPrompt(opt.prompt)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${prompt === opt.prompt ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={clearMask} className="w-full py-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all uppercase tracking-widest">Clear Selection</button>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mb-4 px-1 leading-relaxed">{activeTool.description}</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTool.placeholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all min-h-[100px] resize-none"
            />
            
            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 animate-in slide-in-from-bottom-1">
                <i className="fa-solid fa-circle-exclamation text-red-400 text-xs mt-0.5"></i>
                <p className="text-[11px] text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleApplyEdit}
              disabled={isProcessing || !sourceImage}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                isProcessing || !sourceImage ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? <><i className="fa-solid fa-circle-notch animate-spin"></i><span>Processing</span></> : <><i className="fa-solid fa-wand-magic-sparkles"></i><span>Generate</span></>}
            </button>
          </section>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-slate-500 hover:text-indigo-400 transition-all">
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span className="text-xs font-bold uppercase tracking-widest">New Canvas</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-xl flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Studio</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700 mr-2">
               <button onClick={undo} disabled={historyIndex <= 0 || isProcessing} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20"><i className="fa-solid fa-rotate-left text-xs"></i></button>
               <button onClick={redo} disabled={historyIndex >= history.length - 1 || isProcessing} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20"><i className="fa-solid fa-rotate-right text-xs"></i></button>
            </div>
            <button onClick={downloadImage} disabled={!currentImage || isProcessing} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-white/5 disabled:opacity-30">
              <i className="fa-solid fa-file-export"></i>Export
            </button>
          </div>
        </header>

        <main 
          ref={viewportRef} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          className={`flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 ${isSpacePressed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : (isBrushTool ? 'cursor-none' : currentImage ? 'cursor-grab' : 'cursor-default')}`}
        >
          {isProcessing && <LoadingOverlay message="Neural Synthesis..." />}
          {currentImage ? (
            <div className="relative transition-transform duration-75 ease-out select-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
              <img ref={imgRef} src={currentImage} alt="Canvas" draggable={false} className="max-w-none rounded-sm shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-slate-800" onLoad={(e) => {
                if (maskCanvasRef.current) { maskCanvasRef.current.width = e.currentTarget.naturalWidth; maskCanvasRef.current.height = e.currentTarget.naturalHeight; }
              }} />
              <canvas ref={maskCanvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${isBrushTool ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 z-10">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-800 shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)] group hover:scale-105 transition-transform cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <i className="fa-solid fa-images text-slate-700 text-4xl group-hover:text-indigo-500 transition-colors"></i>
              </div>
              <h2 className="text-3xl font-black mb-4 text-white tracking-tight uppercase">Nisal Ai photo studio</h2>
              <p className="text-slate-500 text-sm mb-10 max-w-xs font-medium">Upload a photo for generative fill, face swapping, or multi-photo merging.</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95">Start Editing</button>
            </div>
          )}
          {isBrushTool && currentImage && !isSpacePressed && (
            <div className="absolute pointer-events-none rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.5)] z-50 mix-blend-difference" style={{ width: `${brushSize * scale}px`, height: `${brushSize * scale}px`, left: `${mousePos.x}px`, top: `${mousePos.y}px`, transform: 'translate(-50%, -50%)', opacity: 0.8 }} />
          )}
        </main>
      </div>
      <HistorySidebar history={[...history].reverse()} onSelect={(item) => !isProcessing && setHistoryIndex(history.findIndex(h => h.id === item.id))} activeId={history[historyIndex]?.id} isCollapsed={isHistoryCollapsed} onToggle={() => setIsHistoryCollapsed(!isHistoryCollapsed)} />
    </div>
  );
};

export default App;
