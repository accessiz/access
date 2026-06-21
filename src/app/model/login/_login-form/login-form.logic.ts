import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginModelByPhone, checkModelPhone, registerModelPasswordByPhone } from '@/lib/actions/models_portal';

export function useLoginForm(redirectTo?: string) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'phone' | 'password' | 'register'>('phone');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setError('');
    setIsPending(true);

    try {
      const result = await checkModelPhone(phone);
      if (result.success) {
        // Almacenar el teléfono normalizado retornado por el servidor
        if (result.phone) {
          setPhone(result.phone);
        }
        if (result.hasPassword) {
          setStep('password');
        } else {
          setStep('register');
        }
      } else {
        setError(result.error || 'el teléfono no está registrado.');
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
      const result = await loginModelByPhone(phone, password);
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
      const result = await registerModelPasswordByPhone(phone, password);
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
    setStep('phone');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return {
    phone,
    setPhone,
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
    handlePhoneSubmit,
    handleLogin,
    handleRegister,
    resetStep,
  };
}
