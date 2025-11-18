import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envVars = {
    // 检查关键环境变量是否存在
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ 已配置' : '❌ 缺失',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ 已配置' : '❌ 缺失',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ 已配置' : '❌ 缺失',
    NODE_ENV: process.env.NODE_ENV || '未设置',
    
    // 可选的 OAuth 提供商
    GITHUB_ID: process.env.GITHUB_ID ? '✅ 已配置' : '⚠️  未配置（可选）',
    GITHUB_SECRET: process.env.GITHUB_SECRET ? '✅ 已配置' : '⚠️  未配置（可选）',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ 已配置' : '⚠️  未配置（可选）',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ 已配置' : '⚠️  未配置（可选）',
  };

  // 检查数据库连接
  let databaseStatus = '❌ 未测试';
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = '✅ 连接正常';
  } catch (error) {
    databaseStatus = `❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }

  return NextResponse.json({
    status: '诊断完成',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: envVars,
    databaseStatus,
    nextauthUrl: process.env.NEXTAUTH_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    recommendations: [
      '确保所有必需的环境变量都在 Vercel 控制台中配置',
      '检查数据库连接字符串是否正确',
      '验证 NEXTAUTH_URL 是否与您的域名匹配',
      '确保 NEXTAUTH_SECRET 是强密钥（至少 32 个字符）',
    ],
  });
}