import React from 'react';
import { useSiteContent } from '../hooks/useSiteContent';

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  textColor?: string;
  showText?: boolean;
  showTagline?: boolean;
  taglineColor?: string;
}

/**
 * 官方小管家品牌圖標 (螢幕清晰向量版)
 */
export function BrandIcon({ size = 52, className = '' }: { size?: number; className?: string }) {
  const { content } = useSiteContent();
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={content.brand.logoUrl || '/logo-icon.svg'}
        alt={content.brand.name}
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
        loading="eager"
        decoding="sync"
      />
    </div>
  );
}

/**
 * 官方完整白底清晰圖檔
 */
export function BrandLogoImage({
  className = '',
  height = 52,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <img
      src="/小管家logo_白底(螢幕清晰用).png"
      alt="小管家兒童理財"
      className={`object-contain select-none rounded-lg ${className}`}
      style={{ height }}
      loading="eager"
      decoding="sync"
    />
  );
}

export default function BrandLogo({
  className = '',
  iconSize = 52,
  textColor = 'text-slate-900',
  showText = true,
  showTagline = false,
  taglineColor = 'text-slate-500',
}: BrandLogoProps) {
  const { content, loaded } = useSiteContent();
  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 select-none transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {/* 左邊放清晰向量 icon */}
      <BrandIcon size={iconSize} />

      {/* 右邊放小管家兒童理財 */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-black tracking-tight text-lg sm:text-xl md:text-2xl whitespace-nowrap leading-none ${textColor}`}
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {content.brand.name}
          </span>
          {showTagline && content.brand.tagline && (
            <span
              className={`hidden sm:block mt-1.5 text-xs md:text-sm font-medium tracking-wide whitespace-nowrap leading-none ${taglineColor}`}
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              {content.brand.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

