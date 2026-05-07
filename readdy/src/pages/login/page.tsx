import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold tracking-tight text-2xl text-primary">
                Login
              </div>
              <div className="text-sm text-muted-foreground">
                Enter your email below to login to your account
              </div>
            </div>
            <div className="p-6 pt-0">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium leading-none text-primary"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      id="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <label
                        className="text-sm font-medium leading-none text-primary"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <a
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-primary cursor-pointer"
                        href="#"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <input
                      type="password"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full cursor-pointer"
                  >
                    Login
                  </button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a className="underline underline-offset-4 text-primary cursor-pointer" href="#">
                    Sign up
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}