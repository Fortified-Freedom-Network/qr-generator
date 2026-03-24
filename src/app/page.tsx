"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options as QROptions } from "qr-code-styling";

type DotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";

const DOT_STYLES: { label: string; value: DotType }[] = [
  { label: "Square", value: "square" },
  { label: "Dots", value: "dots" },
  { label: "Rounded", value: "rounded" },
  { label: "Extra Rounded", value: "extra-rounded" },
  { label: "Classy", value: "classy" },
  { label: "Classy Rounded", value: "classy-rounded" },
];

const SIZES = [256, 512, 1024, 2048];

export default function Home() {
  const [data, setData] = useState("https://example.com");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [size, setSize] = useState(512);
  const [dotStyle, setDotStyle] = useState<DotType>("square");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [logoFileName, setLogoFileName] = useState<string>("");

  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getQROptions = useCallback((): QROptions => {
    return {
      width: size,
      height: size,
      data: data || "https://example.com",
      dotsOptions: {
        color: fgColor,
        type: dotStyle,
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        color: fgColor,
      },
      cornersDotOptions: {
        color: fgColor,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10,
        imageSize: 0.3,
      },
      image: logo,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
    };
  }, [data, fgColor, bgColor, size, dotStyle, logo]);

  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then((mod) => {
      if (cancelled) return;
      const QRCodeStylingClass = mod.default;
      if (!qrInstance.current) {
        qrInstance.current = new QRCodeStylingClass(getQROptions());
        if (qrRef.current) {
          qrRef.current.innerHTML = "";
          qrInstance.current.append(qrRef.current);
        }
      } else {
        qrInstance.current.update(getQROptions());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getQROptions]);

  const handleDownload = (type: "png" | "svg") => {
    qrInstance.current?.download({
      extension: type,
      name: "qr-code",
    });
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|svg\+xml)$/)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target?.result as string);
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">FFN QR Generator</h1>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 lg:flex-row">
        {/* Settings Card */}
        <div className="flex flex-col gap-5 rounded-xl border border-card-border bg-card p-6 lg:w-[400px]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Settings
          </h2>

          {/* URL / Text */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Content</span>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Enter URL or text"
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
            />
          </label>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted">Foreground</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-card-border bg-transparent"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-accent"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted">Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-card-border bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-accent"
                />
              </div>
            </label>
          </div>

          {/* Size */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Size ({size}px)</span>
            <input
              type="range"
              min={256}
              max={2048}
              step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded px-1.5 py-0.5 transition ${
                    size === s
                      ? "bg-accent text-white"
                      : "hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </label>

          {/* Dot Style */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Dot Style</span>
            <select
              value={dotStyle}
              onChange={(e) => setDotStyle(e.target.value as DotType)}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
            >
              {DOT_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* Logo Upload */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Logo (optional)</span>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-card-border px-4 py-6 text-center transition hover:border-accent"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              {logo ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="h-12 w-12 rounded object-contain"
                  />
                  <span className="text-xs text-muted truncate max-w-full">
                    {logoFileName}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted">
                  Drop an image here or click to upload
                </span>
              )}
            </div>
            {logo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLogo(undefined);
                  setLogoFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="self-start text-xs text-muted hover:text-foreground transition"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>

        {/* Preview Card */}
        <div className="flex flex-1 flex-col items-center gap-6 rounded-xl border border-card-border bg-card p-6">
          <h2 className="self-start text-sm font-semibold uppercase tracking-wider text-muted">
            Preview
          </h2>

          <div className="flex flex-1 items-center justify-center">
            <div
              ref={qrRef}
              className="[&>canvas]:max-w-full [&>canvas]:h-auto [&>svg]:max-w-full [&>svg]:h-auto"
              style={{ maxWidth: Math.min(size, 400) }}
            />
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload("png")}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              Download PNG
            </button>
            <button
              onClick={() => handleDownload("svg")}
              className="rounded-lg border border-card-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/5"
            >
              Download SVG
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
