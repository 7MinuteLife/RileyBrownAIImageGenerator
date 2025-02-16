'use client';

import { useState } from 'react';
import Link from "next/link";
import { Info, X, Copy, Download } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Preparing to generate images...");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for the image you want to generate");
      return;
    }

    setError(null);
    setLoading(true);
    setImages([]);
    setLoadingMessage("Starting image generation...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate images");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || "Failed to generate images");
      }

      setImages(data.imageUrls);
      setLoadingMessage(data.message || "Generating more images...");
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      setError('Failed to copy image to clipboard');
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
      setError('Failed to download image');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">AI Image Generator</h1>
        
        <div className="w-full max-w-xl mx-auto">
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={generateImages}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              // Loading placeholders
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="placeholder-image loading-image" />
                  <p className="loading-text">{loadingMessage}</p>
                </div>
              ))
            ) : images.length > 0 ? (
              // Generated images
              images.map((url, i) => (
                <div key={i} className="relative aspect-square group">
                  <Image
                    src={url}
                    alt={`Generated image ${i + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleCopyImage(url, i)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200 action-button tooltip-container"
                      aria-label="Copy image"
                    >
                      <Copy size={20} className="text-gray-700" />
                      <span className="tooltip">
                        {copiedIndex === i ? 'Copied!' : 'Copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDownloadImage(url, i)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200 action-button tooltip-container"
                      aria-label="Download image"
                    >
                      <Download size={20} className="text-gray-700" />
                      <span className="tooltip">Download</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="col-span-2 text-center text-gray-500">
                Enter a prompt and click generate to create images
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
