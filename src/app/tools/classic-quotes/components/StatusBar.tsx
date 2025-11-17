"use client"
import type { FC } from "react"

export const StatusBar: FC<{ status: "connecting"|"ok"|"error"; updatedAt: string }> = ({ status, updatedAt }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-[50px] md:h-[60px] flex items-center">
        <div className="hidden md:block text-sm text-gray-700">API连接状态：{status==='ok'?'正常':status==='connecting'?'连接中':'错误'}</div>
        <div className="md:hidden mx-auto text-sm text-gray-700">API状态：{status==='ok'?'正常':status==='connecting'?'连接中':'错误'} · 更新时间：{updatedAt || '—'}</div>
        <div className="hidden md:block mx-auto text-sm text-gray-700">更新时间：{updatedAt || '—'}</div>
        <div className="hidden md:block text-sm text-gray-400">© 2025</div>
      </div>
    </div>
  )
}