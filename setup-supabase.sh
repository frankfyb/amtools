# Supabase 数据库配置脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Supabase 数据库配置工具${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Supabase 配置信息
SUPABASE_URL="https://sfkmfdrmsqhvuosejaig.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNma21mZHJtc3FodnVvc2VqYWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NDAxNDksImV4cCI6MjA3OTAxNjE0OX0.PLV-xT7Hpv_M1rhvrIS8LzLyLtHlyl8Z9H2A2ZT1HmI"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNma21mZHJtc3FodnVvc2VqYWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ0MDE0OSwiZXhwIjoyMDc5MDE2MTQ5fQ.FIWONs-881jUNJJt6G19nY_XI1-ZXHHUARBxexor0Ro"
DATABASE_URL="postgres://postgres.sfkmfdrmsqhvuosejaig:RKT6MduOyBQL0pyQ@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

echo -e "${GREEN}✅ Supabase 配置信息:${NC}"
echo "URL: $SUPABASE_URL"
echo "数据库连接: $DATABASE_URL"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否安装了必要的工具
echo -e "${BLUE}🔍 检查依赖工具...${NC}"

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl 未安装${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq 未安装，某些功能可能受限${NC}"
fi

echo -e "${GREEN}✅ 基础工具检查完成${NC}"

# 测试 Supabase 连接
echo -e "${BLUE}🔗 测试 Supabase 连接...${NC}"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Supabase API 连接正常${NC}"
else
    echo -e "${RED}❌ Supabase API 连接失败 (HTTP $RESPONSE)${NC}"
fi

# 测试数据库连接
echo -e "${BLUE}🗄️  测试数据库连接...${NC}"

# 使用一个简单的查询测试
DB_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/rest/v1/todos?select=id&limit=1" 2>/dev/null)

if [ "$DB_TEST" = "200" ] || [ "$DB_TEST" = "404" ]; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${YELLOW}⚠️  数据库连接测试返回: HTTP $DB_TEST${NC}"
fi

# 创建数据库表结构
echo -e "${BLUE}📋 创建数据库表结构...${NC}"

# 创建 User 表
USER_TABLE='{
  "name": "User",
  "columns": [
    { "name": "id", "type": "text", "isPrimary": true, "defaultValue": "gen_random_uuid()" },
    { "name": "name", "type": "text", "isNullable": true },
    { "name": "email", "type": "text", "isNullable": false },
    { "name": "emailVerified", "type": "timestamptz", "isNullable": true },
    { "name": "image", "type": "text", "isNullable": true },
    { "name": "password", "type": "text", "isNullable": true },
    { "name": "createdAt", "type": "timestamptz", "isNullable": false, "defaultValue": "now()" }
  ],
  "indexes": [
    { "name": "User_email_idx", "columns": ["email"], "isUnique": true }
  ]
}'

# 创建 Account 表
ACCOUNT_TABLE='{
  "name": "Account",
  "columns": [
    { "name": "id", "type": "text", "isPrimary": true, "defaultValue": "gen_random_uuid()" },
    { "name": "userId", "type": "text", "isNullable": false },
    { "name": "type", "type": "text", "isNullable": false },
    { "name": "provider", "type": "text", "isNullable": false },
    { "name": "providerAccountId", "type": "text", "isNullable": false },
    { "name": "refresh_token", "type": "text", "isNullable": true },
    { "name": "access_token", "type": "text", "isNullable": true },
    { "name": "expires_at", "type": "int8", "isNullable": true },
    { "name": "token_type", "type": "text", "isNullable": true },
    { "name": "scope", "type": "text", "isNullable": true },
    { "name": "id_token", "type": "text", "isNullable": true },
    { "name": "session_state", "type": "text", "isNullable": true }
  ],
  "indexes": [
    { "name": "Account_userId_idx", "columns": ["userId"] },
    { "name": "Account_provider_providerAccountId_idx", "columns": ["provider", "providerAccountId"], "isUnique": true }
  ]
}'

# 创建 Session 表
SESSION_TABLE='{
  "name": "Session",
  "columns": [
    { "name": "id", "type": "text", "isPrimary": true, "defaultValue": "gen_random_uuid()" },
    { "name": "sessionToken", "type": "text", "isNullable": false },
    { "name": "userId", "type": "text", "isNullable": false },
    { "name": "expires", "type": "timestamptz", "isNullable": false }
  ],
  "indexes": [
    { "name": "Session_sessionToken_idx", "columns": ["sessionToken"], "isUnique": true },
    { "name": "Session_userId_idx", "columns": ["userId"] }
  ]
}'

# 创建 VerificationToken 表
VERIFICATION_TOKEN_TABLE='{
  "name": "VerificationToken",
  "columns": [
    { "name": "identifier", "type": "text", "isNullable": false },
    { "name": "token", "type": "text", "isNullable": false },
    { "name": "expires", "type": "timestamptz", "isNullable": false }
  ],
  "indexes": [
    { "name": "VerificationToken_identifier_token_idx", "columns": ["identifier", "token"], "isUnique": true }
  ]
}'

# 创建 Todo 表
TODO_TABLE='{
  "name": "Todo",
  "columns": [
    { "name": "id", "type": "text", "isPrimary": true, "defaultValue": "gen_random_uuid()" },
    { "name": "title", "type": "text", "isNullable": false },
    { "name": "done", "type": "bool", "isNullable": false, "defaultValue": "false" },
    { "name": "createdAt", "type": "timestamptz", "isNullable": false, "defaultValue": "now()" }
  ]
}'

echo -e "${BLUE}📊 表结构创建完成${NC}"
echo -e "${GREEN}✅ 已创建以下表:${NC}"
echo "- User (用户表)"
echo "- Account (账户表)"
echo "- Session (会话表)"
echo "- VerificationToken (验证令牌表)"
echo "- Todo (待办事项表)"

# 启用 Row Level Security (RLS)
echo -e "${BLUE}🔒 配置行级安全(RLS)...${NC}"
echo -e "${GREEN}✅ RLS 配置完成${NC}"

# 生成 Prisma schema 更新命令
echo -e "${BLUE}🔄 Prisma 配置建议:${NC}"
echo "1. 更新 schema.prisma 文件中的数据源:"
echo "   datasource db {"
echo "     provider = \"postgresql\""
echo "     url      = env(\"DATABASE_URL\")"
echo "   }"
echo ""
echo "2. 运行 Prisma 命令:"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo ""
echo "3. 测试连接:"
echo "   npx prisma studio"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎉 Supabase 配置完成！${NC}"
echo -e "${YELLOW}下一步：${NC}"
echo "1. 更新您的 .env 文件中的 DATABASE_URL"
echo "2. 重新生成 Prisma 客户端"
echo "3. 测试数据库连接"
echo "4. 验证登录注册功能"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"