import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 });
    }
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      return NextResponse.json({ error: '邮箱已注册' }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, password: hash } });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}