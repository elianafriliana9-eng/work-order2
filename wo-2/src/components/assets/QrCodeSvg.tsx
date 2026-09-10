"use client";

import React, { useMemo } from "react";

interface QrCodeSvgProps {
  token: string;
  size?: number;
  className?: string;
}

/**
 * Generates a deterministic 25x25 QR-like SVG matrix from an opaque token string.
 * Strictly adheres to security rules:
 * - Does NOT expose any PII or asset data in payload, DOM attributes, or alt text.
 * - Finder patterns (top-left, top-right, bottom-left) match ISO QR specification.
 */
export function QrCodeSvg({ token, size = 180, className = "" }: QrCodeSvgProps) {
  const matrix = useMemo(() => {
    const dimension = 25;
    const grid: boolean[][] = Array.from({ length: dimension }, () =>
      Array(dimension).fill(false)
    );

    // Helper to draw a 7x7 finder pattern
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startY + r][startX + c] = true;
          }
        }
      }
    };

    // 3 Finder patterns
    drawFinder(0, 0); // Top-left
    drawFinder(dimension - 7, 0); // Top-right
    drawFinder(0, dimension - 7); // Bottom-left

    // Timing patterns
    for (let i = 8; i < dimension - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Deterministic pseudo-random payload fill from token hash
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash) + 12345;
    const randomBit = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % 2 === 1;
    };

    for (let r = 0; r < dimension; r++) {
      for (let c = 0; c < dimension; c++) {
        // Skip finder zones and separators
        const inTopLeft = r <= 7 && c <= 7;
        const inTopRight = r <= 7 && c >= dimension - 8;
        const inBottomLeft = r >= dimension - 8 && c <= 7;
        const inTiming = (r === 6 && c > 7 && c < dimension - 8) || (c === 6 && r > 7 && r < dimension - 8);

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
          grid[r][c] = randomBit();
        }
      }
    }

    return grid;
  }, [token]);

  const dimension = 25;
  const cellSize = size / dimension;

  return (
    <div
      className={`relative inline-block bg-white p-3 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 ${className}`}
      role="img"
      aria-label="QR Code Verifikasi Tanda Tangan Digital BAST (Opaque Secure Token)"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, rIdx) =>
          row.map((isBlack, cIdx) => {
            if (!isBlack) return null;
            return (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx * cellSize}
                y={rIdx * cellSize}
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill="#18181b"
                rx={cellSize > 8 ? 1 : 0}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
