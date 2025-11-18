import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const envVars = {
    // 检查关键环境变量是否存在
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ 已配置' : '❌ 缺失',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ 已配置' : '❌ 缺失',
    NODE_ENV: process.env.NODE_ENV || '未设置',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '未设置（Vercel 自动设置）',
    
    // 可选的 OAuth 提供商
    GITHUB_ID: process.env.GITHUB_ID ? '✅ 已配置' : '⚠️  未配置（可选）',
    GITHUB_SECRET: process.env.GITHUB_SECRET ? '✅ 已配置' : '⚠️  未配置（可选）',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ 已配置' : '⚠️  未配置（可选）',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ 已配置' : '⚠️  未配置（可选）',
  };

  // 检查数据库连接
  let databaseStatus = '❌ 未测试';
  let databaseDetail = '';
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = '✅ 连接正常';
  } catch (error) {
    databaseStatus = '❌ 连接失败';
    databaseDetail = error instanceof Error ? error.message : '未知错误';
  }

  // 检查当前域名和配置
  const currentUrl = request.headers.get('host') || '未知';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const fullUrl = `${protocol}://${currentUrl}`;

  return NextResponse.json({
    status: '生产环境诊断完成',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    currentUrl: fullUrl,
    environmentVariables: envVars,
    databaseStatus,
    databaseDetail,
    warnings: [
      ...(process.env.NEXTAUTH_URL ? ['NEXTAUTH_URL 已手动设置，建议移除让 Vercel 自动设置'] : []),
      ...(databaseStatus.includes('❌') ? ['数据库连接失败，请检查 DATABASE_URL 配置'] : []),
    ],
    recommendations: [
      '确保所有必需的环境变量都在 Vercel 控制台中配置',
      '检查数据库连接字符串是否为公网可访问地址',
      '验证 NEXTAUTH_SECRET 是强密钥（至少 32 个字符）',
      '检查 Vercel 函数日志获取更多错误信息',
    ],
  });
}