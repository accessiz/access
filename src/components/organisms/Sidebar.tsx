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
        { href: "/dashboard/settings", label: "Configuración", icon: Settings },
    ];

    return (
        <div className="hidden border-r bg-muted md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                           <GalleryVerticalEnd className="size-5" />
                        </div>
                        <span className="">IZ Access</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    pathname === link.href && "bg-secondary text-primary-foreground"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    )
}

