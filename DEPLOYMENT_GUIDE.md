# 生产环境部署检查清单

## NextAuth 生产环境配置问题解决方案

### 1. Vercel 环境变量配置
在 Vercel 控制台中添加以下环境变量：

```bash
# 必需的环境变量
NODE_ENV=production
NEXTAUTH_SECRET=pQttNfTpz8Nj/v8nXQ2CAITgpif9a4uSp6wnG+ku0qw=
DATABASE_URL=your_production_database_url

# 可选的 OAuth 提供商
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 飞书 API 配置
FEISHU_APP_ID=cli_a81aefaede28500e
FEISHU_APP_SECRET=utSiLQJQbyU1AqsAEsCTocZBbdI0byPn
FEISHU_BASE_TOKEN=VDzIb4jX6aNDxCs9VOMcagcyn2g
FEISHU_TABLE_ID=tblvwaN5DfM9AxxZ
FEISHU_VIEW_ID=vew06yxaS2
```

**重要**：不要在 Vercel 中设置 `NEXTAUTH_URL`，让 Vercel 自动设置！

### 2. 数据库连接问题

当前数据库地址 `test-db-postgresql.ns-cfd6671w.svc:5432` 是内网地址，生产环境需要公网可访问的数据库。

**解决方案**：
1. 使用 Vercel Postgres（推荐）
2. 使用 Supabase
3. 使用 Railway
4. 使用其他云数据库服务

### 3. NextAuth 配置更新

更新 `src/app/api/auth/[...nextauth]/route.ts`：

```typescript
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  // 生产环境关闭 debug
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AdapterUser;
        token.sub = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
};
```

### 4. 部署步骤

1. 在 Vercel 控制台配置环境变量
2. 设置生产数据库
3. 部署应用
4. 测试登录注册功能

### 5. 故障排除

如果仍然有问题：
1. 检查 Vercel 函数日志
2. 验证数据库连接
3. 检查 NextAuth 调试信息
4. 确保所有环境变量正确设置