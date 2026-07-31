/**
 * 이미지 리사이즈 치수 계산 (비율 유지)
 * width/height는 "최대 박스"로만 해석하며, 절대 강제 스트레치하지 않음.
 */
export function calculateContainSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Invalid source dimensions');
  }

  const maxW = maxWidth && maxWidth > 0 ? maxWidth : Number.POSITIVE_INFINITY;
  const maxH = maxHeight && maxHeight > 0 ? maxHeight : Number.POSITIVE_INFINITY;
  const scale = Math.min(maxW / sourceWidth, maxH / sourceHeight, 1);

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

/**
 * 긴 변 기준 최대 픽셀로 맞춤
 */
export function calculateMaxEdgeSize(
  sourceWidth: number,
  sourceHeight: number,
  maxEdge = 1920
): { width: number; height: number } {
  return calculateContainSize(sourceWidth, sourceHeight, maxEdge, maxEdge);
}
