"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { Box } from "@mui/material";

function toImageSrc(img: ImageProps["src"] | unknown): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null) {
    const o = img as { src?: string; default?: unknown };
    if (typeof o.src === "string") return o.src;
    if (o.default) return toImageSrc(o.default);
  }
  return String(img);
}

function isRemoteUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

type RemoteAwareImageProps = Omit<ImageProps, "src"> & {
  src: ImageProps["src"] | unknown;
};

/**
 * Uses a plain img for remote URLs (S3, CDN) to avoid next/image hostname config issues.
 * Local/static imports still use next/image.
 */
export default function RemoteAwareImage({ src, alt, fill, style, priority, ...rest }: RemoteAwareImageProps) {
  const resolved = toImageSrc(src);

  if (!resolved) {
    return null;
  }

  if (isRemoteUrl(resolved)) {
    if (fill) {
      return (
        <Box
          component="img"
          src={resolved}
          alt={alt ?? ""}
          draggable={rest.draggable}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: (style as React.CSSProperties | undefined)?.objectFit ?? "cover",
          }}
        />
      );
    }

    return (
      <Box
        component="img"
        src={resolved}
        alt={alt ?? ""}
        sx={{
          width: rest.width ?? "100%",
          height: rest.height ?? "auto",
          objectFit: (style as React.CSSProperties | undefined)?.objectFit ?? "cover",
        }}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt ?? ""}
      fill={fill}
      style={style}
      priority={priority}
      {...rest}
    />
  );
}
