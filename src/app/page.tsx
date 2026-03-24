"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options as QROptions } from "qr-code-styling";

type DotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
type ShapeType = "square" | "circle" | "rounded-square" | "heart" | "diamond" | "star" | "christmas-tree" | "shield";

const DOT_STYLES: { label: string; value: DotType }[] = [
  { label: "Square", value: "square" },
  { label: "Dots", value: "dots" },
  { label: "Rounded", value: "rounded" },
  { label: "Extra Rounded", value: "extra-rounded" },
  { label: "Classy", value: "classy" },
  { label: "Classy Rounded", value: "classy-rounded" },
];

const SHAPES: { label: string; value: ShapeType }[] = [
  { label: "Square", value: "square" },
  { label: "Circle", value: "circle" },
  { label: "Rounded Square", value: "rounded-square" },
  { label: "Heart", value: "heart" },
  { label: "Diamond", value: "diamond" },
  { label: "Star", value: "star" },
  { label: "Christmas Tree", value: "christmas-tree" },
  { label: "Shield / Badge", value: "shield" },
];

const SIZES = [256, 512, 1024, 2048];

function getShapePath(shape: ShapeType, s: number): string {
  switch (shape) {
    case "circle": {
      const r = s / 2;
      return `M${r},0A${r},${r},0,1,1,${r},${s}A${r},${r},0,1,1,${r},0Z`;
    }
    case "rounded-square": {
      const r = s * 0.12;
      return `M${r},0H${s - r}A${r},${r},0,0,1,${s},${r}V${s - r}A${r},${r},0,0,1,${s - r},${s}H${r}A${r},${r},0,0,1,0,${s - r}V${r}A${r},${r},0,0,1,${r},0Z`;
    }
    case "heart":
      return [
        `M${s * 0.5},${s * 0.2}`,
        `C${s * 0.5},${s * 0.08},${s * 0.35},0,${s * 0.2},0`,
        `C${s * 0.05},0,0,${s * 0.15},0,${s * 0.35}`,
        `C0,${s * 0.6},${s * 0.5},${s * 0.9},${s * 0.5},${s}`,
        `C${s * 0.5},${s * 0.9},${s},${s * 0.6},${s},${s * 0.35}`,
        `C${s},${s * 0.15},${s * 0.95},0,${s * 0.8},0`,
        `C${s * 0.65},0,${s * 0.5},${s * 0.08},${s * 0.5},${s * 0.2}Z`,
      ].join("");
    case "diamond":
      return `M${s * 0.5},0L${s},${s * 0.5}L${s * 0.5},${s}L0,${s * 0.5}Z`;
    case "star": {
      const cx = s / 2, cy = s / 2;
      const outerR = s / 2, innerR = s * 0.2;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = ((i * 36 - 90) * Math.PI) / 180;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${i === 0 ? "M" : "L"}${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return pts.join("") + "Z";
    }
    case "christmas-tree":
      return [
        `M${s * 0.5},0`,
        `L${s * 0.75},${s * 0.3}H${s * 0.65}`,
        `L${s * 0.85},${s * 0.55}H${s * 0.72}`,
        `L${s * 0.95},${s * 0.8}H${s * 0.6}`,
        `V${s}H${s * 0.4}V${s * 0.8}`,
        `H${s * 0.05}L${s * 0.28},${s * 0.55}`,
        `H${s * 0.15}L${s * 0.35},${s * 0.3}`,
        `H${s * 0.25}Z`,
      ].join("");
    case "shield":
      return [
        `M0,${s * 0.05}Q0,0,${s * 0.05},0`,
        `H${s * 0.95}Q${s},0,${s},${s * 0.05}`,
        `V${s * 0.55}`,
        `C${s},${s * 0.8},${s * 0.5},${s},${s * 0.5},${s}`,
        `C${s * 0.5},${s},0,${s * 0.8},0,${s * 0.55}Z`,
      ].join("");
    default:
      return `M0,0H${s}V${s}H0Z`;
  }
}

/**
 * Returns a shape path scaled up and centered so a QR code of size `s`
 * fits comfortably inside with breathing room. The shape extends beyond
 * the (0,0)-(s,s) bounds to avoid clipping finder patterns and data.
 */
function getClipShapePath(shape: ShapeType, s: number): string {
  const cx = s / 2;
  const cy = s / 2;

  switch (shape) {
    case "circle": {
      // Inscribed square needs r >= s√2/2 ≈ 0.707s; use 0.76s for padding
      const r = s * 0.76;
      return `M${cx},${cy - r}A${r},${r},0,1,1,${cx},${cy + r}A${r},${r},0,1,1,${cx},${cy - r}Z`;
    }
    case "rounded-square": {
      const pad = s * 0.05;
      const x0 = -pad, y0 = -pad, x1 = s + pad, y1 = s + pad;
      const w = x1 - x0;
      const r = w * 0.12;
      return `M${x0 + r},${y0}H${x1 - r}A${r},${r},0,0,1,${x1},${y0 + r}V${y1 - r}A${r},${r},0,0,1,${x1 - r},${y1}H${x0 + r}A${r},${r},0,0,1,${x0},${y1 - r}V${y0 + r}A${r},${r},0,0,1,${x0 + r},${y0}Z`;
    }
    case "heart": {
      // Scale up 1.6x and center so QR sits in the belly of the heart
      const k = 1.6;
      const ks = s * k;
      const ox = (s - ks) / 2;
      const oy = (s - ks) / 2;
      const h = (f: number) => ox + ks * f;
      const v = (f: number) => oy + ks * f;
      return [
        `M${h(0.5)},${v(0.2)}`,
        `C${h(0.5)},${v(0.08)},${h(0.35)},${v(0)},${h(0.2)},${v(0)}`,
        `C${h(0.05)},${v(0)},${h(0)},${v(0.15)},${h(0)},${v(0.35)}`,
        `C${h(0)},${v(0.6)},${h(0.5)},${v(0.9)},${h(0.5)},${v(1)}`,
        `C${h(0.5)},${v(0.9)},${h(1)},${v(0.6)},${h(1)},${v(0.35)}`,
        `C${h(1)},${v(0.15)},${h(0.95)},${v(0)},${h(0.8)},${v(0)}`,
        `C${h(0.65)},${v(0)},${h(0.5)},${v(0.08)},${h(0.5)},${v(0.2)}Z`,
      ].join("");
    }
    case "diamond": {
      // Diamond half-diagonal must exceed s√2/2; use 0.78s for padding
      const d = s * 0.78;
      return `M${cx},${cy - d}L${cx + d},${cy}L${cx},${cy + d}L${cx - d},${cy}Z`;
    }
    case "star": {
      // Large star so QR fits within the inner pentagon area
      const outerR = s * 1.1;
      const innerR = s * 0.45;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = ((i * 36 - 90) * Math.PI) / 180;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${i === 0 ? "M" : "L"}${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return pts.join("") + "Z";
    }
    case "christmas-tree": {
      // Scale up 1.8x and center
      const k = 1.8;
      const ks = s * k;
      const ox = (s - ks) / 2;
      const oy = (s - ks) / 2;
      const h = (f: number) => ox + ks * f;
      const v = (f: number) => oy + ks * f;
      return [
        `M${h(0.5)},${v(0)}`,
        `L${h(0.75)},${v(0.3)}H${h(0.65)}`,
        `L${h(0.85)},${v(0.55)}H${h(0.72)}`,
        `L${h(0.95)},${v(0.8)}H${h(0.6)}`,
        `V${v(1)}H${h(0.4)}V${v(0.8)}`,
        `H${h(0.05)}L${h(0.28)},${v(0.55)}`,
        `H${h(0.15)}L${h(0.35)},${v(0.3)}`,
        `H${h(0.25)}Z`,
      ].join("");
    }
    case "shield": {
      // Scale up 1.3x and center
      const k = 1.3;
      const ks = s * k;
      const ox = (s - ks) / 2;
      const oy = (s - ks) / 2;
      const h = (f: number) => ox + ks * f;
      const v = (f: number) => oy + ks * f;
      return [
        `M${h(0)},${v(0.05)}Q${h(0)},${v(0)},${h(0.05)},${v(0)}`,
        `H${h(0.95)}Q${h(1)},${v(0)},${h(1)},${v(0.05)}`,
        `V${v(0.55)}`,
        `C${h(1)},${v(0.8)},${h(0.5)},${v(1)},${h(0.5)},${v(1)}`,
        `C${h(0.5)},${v(1)},${h(0)},${v(0.8)},${h(0)},${v(0.55)}Z`,
      ].join("");
    }
    default:
      return `M0,0H${s}V${s}H0Z`;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [data, setData] = useState("https://example.com");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [size, setSize] = useState(512);
  const [dotStyle, setDotStyle] = useState<DotType>("square");
  const [shape, setShape] = useState<ShapeType>("square");
  const [transparentBg, setTransparentBg] = useState(false);
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [logoScale, setLogoScale] = useState(20);

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
        color: transparentBg ? "transparent" : bgColor,
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
        imageSize: logoScale / 100,
      },
      image: logo,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
    };
  }, [data, fgColor, bgColor, size, dotStyle, transparentBg, logo, logoScale]);

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

  const handleDownload = async (type: "png" | "svg") => {
    const instance = qrInstance.current;
    if (!instance) return;

    if (shape === "square") {
      instance.download({ extension: type, name: "qr-code" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob: Blob | undefined = await (instance as any).getRawData(type);
    if (!blob) return;

    if (type === "png") {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        ctx.globalCompositeOperation = "destination-in";
        ctx.fill(new Path2D(getClipShapePath(shape, size)));
        canvas.toBlob((masked) => {
          if (masked) downloadBlob(masked, "qr-code.png");
        }, "image/png");
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob);
    } else {
      const text = await blob.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) return;

      const ns = "http://www.w3.org/2000/svg";
      const defs = doc.createElementNS(ns, "defs");
      const clipPathEl = doc.createElementNS(ns, "clipPath");
      clipPathEl.setAttribute("id", "shape-clip");
      const pathEl = doc.createElementNS(ns, "path");
      pathEl.setAttribute("d", getClipShapePath(shape, size));
      clipPathEl.appendChild(pathEl);
      defs.appendChild(clipPathEl);

      const g = doc.createElementNS(ns, "g");
      g.setAttribute("clip-path", "url(#shape-clip)");
      while (svg.firstChild) g.appendChild(svg.firstChild);
      svg.appendChild(defs);
      svg.appendChild(g);

      const svgString = new XMLSerializer().serializeToString(svg);
      downloadBlob(new Blob([svgString], { type: "image/svg+xml" }), "qr-code.svg");
    }
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

  const previewClipStyle: React.CSSProperties =
    shape !== "square"
      ? { clipPath: "url(#qr-shape-clip)" }
      : {};

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hidden SVG for preview clip-path */}
      {shape !== "square" && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <clipPath id="qr-shape-clip" clipPathUnits="objectBoundingBox">
              <path d={getClipShapePath(shape, 1)} />
            </clipPath>
          </defs>
        </svg>
      )}

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
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted">Background</span>
              <div className={`flex items-center gap-2${transparentBg ? " opacity-40 pointer-events-none" : ""}`}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={transparentBg}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-card-border bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={transparentBg}
                  className="w-full rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-accent"
                />
              </div>
              <label className="flex items-center gap-1.5 mt-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="accent-accent"
                />
                <span className="text-xs text-muted">Transparent</span>
              </label>
            </div>
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

          {/* Shape */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">Shape</span>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value as ShapeType)}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
            >
              {SHAPES.map((s) => (
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
            {logo && (
              <label className="flex flex-col gap-1.5 mt-2">
                <span className="text-sm text-muted">Logo Scale ({logoScale}%)</span>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={1}
                  value={logoScale}
                  onChange={(e) => setLogoScale(Number(e.target.value))}
                  className="accent-accent"
                />
                {logoScale >= 35 ? (
                  <span className="text-xs text-red-500">May not scan reliably</span>
                ) : logoScale >= 30 ? (
                  <span className="text-xs text-yellow-500">May affect scannability</span>
                ) : null}
              </label>
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
              style={{ maxWidth: Math.min(size, 400), ...previewClipStyle }}
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
