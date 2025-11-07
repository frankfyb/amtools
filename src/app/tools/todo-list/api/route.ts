// app/api/todos/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// 初始化 Prisma 客户端（连接数据库）
const prisma = new PrismaClient();

// 1. GET：获取所有 Todo
export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' }, // 按创建时间倒序
    });
    return NextResponse.json(todos); // 返回 JSON 数据
  } catch (error) {
    return NextResponse.json(
      { error: '获取任务失败' },
      { status: 500 }
    );
  }
}

// 2. POST：处理新增/更新/删除（用 action 区分操作）
export async function POST(request: NextRequest) {
  const { action, data } = await request.json(); // 解析请求体

  try {
    switch (action) {
      // 新增任务
      case 'create': {
        const { title } = data;
        if (!title) {
          return NextResponse.json(
            { error: '任务内容不能为空' },
            { status: 400 }
          );
        }
        const newTodo = await prisma.todo.create({
          data: { title }, // 写入数据库
        });
        return NextResponse.json(newTodo);
      }

      // 更新任务状态
      case 'update': {
        const { id, done, title } = data;
        if (!id || typeof id !== 'string') {
          return NextResponse.json(
            { error: '缺少有效 id' },
            { status: 400 }
          );
        }

        const updateData: { done?: boolean; title?: string } = {};

        // 更新完成状态
        if (typeof done === 'boolean') {
          updateData.done = done;
        }

        // 可选：更新标题（带校验）
        if (typeof title === 'string') {
          const trimmed = title.trim();
          if (!trimmed) {
            return NextResponse.json(
              { error: '任务内容不能为空' },
              { status: 400 }
            );
          }
          if (trimmed.length > 100) {
            return NextResponse.json(
              { error: '任务内容长度不能超过 100 字' },
              { status: 400 }
            );
          }
          updateData.title = trimmed;
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(
            { error: '未提供更新字段' },
            { status: 400 }
          );
        }

        const updatedTodo = await prisma.todo.update({
          where: { id },
          data: updateData,
        });
        return NextResponse.json(updatedTodo);
      }

      // 删除任务
      case 'delete': {
        const { id } = data;
        await prisma.todo.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // 批量清空任务
      case 'clear': {
        const result = await prisma.todo.deleteMany();
        return NextResponse.json({ success: true, deleted: result.count });
      }

      default:
        return NextResponse.json(
          { error: '无效操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}