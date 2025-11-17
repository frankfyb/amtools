// 极坐标照片墙类型定义

export interface CardStyle {
  left: number;
  top: number;
  rotate: number;
  z: number;
}

export interface PhotoItem {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PhotoWallConfig {
  desktopStyles: CardStyle[];
  desktopWidths: number[];
  mobileStyles: CardStyle[];
  urls: string[];
}

// 预设的URL顺序
export const URL_ORDER = [
  3, 7, 1, 12, 5, 9, 2, 18, 4, 10, 6, 14, 8,
  15, 11, 23, 16, 21, 13, 17, 19, 22, 24, 25, 26, 27,
] as const;

// 桌面端预设布局
export const DESKTOP_PRESET: CardStyle[] = [
  { left: 6, top: 6, rotate: -6, z: 11 },
  { left: 32, top: 5, rotate: 4, z: 12 },
  { left: 58, top: 7, rotate: -3, z: 11 },
  { left: 14, top: 24, rotate: -5, z: 13 },
  { left: 44, top: 22, rotate: 3, z: 14 },
  { left: 74, top: 25, rotate: -4, z: 13 },
  { left: 10, top: 50, rotate: 4, z: 12 },
  { left: 36, top: 48, rotate: -3, z: 13 },
  { left: 62, top: 51, rotate: 2, z: 13 },
];

// 桌面端宽度预设
export const DESKTOP_WIDTHS: number[] = [
  18, 17, 16, 17, 20, 17, 16, 17, 20,
];

// 移动端预设布局
export const MOBILE_PRESET: CardStyle[] = [
  { left: 4, top: 6, rotate: -5, z: 12 },
  { left: 32, top: 4, rotate: 3, z: 13 },
  { left: 60, top: 6, rotate: -2, z: 12 },
  { left: 6, top: 32, rotate: -3, z: 13 },
  { left: 34, top: 30, rotate: 3, z: 14 },
  { left: 62, top: 32, rotate: -4, z: 13 },
  { left: 4, top: 60, rotate: 3, z: 12 },
  { left: 32, top: 58, rotate: -2, z: 13 },
  { left: 60, top: 60, rotate: 2, z: 13 },
];

// 工具函数：生成照片墙URLs
export function generatePhotoUrls(count: number = 9): string[] {
  return URL_ORDER.slice(0, count).map((n) => 
    `https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/${n}.PNG`
  );
}