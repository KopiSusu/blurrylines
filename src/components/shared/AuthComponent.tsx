"use client"; // Ensure this is at the top of the file

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "@/app/(auth)/login/actions";

// Validation schema using Zod
const authSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => data.password === data.confirmPassword || !data.confirmPassword,
    {
      message: "Passwords must match",
      path: ["confirmPassword"],
    }
  );

type AuthFormData = z.infer<typeof authSchema>;

const AuthComponent = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get the error message from the query parameters
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Initialize form with shadcn and Zod schema
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="flex items-center justify-center w-full h-[70vh]">
      <div className="w-96 rounded-md border p-5 space-y-5 relative bg-foreground/5">
        <div className="flex items-center gap-2">
          <KeyRound />
          <h1 className="text-2xl font-bold">
            {isSignIn ? "Sign In" : "Register"} with Email
          </h1>
        </div>

        <Form {...form}>
          <form className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@mail.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field (only for Register) */}
            {!isSignIn && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              formAction={isSignIn ? login : signup} // Use formAction for Next.js server actions
              className="w-full"
            >
              {isSignIn ? "Sign In" : "Register"}
            </Button>

            {/* Display error message */}
            {errorMessage && (
              <div className="text-destructive border border-dashed bg-destructive/10 border-destructive p-2 rounded-sm text-center">
                {errorMessage}
              </div>
            )}
          </form>
        </Form>

        <button
          className="text-sm text-blue-500"
          onClick={() => {
            setIsSignIn(!isSignIn);
            form.reset(); // Clear form when toggling between Sign In and Register
            setErrorMessage(null); // Clear error message when switching between forms
          }}
        >
          {isSignIn
            ? "Don't have an account? Register"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default AuthComponent;
