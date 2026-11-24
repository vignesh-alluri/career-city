import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginValues } from '@/types/forms'
import { AuthLayout } from './AuthLayout'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  })

  // On success the auth listener updates the session and <GuestRoute> moves us on to the app, so there is nothing to navigate to here.
  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    try { await signIn(values.email, values.password) }
    catch (e) { setServerError(e instanceof Error ? e.message : 'Something went wrong. Please try again.') }
  }

  return (
    <AuthLayout
      title="Log in" subtitle="Pick up where you left off."
      footer={<>New here? <Link to="/register" className="text-accent hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" autoFocus {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
        {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</Button>
      </form>
    </AuthLayout>
  )
}
