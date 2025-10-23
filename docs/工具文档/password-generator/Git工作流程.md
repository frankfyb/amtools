# 📚 Git工作流程指南

## 概述

本文档为密码生成器工具项目提供完整的Git工作流程指导，包括分支管理、提交规范、代码审查等最佳实践。

## 🌳 分支策略

### 主要分支

- **main/master** - 主分支，始终保持稳定可部署状态
- **develop** - 开发分支（可选），集成最新开发功能
- **feature/** - 功能分支，开发新功能
- **bugfix/** - 修复分支，修复非紧急bug
- **hotfix/** - 热修复分支，修复生产环境紧急问题

### 分支命名规范

```bash
# 功能开发
feature/password-generator
feature/user-management
feature/api-integration

# Bug修复
bugfix/fix-password-validation
bugfix/ui-responsive-issue

# 热修复
hotfix/security-vulnerability
hotfix/critical-bug-fix

# 文档更新
docs/update-readme
docs/api-documentation

# 重构
refactor/component-optimization
refactor/code-cleanup
```

## 📝 提交信息规范

### 提交类型

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 重构代码
- **test**: 添加或修改测试
- **chore**: 构建过程或辅助工具的变动

### 提交格式

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
feat(password-generator): 添加密码强度评估功能

- 实现密码强度计算算法
- 添加强度指示器UI组件
- 支持实时强度评估
- 包含弱、中、强三个等级

Closes #123
```

## 🔄 标准工作流程

### 1. 开始新功能开发

```bash
# 确保在最新的主分支
git checkout main
git pull origin main

# 创建新的功能分支
git checkout -b feature/password-generator

# 开始开发...
```

### 2. 开发过程中的提交

```bash
# 添加文件到暂存区
git add .

# 或者选择性添加
git add src/app/tools/password-generator/

# 提交更改
git commit -m "feat(password-generator): 实现基础密码生成功能"

# 推送到远程分支
git push -u origin feature/password-generator
```

### 3. 功能完成后的合并

```bash
# 确保功能分支是最新的
git checkout feature/password-generator
git pull origin feature/password-generator

# 更新主分支并合并最新更改
git checkout main
git pull origin main
git checkout feature/password-generator
git merge main

# 解决冲突（如果有）
# 推送更新后的功能分支
git push origin feature/password-generator

# 创建Pull Request或直接合并
```

## 🔍 代码审查流程

### Pull Request模板

```markdown
## 📋 变更概述
简要描述本次PR的主要变更内容

## 🎯 相关Issue
- Closes #123
- Related to #456

## 📸 截图/演示
如果有UI变更，请提供截图或GIF演示

## ✅ 检查清单
- [ ] 代码已经过自测
- [ ] 添加了必要的测试用例
- [ ] 更新了相关文档
- [ ] 遵循了代码规范
- [ ] 没有引入新的警告或错误

## 🧪 测试说明
描述如何测试这些变更

## 📝 其他说明
任何需要审查者注意的额外信息
```

### 审查要点

1. **功能正确性** - 代码是否实现了预期功能
2. **代码质量** - 是否遵循最佳实践和编码规范
3. **性能影响** - 是否有性能问题
4. **安全性** - 是否存在安全漏洞
5. **可维护性** - 代码是否易于理解和维护
6. **测试覆盖** - 是否有足够的测试覆盖

## 🏷️ 版本标签管理

### 语义化版本控制

```bash
# 主版本号.次版本号.修订号
v1.0.0  # 初始版本
v1.1.0  # 新增功能（向后兼容）
v1.1.1  # 修复bug（向后兼容）
v2.0.0  # 重大更改（不向后兼容）
```

### 创建标签

```bash
# 创建带注释的标签
git tag -a v1.1.0 -m "添加密码生成器工具"

# 推送标签到远程
git push origin v1.1.0

# 推送所有标签
git push origin --tags
```

## 🚀 发布流程

### 1. 准备发布

```bash
# 确保所有功能都已合并到主分支
git checkout main
git pull origin main

# 运行测试
npm test

# 构建项目
npm run build
```

### 2. 创建发布标签

```bash
# 创建发布标签
git tag -a v1.1.0 -m "Release v1.1.0: 添加密码生成器工具

新功能:
- 密码生成器工具
- 密码强度评估
- 复制到剪贴板功能

改进:
- 优化UI响应式设计
- 提升用户体验

修复:
- 修复已知bug"

# 推送标签
git push origin v1.1.0
```

### 3. 部署发布

```bash
# 如果使用自动化部署
# 标签推送会触发CI/CD流程

# 手动部署
npm run deploy
```

## 🛠️ 常用Git命令

### 基础操作

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline --graph

# 查看分支
git branch -a

# 切换分支
git checkout <branch-name>

# 创建并切换分支
git checkout -b <new-branch>
```

### 高级操作

```bash
# 交互式rebase（整理提交历史）
git rebase -i HEAD~3

# 暂存当前更改
git stash

# 恢复暂存的更改
git stash pop

# 查看文件差异
git diff

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 强制推送（谨慎使用）
git push --force-with-lease
```

## 🔧 问题排查

### 常见问题及解决方案

#### 1. 合并冲突

```bash
# 查看冲突文件
git status

# 手动解决冲突后
git add <resolved-files>
git commit -m "resolve merge conflicts"
```

#### 2. 误提交敏感信息

```bash
# 从历史中完全删除文件
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch <sensitive-file>' \
--prune-empty --tag-name-filter cat -- --all

# 强制推送（会重写历史）
git push --force-with-lease --all
```

#### 3. 恢复删除的分支

```bash
# 查找删除的分支
git reflog

# 恢复分支
git checkout -b <branch-name> <commit-hash>
```

## 📊 最佳实践总结

### ✅ 推荐做法

1. **频繁提交** - 小步快跑，经常提交
2. **清晰的提交信息** - 使用规范的提交格式
3. **功能分支** - 每个功能使用独立分支
4. **代码审查** - 所有代码都应经过审查
5. **自动化测试** - 集成CI/CD流程
6. **文档同步** - 代码和文档同步更新

### ❌ 避免做法

1. **直接在主分支开发** - 可能破坏稳定性
2. **大型提交** - 难以审查和回滚
3. **模糊的提交信息** - 影响历史追踪
4. **跳过测试** - 可能引入bug
5. **强制推送主分支** - 可能丢失其他人的工作
6. **忽略冲突** - 可能导致功能异常

## 🎉 总结

良好的Git工作流程是团队协作成功的关键。通过遵循这些最佳实践，您可以：

- 保持代码库的整洁和稳定
- 提高团队协作效率
- 降低引入bug的风险
- 便于功能的独立开发和部署
- 维护清晰的项目历史

记住，工作流程应该服务于团队的需求，可以根据项目特点进行适当调整。