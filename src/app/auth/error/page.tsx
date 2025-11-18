import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthError() {
  const router = useRouter();

  useEffect(() => {
    // 获取错误信息
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    console.error('Auth Error:', error);
    
    // 3秒后重定向到登录页
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            认证配置错误
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            身份验证配置出现问题，请稍后再试或联系管理员。
          </p>
          <p className="mt-4 text-xs text-gray-500">
            3秒后将自动返回登录页面...
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            立即返回登录页
          </button>
        </div>
      </div>
    </div>
  );
}