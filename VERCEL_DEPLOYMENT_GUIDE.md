# 生产环境 Vercel 配置指南

## 🔧 必需的环境变量

请在 Vercel 控制台 → Settings → Environment Variables 中添加以下变量：

### NextAuth 配置（必需）
```
NEXTAUTH_URL=https://www.amtools.top
NEXTAUTH_SECRET=pQttNfTpz8Nj/v8nXQ2CAITgpif9a4uSp6wnG+ku0qw=
```

### 应用配置（必需）
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.amtools.top
NEXT_PUBLIC_DEV_MODE=false
```

### 数据库配置（必需 - 需要替换）
```
# 替换为实际的 Vercel Postgres 或 Supabase 连接字符串
DATABASE_URL=your-production-database-url-here
```

### 飞书配置（保持现有）
```
FEISHU_APP_ID=cli_a81aefaede28500e
FEISHU_APP_SECRET=utSiLQJQbyU1AqsAEsCTocZBbdI0byPn
FEISHU_BASE_TOKEN=VDzIb4jX6aNDxCs9VOMcagcyn2g
FEISHU_TABLE_ID=tblvwaN5DfM9AxxZ
FEISHU_VIEW_ID=vew06yxaS2
```

## 🚀 数据库迁移步骤

1. 获取新的数据库连接字符串后，在 Vercel 中设置 DATABASE_URL
2. 部署应用后，访问: https://www.amtools.top/api/auth/diagnose
3. 如果数据库连接正常，运行 Prisma 迁移:
   ```bash
   # 在本地终端运行，指向生产数据库
   npx prisma migrate deploy
   # 或者使用 Prisma Studio 验证连接
   npx prisma studio
   ```

## ✅ 验证修复

部署完成后检查：
1. 访问: https://www.amtools.top/api/auth/diagnose
2. 所有环境变量应该显示 ✅ 已配置
3. 数据库状态应该显示 ✅ 连接正常
4. 然后测试登录功能