import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
  title?: string;
  onClose: () => void;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // YouTube Shorts
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (ytShortsMatch) {
    return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1`;
  }

  // Facebook video
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    const encoded = encodeURIComponent(url);
    return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true`;
  }

  // Instagram
  const igMatch = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
  if (igMatch) {
    return `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`;
  }

  return null;
}

export default function VideoPlayer({ url, title, onClose }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(url);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="relative w-full max-w-2xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm"
        >
          <X size={18} /> Band Karein
        </button>

        {title && (
          <p className="text-white font-semibold text-sm mb-2 px-1 truncate">
            {title}
          </p>
        )}

        {embedUrl ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={embedUrl}
              title={title ?? "Video"}
              className="absolute inset-0 w-full h-full rounded-xl"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-white/60 text-sm">
            <p>Yeh video link supported nahi hai.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 underline mt-2 block"
            >
              Browser mein kholein
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
