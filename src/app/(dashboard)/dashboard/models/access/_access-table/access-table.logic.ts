'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { updateModelCredentials, clearModelPassword } from '@/lib/actions/models';
import { toast } from 'sonner';
import { AccessModelItem } from './access-table.types';
import { getPhonePrefix } from '@/lib/utils/phone';

const PAGE_SIZE = 25;

export function useAccessTable(initialModels: AccessModelItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [passwordFilter, setPasswordFilter] = useState<'all' | 'has_password' | 'no_password'>('all');
  const [phonePrefixFilter, setPhonePrefixFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Password visibility map (modelId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Editing state
  const [editingModel, setEditingModel] = useState<AccessModelItem | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const router = useRouter();

  // Toggle password visibility for a model
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get unique countries for filtering
  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    initialModels.forEach((m) => {
      if (m.country) countries.add(m.country.toLowerCase().trim());
    });
    return Array.from(countries).sort();
  }, [initialModels]);

  // Get unique phone prefixes for filtering
  const phonePrefixOptions = useMemo(() => {
    const prefixes = new Set<string>();
    initialModels.forEach((m) => {
      const prefix = getPhonePrefix(m.phone_e164);
      if (prefix) prefixes.add(prefix);
    });
    return Array.from(prefixes).sort();
  }, [initialModels]);

  // Open edit modal
  const handleStartEdit = (model: AccessModelItem) => {
    setEditingModel(model);
    setEditEmail(model.email || '');
    setEditPassword(model.login_password || '');
  };

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingModel(null);
    setEditEmail('');
    setEditPassword('');
  }, []);

  // Submit credentials update
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    if (!editEmail || editEmail.trim() === '') {
      toast.error('el correo electrónico es obligatorio.');
      return;
    }

    if (!editPassword || editPassword.length < 6) {
      toast.error('la contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsPending(true);

    try {
      const result = await updateModelCredentials(editingModel.id, editEmail, editPassword);
      if (result.success) {
        toast.success('credenciales actualizadas con éxito.');
        setEditingModel(null);
        router.refresh();
      } else {
        toast.error(result.error || 'error al actualizar credenciales.');
      }
    } catch {
      toast.error('error de conexión al actualizar credenciales.');
    } finally {
      setIsPending(false);
    }
  };

  const handleClearPassword = async (modelId: string) => {
    if (!confirm('¿Estás seguro de que deseas restablecer la contraseña de este modelo? Tendrá que ingresar su número y crear una contraseña nueva.')) {
      return;
    }
    setIsPending(true);
    try {
      const result = await clearModelPassword(modelId);
      if (result.success) {
        toast.success('Contraseña eliminada con éxito. El acceso ha sido restablecido.');
        setEditingModel(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Error al restablecer la contraseña.');
      }
    } catch {
      toast.error('Error de conexión al restablecer.');
    } finally {
      setIsPending(false);
    }
  };

  // Filter models, then sort alphabetically by alias
  const filteredModels = useMemo(() => {
    const filtered = initialModels.filter((m) => {
      // 1. Search Query (alias, email, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAlias = m.alias?.toLowerCase().includes(q) || false;
        const matchesEmail = m.email?.toLowerCase().includes(q) || false;
        const matchesPhone = m.phone_e164?.toLowerCase().includes(q) || false;
        if (!matchesAlias && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // 2. Gender Filter
      if (genderFilter !== 'all') {
        const g = m.gender?.toLowerCase() || '';
        const isMale = g === 'male' || g === 'hombre' || g === 'm';
        const isFemale = g === 'female' || g === 'mujer' || g === 'f';
        if (genderFilter === 'male' && !isMale) return false;
        if (genderFilter === 'female' && !isFemale) return false;
      }

      // 3. Password Filter
      if (passwordFilter !== 'all') {
        const hasPassword = !!m.login_password;
        if (passwordFilter === 'has_password' && !hasPassword) return false;
        if (passwordFilter === 'no_password' && hasPassword) return false;
      }

      // 4. Phone Prefix Filter
      if (phonePrefixFilter !== 'all') {
        const prefix = getPhonePrefix(m.phone_e164);
        if (prefix !== phonePrefixFilter) return false;
      }

      // 5. Country Filter
      if (countryFilter !== 'all') {
        if (m.country?.toLowerCase().trim() !== countryFilter) {
          return false;
        }
      }

      return true;
    });

    // Sort alphabetically by alias
    filtered.sort((a, b) => {
      const aliasA = (a.alias || '').toLowerCase();
      const aliasB = (b.alias || '').toLowerCase();
      return aliasA.localeCompare(aliasB, 'es');
    });

    return filtered;
  }, [initialModels, searchQuery, genderFilter, passwordFilter, phonePrefixFilter, countryFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE));

  // Reset to page 1 when filters change
  const safePage = currentPage > totalPages ? 1 : currentPage;

  const paginatedModels = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredModels.slice(start, start + PAGE_SIZE);
  }, [filteredModels, safePage]);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (value: 'all' | 'male' | 'female') => {
    setGenderFilter(value);
    setCurrentPage(1);
  };

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    setCurrentPage(1);
  };

  const handlePasswordFilterChange = (value: 'all' | 'has_password' | 'no_password') => {
    setPasswordFilter(value);
    setCurrentPage(1);
  };

  const handlePhonePrefixFilterChange = (value: string) => {
    setPhonePrefixFilter(value);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    handleSearchChange,
    genderFilter,
    handleGenderFilterChange,
    countryFilter,
    handleCountryFilterChange,
    passwordFilter,
    handlePasswordFilterChange,
    phonePrefixFilter,
    handlePhonePrefixFilterChange,
    visiblePasswords,
    togglePasswordVisibility,
    editingModel,
    editEmail,
    setEditEmail,
    editPassword,
    setEditPassword,
    isPending,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitEdit,
    handleClearPassword,
    countryOptions,
    phonePrefixOptions,
    filteredModels,
    paginatedModels,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    totalCount: filteredModels.length,
    pageSize: PAGE_SIZE,
  };
}
