import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  textColor?: string;
  showText?: boolean;
}

/**
 * 官方小管家品牌圖標 (螢幕清晰向量版)
 */
export function BrandIcon({ size = 52, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-icon.svg"
        alt="小管家兒童理財"
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
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* 左邊放清晰向量 icon */}
      <BrandIcon size={iconSize} />

      {/* 右邊放小管家兒童理財 */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-black tracking-tight text-lg sm:text-xl md:text-2xl whitespace-nowrap leading-none ${textColor}`}
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            小管家兒童理財
          </span>
        </div>
      )}
    </div>
  );
}

