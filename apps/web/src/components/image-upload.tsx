"use client";

import { useCallback, useRef, useState } from "react";
import {
  PLATFORM_MEDIA_SPECS,
  matchAspectRatio,
  getEffectiveMaxSizeMB,
  formatAcceptedTypes,
} from "@/lib/platform-media-specs";

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  uploading: boolean;
  error?: string;
}

interface ImageUploadProps {
  platform: string;
  onUpload: (url: string) => void;
  onRemove?: (url: string) => void;
  maxFiles?: number;
}

export function ImageUpload({
  platform,
  onUpload,
  onRemove,
  maxFiles = 1,
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const spec = PLATFORM_MEDIA_SPECS[platform];

  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!spec) return `No media spec found for platform: ${platform}`;

      // Check file type
      if (!spec.formats.includes(file.type)) {
        return `Invalid file type: ${file.type}. Accepted: ${formatAcceptedTypes(spec.formats)}`;
      }

      // Check file size
      const effectiveMax = getEffectiveMaxSizeMB(platform, file.type);
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > effectiveMax) {
        return `File too large (${fileSizeMB.toFixed(1)}MB). Max: ${effectiveMax}MB`;
      }

      // Check image dimensions / aspect ratio for image types
      if (file.type.startsWith("image/")) {
        try {
          const dimensions = await getImageDimensions(file);
          const matched = matchAspectRatio(
            dimensions.width,
            dimensions.height,
            spec.ratios,
          );
          if (!matched) {
            const allowed = spec.ratios.map((r) => r.label).join(", ");
            const actual = (dimensions.width / dimensions.height).toFixed(2);
            return `Invalid aspect ratio (${actual}). Allowed: ${allowed}`;
          }
        } catch {
          return "Could not read image dimensions";
        }
      }

      return null;
    },
    [spec, platform],
  );

  const processFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming);
      const remaining = maxFiles - files.length;
      if (remaining <= 0) return;

      const toProcess = fileArray.slice(0, remaining);

      for (const file of toProcess) {
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        const entry: UploadedFile = {
          id,
          file,
          previewUrl,
          uploading: true,
        };

        setFiles((prev) => [...prev, entry]);

        // Validate
        const validationError = await validateFile(file);
        if (validationError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, uploading: false, error: validationError } : f,
            ),
          );
          continue;
        }

        // Upload
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("name", file.name);
          formData.append("type", file.type.startsWith("video/") ? "VIDEO" : "IMAGE");
          formData.append("tags", JSON.stringify([platform.toLowerCase()]));

          const res = await fetch("/api/creatives", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: "Upload failed" }));
            throw new Error(body.error ?? `Upload failed (${res.status})`);
          }

          const creative = await res.json();
          const url = creative.r2Url as string;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, uploading: false, uploadedUrl: url } : f,
            ),
          );
          onUpload(url);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, uploading: false, error: message } : f,
            ),
          );
        }
      }
    },
    [files.length, maxFiles, validateFile, onUpload, platform],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const target = prev.find((f) => f.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
          if (target.uploadedUrl) {
            onRemove?.(target.uploadedUrl);
          }
        }
        return prev.filter((f) => f.id !== id);
      });
    },
    [onRemove],
  );

  const canAddMore = files.length < maxFiles;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Platform requirements */}
      {spec && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-tertiary)",
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
            {platform.replaceAll("_", " ")} media requirements
          </div>
          <div>Formats: {formatAcceptedTypes(spec.formats)}</div>
          <div>Max size: {spec.maxSizeMB}MB{spec.notes ? ` (${spec.notes})` : ""}</div>
          <div>Aspect ratios: {spec.ratios.map((r) => r.label).join(", ")}</div>
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "32px 16px",
            borderRadius: "8px",
            border: `2px dashed ${dragOver ? "var(--accent-primary)" : "var(--border-primary)"}`,
            background: dragOver ? "var(--bg-tertiary)" : "var(--bg-secondary)",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-tertiary)" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Drag & drop or click to upload
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            {files.length}/{maxFiles} file{maxFiles > 1 ? "s" : ""}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={spec?.formats.join(",") ?? "image/*"}
            multiple={maxFiles > 1}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Previews */}
      {files.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                position: "relative",
                borderRadius: "8px",
                border: `1px solid ${f.error ? "var(--danger)" : "var(--border-primary)"}`,
                background: "var(--bg-secondary)",
                overflow: "hidden",
              }}
            >
              {/* Preview image */}
              {f.file.type.startsWith("image/") ? (
                <img
                  src={f.previewUrl}
                  alt={f.file.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    display: "block",
                    opacity: f.uploading ? 0.5 : 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-tertiary)",
                    fontSize: "12px",
                  }}
                >
                  {f.file.type.startsWith("video/") ? "VIDEO" : "FILE"}
                </div>
              )}

              {/* Loading overlay */}
              {f.uploading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.4)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "image-upload-spin 0.6s linear infinite",
                    }}
                  />
                </div>
              )}

              {/* Remove button */}
              {!f.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  aria-label="Remove file"
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              )}

              {/* Error */}
              {f.error && (
                <div
                  style={{
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: "var(--danger)",
                    background: "var(--bg-secondary)",
                    borderTop: "1px solid var(--danger)",
                    lineHeight: 1.3,
                  }}
                >
                  {f.error}
                </div>
              )}

              {/* File name */}
              {!f.error && (
                <div
                  style={{
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.file.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`
        @keyframes image-upload-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/** Read image dimensions from a File using createImageBitmap (with Image fallback). */
function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof createImageBitmap === "function") {
      createImageBitmap(file)
        .then((bmp) => {
          resolve({ width: bmp.width, height: bmp.height });
          bmp.close();
        })
        .catch(reject);
    } else {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("Failed to load image"));
      };
      img.src = URL.createObjectURL(file);
    }
  });
}
