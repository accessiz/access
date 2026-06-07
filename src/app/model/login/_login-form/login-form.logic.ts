import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginModel, checkModelEmail, registerModelPassword } from '@/lib/actions/models_portal';

export function useLoginForm(redirectTo?: string) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password' | 'register'>('email');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setIsPending(true);

    try {
      const result = await checkModelEmail(email);
      if (result.success) {
        if (result.hasPassword) {
          setStep('password');
        } else {
          setStep('register');
        }
      } else {
        setError(result.error || 'el correo no está registrado.');
      }
    } catch (err) {
      setError('error de conexión. inténtalo de nuevo.');
    } finally {
      setIsPending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);

    try {
      const result = await loginModel(email, password);
      if (result.success) {
        router.push(redirectTo || '/model/profile');
        router.refresh();
      } else {
        setError(result.error || 'contraseña incorrecta.');
      }
    } catch (err) {
      setError('error de conexión. inténtalo de nuevo.');
    } finally {
      setIsPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('la contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('las contraseñas no coinciden.');
      return;
    }

    setIsPending(true);

    try {
      const result = await registerModelPassword(email, password);
      if (result.success) {
        router.push(redirectTo || '/model/profile');
        router.refresh();
      } else {
        setError(result.error || 'error al registrar la contraseña.');
      }
    } catch (err) {
      setError('error de conexión. inténtalo de nuevo.');
    } finally {
      setIsPending(false);
    }
  };

  const resetStep = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    step,
    error,
    isPending,
    handleEmailSubmit,
    handleLogin,
    handleRegister,
    resetStep,
  };
}
