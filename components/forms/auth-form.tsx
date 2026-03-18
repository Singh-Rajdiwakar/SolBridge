"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CinematicOrb } from "@/components/landing";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthValues = {
  name: string;
  email: string;
  password: string;
  walletAddress: string;
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isRegister = mode === "register";
  const schema = z
    .object({
      name: z.string().optional(),
      email: z.string().email("Enter a valid email"),
      password: z.string().min(6, "Password should be at least 6 characters"),
      walletAddress: z.string().optional(),
    })
    .superRefine((value, context) => {
      if (isRegister && !value.name?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required",
          path: ["name"],
        });
      }
    });

  const form = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "login"
        ? { name: "", email: "demo@solanablocks.io", password: "Demo123!", walletAddress: "" }
        : { name: "", email: "", password: "", walletAddress: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: AuthValues) =>
      mode === "login"
        ? authApi.login({ email: values.email, password: values.password })
        : authApi.register(values),
    onSuccess: (data) => {
      setAuth(data);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      router.push("/dashboard/stake");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 premium-shell-grid opacity-55" />
      <div className="pointer-events-none absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(242,201,76,0.16),transparent_68%)] blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-[4%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_68%)] blur-[150px]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[rgba(224,185,75,0.14)] bg-[rgba(10,11,12,0.84)] shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden border-r border-[rgba(255,255,255,0.06)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="page-kicker">
              <span className="page-kicker-dot" />
              Retix Wallet
            </div>
            <h1 className="mt-8 max-w-lg text-6xl font-semibold leading-[0.95] tracking-[-0.06em] text-white">
              Enter the cinematic Web3 operating system.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#c9c4bb]">
              Wallet intelligence, DeFi execution, AI guidance, treasury control, and premium analytics aligned inside one luxury Solana product surface.
            </p>
            <div className="mt-8 max-w-[32rem]">
              <CinematicOrb />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Live APY", "18.75%"],
              ["TVL Tracked", "$18.6M"],
              ["DAO Votes", "2.4K"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.4rem] border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-[#8e877b]">{label}</div>
                <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-8">
            <div className="page-kicker">
              <span className="page-kicker-dot" />
              {isRegister ? "Create account" : "Welcome back"}
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
              {isRegister ? "Create your premium workspace" : "Login to Retix Wallet"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#c9c4bb]">
              {isRegister ? "Create a luxury-grade on-chain operations account." : "Use the seeded demo account or your own credentials."}
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => {
              mutation.mutate(values);
            })}
          >
            {isRegister ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Ray Solis" {...form.register("name" as never)} />
                <p className="text-xs text-rose-300">{form.formState.errors?.name?.message as string}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="demo@solanablocks.io" {...form.register("email" as never)} />
              <p className="text-xs text-rose-300">{form.formState.errors?.email?.message as string}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...form.register("password" as never)} />
              <p className="text-xs text-rose-300">{form.formState.errors?.password?.message as string}</p>
            </div>

            {isRegister ? (
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input id="walletAddress" placeholder="Optional" {...form.register("walletAddress" as never)} />
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-[rgba(224,185,75,0.16)] bg-[rgba(224,185,75,0.08)] p-4 text-sm text-[#c9c4bb]">
                Demo user: <span className="font-medium text-white">demo@solanablocks.io</span> / <span className="font-medium text-white">Demo123!</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : isRegister ? "Create account" : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-[#f2c94c] transition hover:text-[#f6e1a0]"
            >
              {isRegister ? "Login" : "Register"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
