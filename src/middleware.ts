export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/back/:path*",
    // 示例：如需保护工具页，可加入下行
    // "/tools/:path*",
  ],
};