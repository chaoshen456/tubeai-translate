import { SignUpForm } from "@/components/sign-up-form";
import { Zap } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0d0d0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2210%22 cy=%2210%22 r=%221%22/%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">YouTube AI</h1>
              <p className="text-[12px] text-white/40 font-medium">译智平台</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">加入我们<br />开启AI翻译之旅</h2>
          <p className="text-[14px] text-white/50 leading-relaxed mb-8 max-w-sm">
            自动化获取 YouTube AI 前沿视频，智能翻译为中文，一键发布到知乎。
          </p>
          <div className="space-y-4">
            {[
              '自动抓取 YouTube AI 热门视频',
              'AI 智能翻译，保持技术准确性',
              '一键发布到知乎，轻松管理',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[13px] text-white/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-[#f7f7f8]">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-primary">YouTube AI 译智平台</span>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
