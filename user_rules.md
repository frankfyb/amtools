# 代码开发规则文档

## 1. 代码生成规范要求

### 1.1 注释要求
- **必须**为每段生成的代码添加清晰易懂的注释
- 注释内容需说明代码的编写原因和预期效果
- 使用简单直白的语言，确保编程新手能够理解
- 示例代码需完整展示实际应用场景

### 1.2 注释示例
```javascript
// 计算两个数字的和
// 使用这个函数可以将任意两个数字相加，返回它们的总和
function addNumbers(a, b) {
  // 将两个参数相加并返回结果
  return a + b;
}

// 实际应用示例
const result = addNumbers(5, 3); // 结果是8
console.log('5 + 3 =', result);
```

## 2. 方案实现要求

### 2.1 核心实现逻辑
- 详细描述解决方案的核心实现逻辑
- 列出关键步骤和技术要点
- 提供完整的代码实现框架
- 避免冗长的理论原理说明，聚焦具体实现方法

### 2.2 实现步骤模板
1. **问题分析**：明确需要解决的具体问题
2. **技术选型**：选择合适的技术方案
3. **代码实现**：提供完整的代码解决方案
4. **测试验证**：确保代码能够正常运行
5. **优化建议**：提供性能优化和扩展建议

### 2.3 代码框架示例
```typescript
// 用户认证系统实现
interface User {
  id: string;
  username: string;
  email: string;
}

class AuthService {
  // 用户登录功能
  // 验证用户凭据并返回用户信息
  async login(username: string, password: string): Promise<User> {
    // 1. 验证输入参数
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }
    
    // 2. 查询用户信息
    const user = await this.findUserByUsername(username);
    
    // 3. 验证密码
    const isValid = await this.verifyPassword(password, user.password);
    
    if (!isValid) {
      throw new Error('密码错误');
    }
    
    // 4. 返回用户信息
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }
}
```

## 3. 文档格式规范

### 3.1 Markdown语法要求
- 使用Markdown语法编写
- 采用清晰的层级结构（H2/H3标题）
- 代码块使用正确的语法高亮
- 保持一致的文档风格和术语使用

### 3.2 文档结构模板
```markdown
## 功能名称

### 概述
简要描述功能的作用和用途

### 实现步骤
1. 第一步描述
2. 第二步描述
3. 第三步描述

### 代码实现
```语言类型
// 详细的代码实现
// 包含完整的注释说明
```

### 使用示例
展示代码的实际使用方法

### 注意事项
- 重要提示1
- 重要提示2
```

## 4. 质量要求

### 4.1 代码质量
- 确保所有示例代码可直接运行
- 实现方案需经过实际验证
- 注释与代码保持同步更新
- 文档内容完整无遗漏

### 4.2 测试验证要求
```javascript
// 测试用例示例
function testUserAuthentication() {
  // 测试正常登录场景
  const validUser = authService.login('testuser', 'password123');
  console.assert(validUser.username === 'testuser', '用户名验证失败');
  
  // 测试错误密码场景
  try {
    authService.login('testuser', 'wrongpassword');
    console.error('应该抛出密码错误异常');
  } catch (error) {
    console.assert(error.message === '密码错误', '错误处理正确');
  }
}

// 运行测试
testUserAuthentication();
```

### 4.3 性能优化建议
```javascript
// 优化前的代码（可能存在性能问题）
function processLargeArray(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 10) {
      result.push(arr[i] * 2);
    }
  }
  return result;
}

// 优化后的代码（使用现代JavaScript特性）
function processLargeArrayOptimized(arr) {
  // 使用filter和map链式调用，提高代码可读性和性能
  return arr
    .filter(item => item > 10)  // 筛选大于10的元素
    .map(item => item * 2);      // 将筛选后的元素乘以2
}
```

## 5. 实际应用示例

### 5.1 完整的CRUD操作示例
```typescript
// 用户管理系统 - 完整的增删改查实现

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

class UserManager {
  private users: User[] = [];
  private nextId = 1;

  // 创建用户
  // 添加新用户到系统中，自动生成唯一ID
  createUser(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      id: this.nextId++,
      ...userData
    };
    
    this.users.push(newUser);
    console.log(`用户 ${newUser.name} 创建成功，ID: ${newUser.id}`);
    return newUser;
  }

  // 查询用户
  // 根据ID查找特定用户
  getUserById(id: number): User | undefined {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      console.warn(`未找到ID为 ${id} 的用户`);
    }
    return user;
  }

  // 更新用户
  // 修改现有用户的信息
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): User | null {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      console.error(`无法更新：未找到ID为 ${id} 的用户`);
      return null;
    }
    
    // 保留原有数据，只更新提供的字段
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates
    };
    
    console.log(`用户 ${this.users[userIndex].name} 更新成功`);
    return this.users[userIndex];
  }

  // 删除用户
  // 从系统中移除指定用户
  deleteUser(id: number): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    
    const wasDeleted = this.users.length < initialLength;
    if (wasDeleted) {
      console.log(`ID为 ${id} 的用户已删除`);
    } else {
      console.warn(`删除失败：未找到ID为 ${id} 的用户`);
    }
    
    return wasDeleted;
  }

  // 获取所有用户
  getAllUsers(): User[] {
    // 返回用户数组的副本，防止外部修改
    return [...this.users];
  }
}

// 使用示例
const userManager = new UserManager();

// 创建用户
const user1 = userManager.createUser({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 25
});

const user2 = userManager.createUser({
  name: '李四',
  email: 'lisi@example.com',
  age: 30
});

// 查询用户
console.log('查找用户:', userManager.getUserById(1));

// 更新用户
userManager.updateUser(1, { age: 26, email: 'zhangsan.new@example.com' });

// 删除用户
userManager.deleteUser(2);

// 查看所有用户
console.log('所有用户:', userManager.getAllUsers());
```

## 6. 最佳实践总结

### 6.1 代码组织原则
- 每个函数只负责一个具体的功能
- 使用有意义的变量和函数名称
- 保持代码结构清晰，避免过度嵌套
- 合理使用注释解释复杂的逻辑

### 6.2 错误处理规范
```javascript
// 良好的错误处理示例
async function fetchUserData(userId) {
  try {
    // 验证输入参数
    if (!userId || typeof userId !== 'number') {
      throw new Error('用户ID必须是数字类型');
    }
    
    // 发起网络请求
    const response = await fetch(`/api/users/${userId}`);
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`获取用户数据失败: ${response.status}`);
    }
    
    // 解析响应数据
    const userData = await response.json();
    
    // 验证返回数据
    if (!userData.id || !userData.name) {
      throw new Error('返回的用户数据格式不正确');
    }
    
    return userData;
    
  } catch (error) {
    // 记录错误日志
    console.error('获取用户数据时发生错误:', error.message);
    
    // 根据错误类型提供友好的用户提示
    if (error.message.includes('网络')) {
      throw new Error('网络连接异常，请检查网络后重试');
    } else if (error.message.includes('格式')) {
      throw new Error('服务器返回数据格式错误');
    } else {
      throw new Error('获取用户数据失败，请稍后重试');
    }
  }
}
```

### 6.3 文档维护要求
- 定期更新文档内容，确保与代码同步
- 根据用户反馈持续改进文档质量
- 添加实际案例和最佳实践示例
- 保持文档结构的清晰性和一致性