/**
 * Digital Lecturer Engine - Document Uploader Component
 */

import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Info, Trash2 } from 'lucide-react';
import { SourceLevel, RegisteredDocument, SOURCE_HIERARCHY_DEFINITIONS } from '../../types/source';
import { extractDocumentContent } from '../../services/documentService/textExtractor';

interface DocumentUploaderProps {
  documents: RegisteredDocument[];
  onUploadSuccess: () => void;
  onDeleteDocument: (sourceId: string) => void;
  loading: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onUploadSuccess,
  onDeleteDocument,
  loading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLevel, setSourceLevel] = useState<SourceLevel>(1);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('2026');
  const [publisher, setPublisher] = useState('');
  const [rawText, setRawText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<RegisteredDocument | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (inputMode === 'file' && !selectedFile) {
      setErrorMsg('Vui lòng chọn tệp tài liệu (DOCX, PPTX, PDF, TXT, MD).');
      return;
    }
    if (inputMode === 'text' && !rawText.trim()) {
      setErrorMsg('Vui lòng nhập nội dung văn bản trích xuất.');
      return;
    }

    setIsSubmitting(true);

    try {
      let payload: any = {
        filename: selectedFile ? selectedFile.name : `${title || 'document'}.txt`,
        sourceLevel,
        title: title || (selectedFile ? selectedFile.name : 'Tài liệu học phần'),
        author: author || 'Bộ môn / Tác giả',
        year: year || '2026',
        publisher: publisher || 'Khoa / Nhà xuất bản'
      };

      if (inputMode === 'file' && selectedFile) {
        // Read file as ArrayBuffer
        const buffer = await selectedFile.arrayBuffer();

        // Extract text and slide structure directly in the browser
        // This eliminates sending huge multi-megabyte media payloads across HTTP/Ingress proxies
        try {
          const extracted = await extractDocumentContent(selectedFile.name, buffer);
          payload.rawText = extracted.text;
          payload.documentType = extracted.documentType;
          payload.slideCount = extracted.slideCount;
          payload.pageCount = extracted.pageCount;
          payload.slides = extracted.slides;
          payload.fileSize = selectedFile.size;
        } catch (extractErr) {
          console.warn('[Uploader] Client-side extraction error, falling back to base64 transmission:', extractErr);
          // Only send base64 if file is small (< 15MB) to avoid Nginx/proxy 413 limits
          if (selectedFile.size < 15 * 1024 * 1024) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
            }
            payload.base64Data = btoa(binary);
          } else {
            throw new Error(`Tệp "${selectedFile.name}" (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) không thể tự động bóc tách trên trình duyệt. Vui lòng thử lại với tệp khác.`);
          }
        }
      } else {
        payload.rawText = rawText;
      }

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Tải tài liệu thất bại';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } else {
            const rawBody = await res.text();
            if (res.status === 413) {
              errMsg = 'Dung lượng tệp/dữ liệu gửi lên vượt quá giới hạn của máy chủ (413 Payload Too Large). Vui lòng thử lại với tệp nhỏ hơn.';
            } else if (res.status === 502 || res.status === 503 || res.status === 504) {
              errMsg = `Dịch vụ máy chủ đang bận hoặc phản hồi chậm (HTTP ${res.status}). Vui lòng thử lại sau giây lát.`;
            } else {
              errMsg = `Máy chủ phản hồi mã ${res.status}: ${rawBody.slice(0, 120)}`;
            }
          }
        } catch {
          errMsg = `Không thể xử lý phản hồi từ máy chủ (HTTP ${res.status})`;
        }
        throw new Error(errMsg);
      }

      setSuccessMsg(`Đã tiếp nhận và đăng ký nguồn thành công cấp độ ${sourceLevel}.`);
      setSelectedFile(null);
      setRawText('');
      setTitle('');
      onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xử lý tài liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-slate-300">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              Cơ chế Quản trị Nguồn & Phân tầng Thẩm quyền (Source Hierarchy Levels 1-7)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống Digital Lecturer hoạt động trên nguyên tắc <strong>bảo toàn xuất xứ (provenance)</strong>. Mọi tài liệu nạp vào phải được phân định cấp bậc rõ ràng. Tuyệt đối không thay thế ngầm đề cương bằng giáo trình, hay thay thế giáo trình bằng slide bài giảng.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Tiếp nhận & Đăng ký Tài liệu Mới</span>
            </h4>
            <div className="flex text-xs bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-2.5 py-1 rounded-md transition ${inputMode === 'file' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
              >
                Tệp tin
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-2.5 py-1 rounded-md transition ${inputMode === 'text' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
              >
                Nhập văn bản
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Level Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cấp độ Thẩm quyền Nguồn (Source Level 1-7) *
              </label>
              <select
                value={sourceLevel}
                onChange={e => setSourceLevel(Number(e.target.value) as SourceLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(SOURCE_HIERARCHY_DEFINITIONS).map(def => (
                  <option key={def.level} value={def.level}>
                    Cấp {def.level}: {def.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-indigo-300/80 bg-indigo-950/30 p-2 rounded border border-indigo-900/50">
                <strong>Vai trò:</strong> {SOURCE_HIERARCHY_DEFINITIONS[sourceLevel].description}
              </p>
            </div>

            {/* File or Text Input */}
            {inputMode === 'file' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chọn tệp tài liệu (DOCX, PPTX, PDF, TXT, MD) *
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-lg p-4 text-center bg-slate-950/40 transition">
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".docx,.pptx,.pdf,.txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 font-medium">
                      {selectedFile ? selectedFile.name : 'Bấm để duyệt tệp từ máy tính'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Hỗ trợ Word DOCX, PowerPoint PPTX, PDF, Markdown, TXT
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nội dung trích xuất / Văn bản nguồn *
                </label>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={5}
                  placeholder="Dán nội dung đề cương, giáo trình hoặc văn bản quy định tại đây..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Document Metadata Fields */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">Tiêu đề tài liệu chính thức *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Giáo trình Hệ thống Phân tán Nâng cao"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400">Tác giả / Cơ quan ban hành</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Ví dụ: GS. Nguyễn Thanh Bình"
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400">Năm xuất bản / Hiệu lực</label>
                  <input
                    type="text"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400">Nhà xuất bản / Đơn vị thẩm định</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={e => setPublisher(e.target.value)}
                  placeholder="Ví dụ: NXB Đại học Quốc gia / Hội đồng Khoa học"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-md text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-md text-xs text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang trích xuất & đăng ký...</span>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Trích xuất & Đăng ký Nguồn (Level {sourceLevel})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Registered Documents Table & Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Danh mục Nguồn đã Đăng ký ({documents.length} tài liệu)
                </h4>
                <p className="text-xs text-slate-400">
                  Sắp xếp theo thứ bậc thẩm quyền Level 1 → Level 7
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {documents.map(doc => {
                const def = SOURCE_HIERARCHY_DEFINITIONS[doc.sourceLevel];
                return (
                  <div
                    key={doc.sourceId}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                          {doc.sourceId}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          doc.sourceLevel === 1 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          doc.sourceLevel === 2 ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          doc.sourceLevel === 3 ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          doc.sourceLevel === 4 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          Cấp {doc.sourceLevel}: {def.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {doc.documentType}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-white">
                        {doc.title}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {doc.author} ({doc.year}) &bull; {doc.publisher} &bull; {doc.filename}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
                      >
                        Xem văn bản
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.sourceId)}
                        title="Xóa nguồn"
                        className="text-xs p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {documents.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Chưa có tài liệu nào được đăng ký. Hãy tải lên tệp hoặc nạp gói bài giảng chuẩn 1MĐ1.
                </div>
              )}
            </div>
          </div>

          {/* Modal to view extracted text */}
          {viewingDoc && (
            <div className="bg-slate-900 border border-indigo-900/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{viewingDoc.sourceId}</span>
                  <span className="text-xs font-semibold text-white">{viewingDoc.title}</span>
                </div>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                >
                  Đóng
                </button>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {viewingDoc.extractedText}
                </pre>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Dung lượng: {viewingDoc.metadata.fileSize} bytes</span>
                <span>Thời gian trích xuất: {new Date(viewingDoc.metadata.extractedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
