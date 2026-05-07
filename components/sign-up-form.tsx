"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("两次输入的密码不一致");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "注册失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-2xl border border-border bg-white shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary">注册</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            创建您的账户
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[13px] font-medium">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-xl text-[13px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="repeat-password" className="text-[13px] font-medium">确认密码</Label>
            <Input
              id="repeat-password"
              type="password"
              placeholder="请再次输入密码"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
            {isLoading ? "创建账户中..." : "注册"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            已有账户？{" "}
            <Link
              href="/auth/login"
              className="text-amber-600 hover:text-amber-700 font-medium underline-offset-4 hover:underline"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
