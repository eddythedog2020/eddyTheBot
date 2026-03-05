"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Load extra languages if needed, e.g. python, bash, json
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";

export type ArtifactType = "code" | "markdown" | "table";

export interface Artifact {
    id: string;
    type: ArtifactType;
    title: string;
    language?: string;
    content: string;
}

interface ArtifactPanelProps {
    artifact: Artifact | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ArtifactPanel({ artifact, isOpen, onClose }: ArtifactPanelProps) {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<"code" | "preview">("code");
    const [width, setWidth] = useState(600);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const isMarkdown = artifact?.type === "markdown" || artifact?.language?.toLowerCase() === "markdown";
    const isTable = artifact?.type === "table";
    const isHtml = artifact?.type === "code" && artifact?.language?.toLowerCase() === "html";
    const showTabs = isMarkdown || isHtml || isTable;

    useEffect(() => {
        if (artifact) {
            setViewMode(isMarkdown || isHtml || isTable ? "preview" : "code");
        }
    }, [artifact?.id, isMarkdown, isHtml]);

    useEffect(() => {
        if (isOpen && artifact && viewMode === "code") {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isOpen, artifact, viewMode]);

    // Drag-to-resize handlers
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startX.current = e.clientX;
        startWidth.current = width;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (ev: MouseEvent) => {
            if (!isDragging.current) return;
            const delta = startX.current - ev.clientX; // dragging left = bigger
            const newWidth = Math.min(900, Math.max(320, startWidth.current + delta));
            setWidth(newWidth);
        };

        const onMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    if (!isOpen || !artifact) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(artifact.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([artifact.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        let ext = artifact.language?.toLowerCase() || "txt";
        if (ext === "markdown") ext = "md";

        let filename = artifact.title
            ? artifact.title.replace(/[^a-z0-9_]/gi, '_').toLowerCase()
            : "artifact";

        a.download = `${filename}.${ext}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="artifact-panel flex flex-col h-full bg-[#0a0a0a] border-l border-[var(--border-glass)] overflow-hidden shrink-0 transform transition-transform duration-300 ease-in-out z-10 relative"
            style={{ width: `${width}px` }}
        >
            {/* Drag handle on the left edge */}
            <div
                onMouseDown={onMouseDown}
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 group"
                title="Drag to resize"
            >
                {/* Visual indicator line */}
                <div className="absolute inset-0 bg-transparent group-hover:bg-blue-500/40 transition-colors duration-150" />
            </div>

            <div className="artifact-toolbar flex items-center justify-between border-b border-[var(--border-glass)] bg-[#111]" style={{ padding: '16px 24px' }}>
                <div className="flex items-center gap-3 overflow-hidden">
                    {isTable ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/50 shrink-0">
                            <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm8.26 9.52v-3.5H5.75v3.5h3.5zm1.5 0h3.5v-3.5h-3.5v3.5zm3.5-5v-3.5h-3.5v3.5h3.5zm-5 0v-3.5H5.75v3.5h3.5z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/50 shrink-0">
                            <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="text-sm font-medium text-white/90 truncate">{artifact.title}</span>
                    {artifact.language && !isTable && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                            {artifact.language}
                        </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40">
                        {artifact.content.split('\n').length} lines
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleCopy} className="hover:bg-white/10 transition-colors" title="Copy code" style={{ padding: '6px', borderRadius: '4px' }}>
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-400">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
                                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                            </svg>
                        )}
                    </button>
                    <button onClick={handleDownload} className="hover:bg-white/10 transition-colors" title="Download file" style={{ padding: '6px', borderRadius: '4px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
                            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v6.879l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M3 14.75A.75.75 0 013.75 14h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 14.75z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="w-[1px] h-4 bg-white/20 mx-2"></div>
                    <button onClick={onClose} className="hover:bg-white/10 hover:text-red-400 transition-colors" title="Close panel" style={{ padding: '6px', borderRadius: '4px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            </div>
            {showTabs && (
                <div className="flex items-center border-b border-[var(--border-glass)] bg-[#0a0a0a] flex-shrink-0" style={{ padding: '0 24px', gap: '24px' }}>
                    <button
                        onClick={() => setViewMode("preview")}
                        className={`font-medium border-b-2 transition-colors ${viewMode === "preview"
                            ? "border-blue-500 text-white"
                            : "border-transparent text-white/50 hover:text-white/80"
                            }`}
                        style={{ padding: '12px 0', fontSize: '14px' }}
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => setViewMode("code")}
                        className={`font-medium border-b-2 transition-colors ${viewMode === "code"
                            ? "border-blue-500 text-white"
                            : "border-transparent text-white/50 hover:text-white/80"
                            }`}
                        style={{ padding: '12px 0', fontSize: '14px' }}
                    >
                        Code
                    </button>
                </div>
            )}
            <div className={`flex-1 overflow-auto ${viewMode === "preview" && isHtml ? "bg-white" : "bg-[#0a0a0a]"}`}>
                {viewMode === "preview" ? (
                    isTable ? (() => {
                        // Parse markdown table content into rows
                        const tableLines = artifact.content.split('\n').filter((l: string) => l.trim().startsWith('|'));
                        const dataLines = tableLines.filter((l: string) => !/^\|[\s\-:|]+\|$/.test(l.trim()));
                        const rows = dataLines.map((l: string) =>
                            l.trim().slice(1, -1).split('|').map((c: string) => c.trim())
                        );
                        const headers = rows[0] || [];
                        const bodyRows = rows.slice(1);

                        return (
                            <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Spreadsheet toolbar */}
                                <div style={{
                                    padding: '8px 16px', background: '#111',
                                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                                    flexShrink: 0,
                                }}>
                                    <span>{bodyRows.length} rows × {headers.length} columns</span>
                                </div>
                                {/* Spreadsheet grid */}
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    <table style={{
                                        width: '100%', borderCollapse: 'collapse',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                        fontSize: '12px', lineHeight: '1.4',
                                    }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                            <tr>
                                                {/* Row number header */}
                                                <th style={{
                                                    width: '48px', minWidth: '48px',
                                                    padding: '8px 6px', textAlign: 'center',
                                                    background: '#1a1a1a',
                                                    borderBottom: '2px solid rgba(255,255,255,0.12)',
                                                    borderRight: '2px solid rgba(255,255,255,0.1)',
                                                    color: 'rgba(255,255,255,0.3)',
                                                    fontSize: '10px', fontWeight: 500,
                                                    position: 'sticky', left: 0, zIndex: 3,
                                                }}>#</th>
                                                {headers.map((h: string, ci: number) => (
                                                    <th key={ci} style={{
                                                        padding: '8px 14px', textAlign: 'left',
                                                        fontWeight: 600, fontSize: '11px',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        background: '#1a1a1a',
                                                        borderBottom: '2px solid rgba(255,255,255,0.12)',
                                                        borderRight: '1px solid rgba(255,255,255,0.06)',
                                                        whiteSpace: 'nowrap',
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bodyRows.map((row: string[], ri: number) => (
                                                <tr key={ri}
                                                    style={{ transition: 'background 0.08s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {/* Row number */}
                                                    <td style={{
                                                        padding: '6px 6px', textAlign: 'center',
                                                        color: 'rgba(255,255,255,0.2)',
                                                        background: '#0f0f0f',
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        borderRight: '2px solid rgba(255,255,255,0.1)',
                                                        fontSize: '10px', fontWeight: 400,
                                                        position: 'sticky', left: 0,
                                                        userSelect: 'none',
                                                    }}>{ri + 1}</td>
                                                    {row.map((cell: string, ci: number) => (
                                                        <td key={ci} style={{
                                                            padding: '6px 14px',
                                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                            borderRight: '1px solid rgba(255,255,255,0.04)',
                                                            color: 'rgba(255,255,255,0.85)',
                                                            whiteSpace: 'nowrap',
                                                            cursor: 'cell',
                                                        }}
                                                            onClick={(e) => {
                                                                const el = e.currentTarget;
                                                                // Brief highlight effect
                                                                el.style.background = 'rgba(59,130,246,0.15)';
                                                                el.style.outline = '1px solid rgba(59,130,246,0.5)';
                                                                setTimeout(() => {
                                                                    el.style.background = '';
                                                                    el.style.outline = '';
                                                                }, 1500);
                                                                // Copy cell value
                                                                navigator.clipboard.writeText(cell);
                                                            }}
                                                            title="Click to copy cell value"
                                                        >{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()
                        : isMarkdown ? (
                            <div className="prose prose-invert max-w-none" style={{ padding: '48px 40px 40px 40px' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
                            </div>
                        ) : isHtml ? (
                            <iframe
                                srcDoc={artifact.content}
                                sandbox="allow-scripts"
                                className="w-full h-full border-none"
                                title="HTML Preview"
                            />
                        ) : null
                ) : (
                    <div style={{ padding: '0', fontSize: '13px', lineHeight: '1.65', fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace" }}>
                        {artifact.content.split('\n').map((line, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    minHeight: '21px',
                                    transition: 'background 0.08s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '52px',
                                        minWidth: '52px',
                                        paddingRight: '16px',
                                        textAlign: 'right',
                                        color: 'rgba(255,255,255,0.18)',
                                        fontSize: '11.5px',
                                        userSelect: 'none',
                                        lineHeight: '21.45px',
                                        borderRight: '1px solid rgba(255,255,255,0.06)',
                                        flexShrink: 0,
                                    }}
                                >
                                    {i + 1}
                                </span>
                                <span
                                    style={{
                                        paddingLeft: '16px',
                                        paddingRight: '24px',
                                        whiteSpace: 'pre',
                                        color: 'rgba(255,255,255,0.82)',
                                        overflowX: 'auto',
                                        flex: 1,
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: (() => {
                                            try {
                                                const lang = artifact.language || 'text';
                                                const grammar = Prism.languages[lang] || Prism.languages['plain'] || Prism.languages['clike'];
                                                return grammar ? Prism.highlight(line || ' ', grammar, lang) : (line || ' ');
                                            } catch {
                                                return line || ' ';
                                            }
                                        })()
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
