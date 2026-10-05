import type { CSSProperties } from "react";
import { getCatalogElement, isIconAsset } from "./catalog";

interface ElementArtworkProps {
  assetId: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function ElementArtwork({ assetId, color, className, style }: ElementArtworkProps) {
  const asset = getCatalogElement(assetId);
  if (!asset) return null;
  if (isIconAsset(asset)) {
    const Icon = asset.icon;
    return <Icon aria-hidden="true" className={className} color={color ?? "#111827"} size="100%" stroke={1.8} style={style} />;
  }
  if (asset.supportsColor) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          ...style,
          display: "inline-block",
          backgroundColor: color ?? "#111827",
          maskImage: `url("${asset.src}")`,
          WebkitMaskImage: `url("${asset.src}")`,
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }
  return <img alt="" draggable={false} src={asset.src} className={className} style={style} />;
}
