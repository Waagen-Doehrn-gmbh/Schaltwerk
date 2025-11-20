"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, LogIn, Loader2 } from "lucide-react";
import { useLogin } from "@/lib/hooks";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        username: data.username,
        password: data.password,
      });
      router.push("/");
    } catch (err: any) {
      form.setError("root", {
        message: err.message || "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 md:px-4 lg:px-4 xl:px-4 py-8 md:py-8 lg:py-10 xl:py-12">
      <div className="w-full max-w-md space-y-6 md:space-y-6 lg:space-y-6 xl:space-y-8">
        {/* Logo/Branding Bereich */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-2xl bg-primary text-primary-foreground mb-3 md:mb-3 lg:mb-3 xl:mb-4 shadow-lg">
            <Lock className="w-6 h-6 md:w-7 md:h-7 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
          </div>
          <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-foreground">
            SchaltWerk
          </h1>
          <p className="text-sm md:text-sm lg:text-sm xl:text-base text-muted-foreground">
            Melden Sie sich an, um fortzufahren
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-3 md:pb-3 lg:pb-3 xl:pb-4">
            <CardTitle className="text-xl md:text-xl lg:text-xl xl:text-2xl font-semibold text-center">
              Anmeldung
            </CardTitle>
            <CardDescription className="text-center text-xs md:text-xs lg:text-xs xl:text-sm">
              Geben Sie Ihre Anmeldedaten ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Benutzername
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Benutzername"
                            disabled={loginMutation.isPending}
                            className="pl-10"
                            autoComplete="username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Passwort
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={loginMutation.isPending}
                            className="pl-10"
                            autoComplete="current-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message */}
                {form.formState.errors.root && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  size="lg"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anmeldung läuft...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Anmelden
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Info Text */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Benutzerkonten werden vom Administrator verwaltet.
                <br />
                Bei Problemen wenden Sie sich bitte an Ihren Administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          © {new Date().getFullYear()} SchaltWerk. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}
