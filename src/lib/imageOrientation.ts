/**
 * 이미지 방향/비율 유틸 — 업로드·썸네일·라이트박스 공통
 */

export type ImageOrientation = 'portrait' | 'landscape' | 'square';

export function getOrientation(
  width?: number | null,
  height?: number | null
): ImageOrientation {
  if (!width || !height || width <= 0 || height <= 0) return 'landscape';
  if (height > width) return 'portrait';
  if (width > height) return 'landscape';
  return 'square';
}

export function isPortrait(width?: number | null, height?: number | null): boolean {
  return getOrientation(width, height) === 'portrait';
}

/** CSS aspect-ratio 값 (예: "3 / 4"). 메타가 없으면 undefined */
export function getAspectRatioStyle(
  width?: number | null,
  height?: number | null
): string | undefined {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  return `${width} / ${height}`;
}

/**
 * 원본과 결과의 방향이 같은지 검사 (세로→가로 강제 방지)
 */
export function orientationsMatch(
  sourceWidth: number,
  sourceHeight: number,
  resultWidth: number,
  resultHeight: number
): boolean {
  return getOrientation(sourceWidth, sourceHeight) === getOrientation(resultWidth, resultHeight);
}
