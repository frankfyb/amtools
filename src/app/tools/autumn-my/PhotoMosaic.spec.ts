import { test, expect } from '@playwright/test'

// 简单的可视化与数据标记测试：页面能加载，组件存在，形成标记置位
// 运行：npx playwright test （项目已安装 @playwright/test）

test.describe('PhotoMosaic 组件', () => {
  test('加载并形成形状', async ({ page }) => {
    await page.goto('http://localhost:3000/tools/autumn-my')
    const mosaic = page.locator('[data-testid="photo-mosaic"]')
    await expect(mosaic).toBeVisible()

    // 等待 formed 标记置位
    await expect.poll(async () => {
      return mosaic.getAttribute('data-formed')
    }, { timeout: 8000 }).toBe('true')

    // 验证碎片数量达到预期范围（接入时配置 tileCount=160）
    const tiles = page.locator('.mosaic-tile')
    await expect(tiles.count()).resolves.toBeGreaterThan(120)
  })
})