import type { ImgHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { paperArt } from "@/components/paper/art";

/** Missing photo: the cut-paper house on layer-1 paper, not a generic icon. */
function MissingPhoto() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="w-1/3 max-w-[96px]">
      <path d={paperArt.house.d} fillRule="evenodd" fill="var(--color-scene-town-far)" />
    </svg>
  );
}
import { cn } from "./component-utils";
import { optimizeImageUrl } from "@/lib/image-utils";

export interface NetworkImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  wrapperClassName?: string;
  fallback?: ReactNode;
  width?: number;
  quality?: number;
  format?: "webp" | "avif";
}

function NetworkImageInner({
  src,
  alt,
  wrapperClassName,
  fallback,
  className,
  width,
  quality: _quality,
  format: _format,
  ...props
}: Omit<NetworkImageProps, "src"> & { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "paper-grain flex items-center justify-center bg-paper-1",
          wrapperClassName ?? "h-full w-full"
        )}
      >
        {fallback ?? <MissingPhoto />}
      </div>
    );
  }

  return (
    <span className={cn("relative block overflow-hidden bg-paper-2", wrapperClassName ?? "h-full w-full")}>
      <img
        alt={alt}
        className={cn("object-cover absolute inset-0 h-full w-full", className)}
        src={src}
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
        width={width}
        {...props}
      />
    </span>
  );
}

export function NetworkImage({
  src,
  alt,
  wrapperClassName,
  fallback,
  className,
  width,
  quality,
  format,
  ...props
}: NetworkImageProps) {
  const optimizedSrc = optimizeImageUrl(src, { width, quality, format });

  if (!optimizedSrc) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "paper-grain flex items-center justify-center bg-paper-1",
          wrapperClassName ?? "h-full w-full"
        )}
      >
        {fallback ?? <MissingPhoto />}
      </div>
    );
  }

  // Using optimizedSrc as key ensures the inner component remounts when src changes,
  // resetting the failed state so a new image can attempt loading.
  return (
    <NetworkImageInner
      key={optimizedSrc}
      src={optimizedSrc}
      alt={alt}
      wrapperClassName={wrapperClassName}
      fallback={fallback}
      className={className}
      width={width}
      quality={quality}
      format={format}
      {...props}
    />
  );
}
