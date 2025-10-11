
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Model } from '@/lib/types';

type FormData = Omit<Model, 'id' | 'created_at' | 'profile_completion' | 'status'>;

const initialState: FormData = {
    alias: '',
    full_name: '',
    national_id: '',
    gender: null,
    birth_date: '',
    country: null,
    height_cm: null,
    shoulders_cm: null,
    chest_cm: null,
    bust_cm: null,
    waist_cm: null,
    hips_cm: null,
    top_size: '',
    pants_size: '',
    shoe_size_eu: null,
    eye_color: '',
    hair_color: '',
    instagram: '',
    tiktok: '',
    email: '',
    phone_number: '',
};

export function AddTalentSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialState);
  const supabase = createClient();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['height_cm', 'shoulders_cm', 'chest_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'shoe_size_eu'].includes(name);
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : (isNumeric ? Number(value) : value) }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanedData: Partial<FormData> = {};
    for (const key in formData) {
      if (formData[key as keyof FormData] !== null && formData[key as keyof FormData] !== '') {
        cleanedData[key as keyof FormData] = formData[key as keyof FormData];
      }
    }

    const { error } = await supabase.from('models').insert([cleanedData]);

    setLoading(false);
    if (error) {
      console.error('Error creating model:', error);
      toast.error('Error al crear el perfil', {
        description: error.message,
      });
    } else {
      toast.success('Talento añadido con éxito', {
        description: `${formData.alias || formData.full_name} ha sido añadido a la base de datos.`,
      });
      setIsOpen(false);
      setFormData(initialState);
      router.refresh();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Añadir Nuevo Talento</SheetTitle>
          <SheetDescription>
            Rellena los datos para crear un nuevo perfil. Los campos marcados con * son obligatorios.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* LA SOLUCIÓN: Padding en el contenedor para alinear todo y evitar el corte */}
            <div className="px-4 pr-6">
                <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Información Básica</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="alias">Alias *</Label>
                          <Input id="alias" name="alias" value={formData.alias || ''} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Nombre Completo *</Label>
                          <Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="birth_date">Nacimiento</Label>
                          <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">País</Label>
                          <Select onValueChange={(value) => handleSelectChange('country', value)} value={formData.country || undefined}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Guatemala">Guatemala</SelectItem>
                              <SelectItem value="El Salvador">El Salvador</SelectItem>
                              <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="national_id">Documento ID</Label>
                            <Input id="national_id" name="national_id" value={formData.national_id || ''} onChange={handleChange} />
                        </div>
                         <div className="grid gap-2">
                          <Label htmlFor="gender">Género</Label>
                          <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender || undefined}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Female">Femenino</SelectItem>
                              <SelectItem value="Male">Masculino</SelectItem>
                              <SelectItem value="Other">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>Medidas y Tallas</AccordionTrigger>
                    <AccordionContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                        <div className="grid gap-2"><Label htmlFor="height_cm">Estatura (cm)</Label><Input id="height_cm" name="height_cm" type="number" placeholder="180" value={formData.height_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="shoulders_cm">Hombros (cm)</Label><Input id="shoulders_cm" name="shoulders_cm" type="number" placeholder="45" value={formData.shoulders_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="chest_cm">Pecho (cm)</Label><Input id="chest_cm" name="chest_cm" type="number" placeholder="95" value={formData.chest_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="bust_cm">Busto (cm)</Label><Input id="bust_cm" name="bust_cm" type="number" placeholder="90" value={formData.bust_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="waist_cm">Cintura (cm)</Label><Input id="waist_cm" name="waist_cm" type="number" placeholder="60" value={formData.waist_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="hips_cm">Cadera (cm)</Label><Input id="hips_cm" name="hips_cm" type="number" placeholder="90" value={formData.hips_cm || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="top_size">Talla Superior</Label><Input id="top_size" name="top_size" placeholder="S, M..." value={formData.top_size || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="pants_size">Pantalón</Label><Input id="pants_size" name="pants_size" placeholder="28, 30..." value={formData.pants_size || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="shoe_size_eu">Zapato (EU)</Label><Input id="shoe_size_eu" name="shoe_size_eu" type="number" placeholder="39" value={formData.shoe_size_eu || ''} onChange={handleChange} /></div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>Apariencia</AccordionTrigger>
                    <AccordionContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                        <div className="grid gap-2"><Label htmlFor="hair_color">Color de Cabello</Label><Input id="hair_color" name="hair_color" value={formData.hair_color || ''} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="eye_color">Color de Ojos</Label><Input id="eye_color" name="eye_color" value={formData.eye_color || ''} onChange={handleChange} /></div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>Redes y Contacto</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                       <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                         <div className="grid gap-2"><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="instagram" placeholder="usuario" value={formData.instagram || ''} onChange={handleChange} /></div>
                         <div className="grid gap-2"><Label htmlFor="tiktok">TikTok</Label><Input id="tiktok" name="tiktok" placeholder="usuario" value={formData.tiktok || ''} onChange={handleChange} /></div>
                         <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email || ''} onChange={handleChange} /></div>
                         <div className="grid gap-2"><Label htmlFor="phone_number">Teléfono</Label><Input id="phone_number" name="phone_number" placeholder="+502 1234 5678" value={formData.phone_number || ''} onChange={handleChange} /></div>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </div>
          </div>
          <SheetFooter className="pt-6 border-t mt-auto">
            <SheetClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
