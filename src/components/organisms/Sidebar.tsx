
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GalleryVerticalEnd, Users, FolderKanban, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname();

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: GalleryVerticalEnd },
        { href: "/dashboard/models", label: "Talento", icon: Users },
        { href: "/dashboard/projects", label: "Proyectos", icon: FolderKanban },
    ];

    const settingsLink = { href: "/dashboard/settings", label: "Configuración", icon: Settings };

    return (
        <div className="hidden border-r bg-sidebar-background md:block">
            <div className="flex h-full max-h-screen flex-col">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                           <GalleryVerticalEnd className="size-5" />
                        </div>
                        <span className="text-heading-16">IZ Access</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-label-14 text-muted-foreground transition-all hover:text-primary",
                                    (pathname.startsWith(link.href) && link.href !== "/dashboard") || pathname === link.href
                                        ? "bg-secondary text-primary-foreground"
                                        : ""
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                 <div className="mt-auto px-4 pb-12">
                    <nav className="grid items-start">
                         <Link
                            href={settingsLink.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-label-14 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith(settingsLink.href) && "bg-secondary text-primary-foreground"
                            )}
                        >
                            <settingsLink.icon className="h-4 w-4" />
                            {settingsLink.label}
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    )
}
