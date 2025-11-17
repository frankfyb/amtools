"use client"
import type { FC } from "react"
import Link from "next/link"

export const Toolbar: FC<{ onToggleFavView: () => void }> = ({ onToggleFavView }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-[50px] md:h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900" aria-label="返回首页">← 返回首页</Link>
          <span className="text-xl font-semibold text-gray-900">经典语录</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFavView}
            className="px-3 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 focus-visible:ring-2 ring-gray-300 cursor-pointer"
            aria-label="我的收藏"
          >我的收藏</button>
        </div>
      </div>
    </div>
  )
}