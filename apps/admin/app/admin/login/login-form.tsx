"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { FormField } from "@/components/admin/form-field";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <FormField
        label="Admin email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email?.[0]}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password?.[0]}
      />
      {state.error ? (
        <div className="admin-login-error">
          {state.error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="admin-login-submit"
      >
        {pending ? "Signing in" : "Sign in"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
