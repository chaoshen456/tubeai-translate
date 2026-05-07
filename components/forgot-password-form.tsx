"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "发送失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="rounded-2xl border border-border bg-white shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">邮件已发送</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            密码重置链接已发送到<br /><span className="font-medium text-primary">{email}</span>
          </p>
          <Link
            href="/auth/login"
            className="text-[13px] text-amber-600 hover:text-amber-700 font-medium underline-offset-4 hover:underline"
          >
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-2xl border border-border bg-white shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary">重置密码</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            输入您的邮箱，我们将发送重置链接
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-[13px] border-0"
            disabled={isLoading}
          >
            {isLoading ? "发送中..." : "发送重置链接"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-[13px] text-muted-foreground hover:text-primary underline-offset-4 hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
