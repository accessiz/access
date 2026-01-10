import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type KPICardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  href?: string;
  className?: string;
};

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  href,
  className,
}: KPICardProps) {
  const card = (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/30",
        href && "cursor-pointer",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-body font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className={cn("h-5 w-5", iconClassName)} /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-display font-semibold">{value}</div>
        {description ? (
          <p className="text-label text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
