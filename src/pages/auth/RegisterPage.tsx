import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerSchema, type RegisterValues } from '@/types/forms'
import { AuthLayout } from './AuthLayout'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema), defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null)
    try {
      const { needsEmailConfirmation } = await signUp(values.email, values.password, values.displayName.trim())
      // If confirmation is off we are already logged in and <GuestRoute> redirects. If it is on, tell the person to check their inbox.
      if (needsEmailConfirmation) setConfirmEmail(values.email)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
  }

  if (confirmEmail) {
    return (
      <AuthLayout
        title="Check your email" subtitle={`We sent a confirmation link to ${confirmEmail}.`}
        footer={<>Already confirmed? <Link to="/login" className="text-accent hover:underline">Log in</Link></>}
      >
        <p className="text-sm text-muted">Open the link in that email, then log in. If it does not arrive within a few minutes, check your spam folder.</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account" subtitle="Track every application in one place."
      footer={<>Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input label="Name (optional)" autoComplete="name" autoFocus {...register('displayName')} error={errors.displayName?.message} />
        <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
        <Input label="Confirm password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</Button>
      </form>
    </AuthLayout>
  )
}
