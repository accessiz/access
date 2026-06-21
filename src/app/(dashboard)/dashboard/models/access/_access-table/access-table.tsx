'use client';

import * as React from 'react';
import { Eye, EyeOff, Edit2, X, Check, Loader2, Mail, Lock, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAccessTable } from './access-table.logic';
import { AccessTableProps } from './access-table.types';

import { SearchBar } from '@/components/molecules/SearchBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AccessTable({ initialModels }: AccessTableProps) {
  const {
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
    paginatedModels,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    pageSize,
  } = useAccessTable(initialModels);

  // Close modal on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelEdit]);


  // Pagination items
  const paginationItems = React.useMemo(() => {
    type PageItem = number | '...';
    const items: PageItem[] = [];
    const pagesToShow = 3;
    const halfPages = Math.floor(pagesToShow / 2);

    if (totalPages <= pagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > halfPages + 2) items.push('...');
      const startPage = Math.max(2, currentPage - halfPages);
      const endPage = Math.min(totalPages - 1, currentPage + halfPages);
      for (let i = startPage; i <= endPage; i++) items.push(i);
      if (currentPage < totalPages - halfPages - 1) items.push('...');
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar: Search + Filters (matches ModelsToolbar pattern) */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <SearchBar
              className="w-full sm:w-72"
              placeholder="buscar por alias, correo o teléfono..."
              value={searchQuery}
              onValueChange={handleSearchChange}
              onClear={() => handleSearchChange('')}
            />

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Gender Filter Dropdown */}
              <Select
                value={genderFilter}
                onValueChange={handleGenderFilterChange}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Géneros</SelectItem>
                  <SelectItem value="male">Hombres</SelectItem>
                  <SelectItem value="female">Mujeres</SelectItem>
                </SelectContent>
              </Select>

              {/* Password Filter Dropdown */}
              <Select
                value={passwordFilter}
                onValueChange={handlePasswordFilterChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Contraseña" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Contraseñas</SelectItem>
                  <SelectItem value="has_password">Con Contraseña</SelectItem>
                  <SelectItem value="no_password">Sin Contraseña</SelectItem>
                </SelectContent>
              </Select>

              {/* Phone Prefix Filter Dropdown */}
              <Select
                value={phonePrefixFilter}
                onValueChange={handlePhonePrefixFilterChange}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Prefijo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Prefijos</SelectItem>
                  {phonePrefixOptions.map((prefix) => (
                    <SelectItem key={prefix} value={prefix}>
                      {prefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Country Filter Dropdown */}
              <Select
                value={countryFilter}
                onValueChange={handleCountryFilterChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Países</SelectItem>
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>
                      {toTitleCase(country)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-body text-muted-foreground whitespace-nowrap">
            {totalCount} talentos
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Mobile: stacked cards */}
        <div className="space-y-3 md:hidden">
          {paginatedModels.length > 0 ? (
            paginatedModels.map((model, index) => {
              const rowNumber = ((currentPage - 1) * pageSize) + index + 1;
              const isPwVisible = !!visiblePasswords[model.id];
              const hasPassword = !!model.login_password;
              const genderLabel = model.gender
                ? (model.gender.toLowerCase() === 'male' || model.gender.toLowerCase() === 'm' || model.gender.toLowerCase() === 'hombre' ? 'hombre' : 'mujer')
                : 'no especificado';

              return (
                <div key={model.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-2 gap-y-2">
                        <span className="text-label font-mono text-muted-foreground">
                          {rowNumber.toString().padStart(2, '0')}
                        </span>
                        <span className="min-w-0 text-title font-semibold text-foreground capitalize truncate">
                          {model.alias || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <div className="text-body text-muted-foreground lowercase truncate">
                      correo: <span className="text-foreground">{model.email || '—'}</span>
                    </div>

                    <div className="text-body text-muted-foreground lowercase truncate">
                      teléfono: <span className="text-foreground font-mono">{model.phone_e164 || '—'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-body text-muted-foreground">
                      <span>contraseña:</span>
                      {hasPassword ? (
                        <div className="flex items-center gap-2 font-mono text-foreground">
                          <span>
                            {isPwVisible ? model.login_password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(model.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title={isPwVisible ? 'ocultar' : 'mostrar'}
                          >
                            {isPwVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-500 font-medium">sin contraseña</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-x-3 gap-y-2 mt-2 pt-2 border-t">
                      <div className="text-label text-muted-foreground">
                        {toTitleCase(model.country || 'guatemala')} • <span className="lowercase">{genderLabel}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStartEdit(model)}
                        title={hasPassword ? 'editar' : 'registrar'}
                        aria-label={hasPassword ? 'editar' : 'registrar'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground lowercase border rounded-lg border-dashed">
              no se encontraron talentos con los filtros seleccionados.
            </div>
          )}
        </div>

        {/* Desktop+: sortable table */}
        <div className="hidden md:block">
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-225">
              <TableHeader>
                <TableRow className="bg-quaternary hover:bg-quaternary">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Contraseña de Acceso</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Género</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedModels.length > 0 ? (
                  paginatedModels.map((model, index) => {
                    const rowNumber = ((currentPage - 1) * pageSize) + index + 1;
                    const isPwVisible = !!visiblePasswords[model.id];
                    const hasPassword = !!model.login_password;
                    const genderLabel = model.gender
                      ? (model.gender.toLowerCase() === 'male' || model.gender.toLowerCase() === 'm' || model.gender.toLowerCase() === 'hombre' ? 'hombre' : 'mujer')
                      : 'no especificado';

                    return (
                      <TableRow key={model.id} className="cv-auto-sm">
                        <TableCell className="text-muted-foreground font-mono text-label">
                          {rowNumber.toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="font-medium capitalize">
                          {model.alias || '—'}
                        </TableCell>
                        <TableCell className="lowercase">
                          {model.email || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-body text-muted-foreground whitespace-nowrap">
                          {model.phone_e164 || '—'}
                        </TableCell>
                        <TableCell>
                          {hasPassword ? (
                            <div className="flex items-center gap-2 font-mono">
                              <span>
                                {isPwVisible ? model.login_password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(model.id)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title={isPwVisible ? 'ocultar' : 'mostrar'}
                              >
                                {isPwVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-red-500 font-medium">sin contraseña</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {toTitleCase(model.country || 'guatemala')}
                        </TableCell>
                        <TableCell>
                          {genderLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleStartEdit(model)}
                            title={hasPassword ? 'editar' : 'registrar'}
                            aria-label={hasPassword ? 'editar' : 'registrar'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground lowercase">
                      no se encontraron talentos con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <footer className="shrink-0 flex flex-col items-center gap-4 pt-4 border-t w-full sm:flex-row sm:justify-between mt-4">
          <div className="w-full sm:flex-1">
            <Pagination>
              <PaginationContent className="flex justify-center sm:justify-start w-full">
                <PaginationItem>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-body hover:bg-muted transition-colors cursor-pointer",
                      currentPage <= 1 && "pointer-events-none opacity-50"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">anterior</span>
                  </button>
                </PaginationItem>

                <div className="hidden sm:flex">
                  {paginationItems.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page as number)}
                          className={cn(
                            "inline-flex items-center justify-center h-10 w-10 rounded-md text-body transition-colors cursor-pointer",
                            currentPage === page
                              ? "border bg-background font-medium"
                              : "hover:bg-muted"
                          )}
                        >
                          {page}
                        </button>
                      )}
                    </PaginationItem>
                  ))}
                </div>

                <PaginationItem>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-body hover:bg-muted transition-colors cursor-pointer",
                      currentPage >= totalPages && "pointer-events-none opacity-50"
                    )}
                  >
                    <span className="hidden sm:inline">siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="text-body text-muted-foreground whitespace-nowrap sm:ml-4">
            página {currentPage} de {totalPages}
          </div>
        </footer>
      )}

      {/* Edit Credentials Modal */}
      {editingModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={handleCancelEdit}>
          <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4 border-b pb-4">
              <div className="space-y-1">
                <h3 className="text-title font-bold text-foreground lowercase">editar accesos</h3>
                <p className="text-body text-muted-foreground capitalize">
                  {editingModel.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-email" className="text-label font-medium text-muted-foreground lowercase">
                    correo electrónico
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 text-muted-foreground h-4 w-4" />
                    <input
                      id="edit-email"
                      type="email"
                      placeholder="nombre@ejemplo.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      disabled={isPending}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border bg-background text-body transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-password" className="text-label font-medium text-muted-foreground lowercase">
                    contraseña de acceso (mínimo 6 caracteres)
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 text-muted-foreground h-4 w-4" />
                    <input
                      id="edit-password"
                      type="text"
                      placeholder="mínimo 6 caracteres"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      required
                      disabled={isPending}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border bg-background text-body transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-4 border-t">
                {editingModel.login_password ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleClearPassword(editingModel.id)}
                    disabled={isPending}
                    className="lowercase text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    eliminar contraseña
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                    className="lowercase text-xs h-9"
                  >
                    cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="gap-1.5 lowercase text-xs h-9"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        guardar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
