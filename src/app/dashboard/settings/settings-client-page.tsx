'use client';

import * as React from 'react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Mail, Phone, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type SettingsClientPageProps = {
    initialEmail: string;
    initialPhone: string;
};

export default function SettingsClientPage({
    initialEmail,
    initialPhone,
}: SettingsClientPageProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone);
    const [isSaving, setIsSaving] = useState(false);

    // Evitar hidratación mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleSaveContact = async () => {
        setIsSaving(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    agency_email: email,
                    agency_phone: phone,
                },
            });

            if (error) throw error;

            toast.success('Configuración guardada');
        } catch (error) {
            toast.error('Error al guardar configuración');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className="p-6 md:p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-heading-28 font-semibold">Configuración</h1>
                <p className="text-copy-14 text-muted-foreground">
                    Personaliza tu experiencia en IZ ACCESS
                </p>
            </div>

            <div className="space-y-6">
                {/* Tema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Apariencia</CardTitle>
                        <CardDescription>
                            Elige el tema de la interfaz
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mounted && (
                            <div className="flex gap-3">
                                <Button
                                    variant={isDark ? 'outline' : 'default'}
                                    className="flex-1 gap-2"
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun className="h-4 w-4" />
                                    Claro
                                    {!isDark && <Check className="h-4 w-4 ml-auto" />}
                                </Button>
                                <Button
                                    variant={isDark ? 'default' : 'outline'}
                                    className="flex-1 gap-2"
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon className="h-4 w-4" />
                                    Oscuro
                                    {isDark && <Check className="h-4 w-4 ml-auto" />}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contacto de la Agencia */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Contacto de la Agencia</CardTitle>
                        <CardDescription>
                            Información que aparecerá en el footer y comunicaciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="agency-email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </Label>
                            <Input
                                id="agency-email"
                                type="email"
                                placeholder="contacto@tuagencia.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="agency-phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Teléfono
                            </Label>
                            <Input
                                id="agency-phone"
                                type="tel"
                                placeholder="+502 5555-1234"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleSaveContact}
                            disabled={isSaving}
                            className="w-full gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
