"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/controls/Button";
import { StatusBadge, type StatusTone } from "@/components/feedback/StatusBadge";
import { Badge } from "@/components/feedback/Badge";
import { Heading, Text } from "@/components/typography/Text";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { DocumentRequirement, DocumentStatus, PortalDocument } from "@/content/portal";
import {
  addUploadedDocument,
  loadUploadedDocuments,
  removeUploadedDocument,
  type UploadedDocument,
} from "@/lib/portal-storage";
import styles from "./DocumentList.module.css";

export interface DocumentListProps {
  documents: readonly PortalDocument[];
  className?: string;
}

const STATUS_TONE: Record<DocumentStatus, StatusTone> = {
  available: "success",
  awaiting: "neutral",
  "action-required": "warning",
  "under-review": "info",
};

const REQUIREMENT_LABEL: Record<DocumentRequirement, string> = {
  required: "Required",
  optional: "Optional",
};

type ModalMode =
  | { kind: null }
  | { kind: "view"; doc: PortalDocument | UploadedDocument }
  | { kind: "upload" };

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function DocumentList({ documents, className }: DocumentListProps) {
  const [uploaded, setUploaded] = useState<UploadedDocument[]>(() => loadUploadedDocuments());
  const [modal, setModal] = useState<ModalMode>({ kind: null });
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((file: File) => {
    setUploadState("loading");
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const doc: UploadedDocument = {
        id: `up-${Date.now()}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      addUploadedDocument(doc);
      setUploaded((prev) => [...prev, doc]);
      setUploadState("success");
      setModal({ kind: "view", doc });
    };
    reader.onerror = () => {
      setUploadState("error");
      setUploadError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      removeUploadedDocument(id);
      setUploaded((prev) => prev.filter((d) => d.id !== id));
      setModal({ kind: null });
    },
    [],
  );

  const handleDownload = useCallback((doc: UploadedDocument) => {
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      handleUpload(file);
    },
    [handleUpload],
  );

  const groups = groupByPurpose(documents);

  return (
    <div className={cn(styles.groups, className)}>
      <section className={styles.uploadSection} aria-label="Upload document">
        <div className={styles.uploadHeader}>
          <Heading level={3} className={styles.groupTitle}>Upload Document</Heading>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setModal({ kind: "upload" });
              setUploadState("idle");
              setUploadError("");
              fileInputRef.current?.click();
            }}
          >
            Choose File
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          className={styles.fileInput}
          onChange={handleFileChange}
          aria-label="Select a file to upload"
        />
        {uploadState === "loading" && (
          <Text variant="body-s" tone="muted" className={styles.uploadStatus}>Uploading…</Text>
        )}
        {uploadState === "success" && (
          <Text variant="body-s" tone="gold" className={styles.uploadStatus}>
            Uploaded successfully.
          </Text>
        )}
        {uploadState === "error" && (
          <Text variant="body-s" tone="default" className={styles.uploadStatus}>
            {uploadError}
          </Text>
        )}
      </section>

      {groups.map((group) => (
        <section key={group.name} className={styles.group} aria-label={group.name}>
          <Heading level={3} className={styles.groupTitle}>{group.name}</Heading>
          <ul className={styles.list}>
            {group.documents.map((doc) => (
              <li key={doc.id} className={styles.row}>
                <div className={styles.main}>
                  <span className={styles.name}>{doc.name}</span>
                  <span className={styles.meta}>
                    <StatusBadge tone={STATUS_TONE[doc.status]}>{doc.statusLabel}</StatusBadge>
                    <span className={styles.requirement}>{REQUIREMENT_LABEL[doc.requirement]}</span>
                    <span className={styles.date}>{doc.date}</span>
                  </span>
                </div>
                <div className={styles.actions}>
                  <Button variant="outline" size="sm" onClick={() => setModal({ kind: "view", doc })}>
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {uploaded.length > 0 && (
        <section className={styles.group} aria-label="Uploaded documents">
          <Heading level={3} className={styles.groupTitle}>Your uploads</Heading>
          <ul className={styles.list}>
            {uploaded.map((doc) => (
              <li key={doc.id} className={styles.row}>
                <div className={styles.main}>
                  <span className={styles.name}>{doc.name}</span>
                  <span className={styles.meta}>
                    <Badge tone="gold">Uploaded</Badge>
                    <span className={styles.requirement}>{formatBytes(doc.size)}</span>
                    <span className={styles.date}>{formatDate(doc.uploadedAt)}</span>
                  </span>
                </div>
                <div className={styles.actions}>
                  <Button variant="outline" size="sm" onClick={() => setModal({ kind: "view", doc })}>
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(doc.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {uploaded.length === 0 && groups.length === 0 && (
        <EmptyState
          title="No documents yet"
          body="Upload a document or wait for MAP Holding to release one to you."
        />
      )}

      {modal.kind === "view" && (
        <DocumentModal
          doc={modal.doc}
          isUploaded={"dataUrl" in modal.doc}
          onClose={() => setModal({ kind: null })}
          onDownload={
            "dataUrl" in modal.doc ? () => handleDownload(modal.doc as UploadedDocument) : undefined
          }
          onDelete={
            "dataUrl" in modal.doc ? () => handleDelete((modal.doc as UploadedDocument).id) : undefined
          }
        />
      )}

      {modal.kind === "upload" && (
        <div className={styles.modalBackdrop} onClick={() => setModal({ kind: null })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Heading level={3} className={styles.modalTitle}>Upload Document</Heading>
            <Text variant="body-s" tone="muted" className={styles.modalNotice}>
              Preview mode — files are stored locally in your browser only. They are not uploaded to
              any server.
            </Text>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              className={styles.modalUploadBtn}
            >
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              aria-label="Select a file to upload"
            />
            {uploadState === "loading" && (
              <Text variant="body-s" tone="muted" className={styles.uploadStatus}>Uploading…</Text>
            )}
            {uploadState === "success" && (
              <Text variant="body-s" tone="gold" className={styles.uploadStatus}>
                Uploaded successfully.
              </Text>
            )}
            {uploadState === "error" && (
              <Text variant="body-s" tone="default" className={styles.uploadStatus}>
                {uploadError}
              </Text>
            )}
            <Button variant="ghost" size="sm" onClick={() => setModal({ kind: null })} className={styles.modalClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentModal({
  doc,
  isUploaded,
  onClose,
  onDownload,
  onDelete,
}: {
  doc: PortalDocument | UploadedDocument;
  isUploaded: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}) {
  const name = isUploaded ? (doc as UploadedDocument).name : (doc as PortalDocument).name;
  const type = isUploaded
    ? (doc as UploadedDocument).type
    : "Document";
  const size = isUploaded ? formatBytes((doc as UploadedDocument).size) : null;
  const date = isUploaded
    ? formatDate((doc as UploadedDocument).uploadedAt)
    : (doc as PortalDocument).date;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHead}>
          <Heading level={3} className={styles.modalTitle}>{name}</Heading>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">&times;</button>
        </header>
        <dl className={styles.modalMeta}>
          <div className={styles.modalField}>
            <dt className={styles.modalTerm}>Type</dt>
            <dd className={styles.modalValue}>{type}</dd>
          </div>
          {size ? (
            <div className={styles.modalField}>
              <dt className={styles.modalTerm}>Size</dt>
              <dd className={styles.modalValue}>{size}</dd>
            </div>
          ) : null}
          <div className={styles.modalField}>
            <dt className={styles.modalTerm}>Date</dt>
            <dd className={styles.modalValue}>{date}</dd>
          </div>
        </dl>
        {isUploaded ? (
          <div className={styles.modalPreview}>
            {(() => {
              const d = doc as UploadedDocument;
              if (d.type?.startsWith("image/")) {
                // eslint-disable-next-line @next/next/no-img-element
                return <img src={d.dataUrl} alt={name} className={styles.modalImage} />;
              }
              if (d.type?.startsWith("text/") || d.type === "application/pdf") {
                return <iframe src={d.dataUrl} title={name} className={styles.modalIframe} />;
              }
              return (
                <div className={styles.modalFallback}>
                  <Text variant="body-s" tone="muted">
                    Preview not available for this file type. Use Download to open it.
                  </Text>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className={styles.modalFallback}>
            <Text variant="body-s" tone="muted">
              This is a sample document record. The actual file will be available once MAP Holding
              releases it.
            </Text>
          </div>
        )}
        <div className={styles.modalActions}>
          {onDownload ? (
            <Button variant="outline" size="sm" onClick={onDownload}>Download</Button>
          ) : null}
          {onDelete ? (
            <Button variant="outline" size="sm" className={styles.deleteBtn} onClick={onDelete}>
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        {!isUploaded && (
          <Text variant="body-s" tone="gold" className={styles.modalNotice}>
            Sample document — no real file is stored on a server.
          </Text>
        )}
      </div>
    </div>
  );
}

function groupByPurpose(
  documents: readonly PortalDocument[],
): { name: string; documents: PortalDocument[] }[] {
  const map = new Map<string, PortalDocument[]>();
  for (const doc of documents) {
    const bucket = map.get(doc.group);
    if (bucket) bucket.push(doc);
    else map.set(doc.group, [doc]);
  }
  return Array.from(map, ([name, docs]) => ({ name, documents: docs }));
}
