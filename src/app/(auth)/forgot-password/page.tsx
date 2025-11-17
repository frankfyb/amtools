"use client";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-center">忘记密码</h1>
        <p className="mt-4 text-sm text-neutral-600">
          暂未开通重置密码邮件服务。请联系管理员或使用第三方登录。
        </p>
        <div className="mt-6 text-sm text-neutral-600 text-center">
          <a href="/login" className="hover:underline">返回登录</a>
        </div>
      </div>
    </div>
  );
}