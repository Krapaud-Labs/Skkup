import type { ReactNode } from "react";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

/** Page header shared by secondary Admin routes and aligned with Viewer tokens. */
export function AdminPageHeader({
  kicker,
  title,
  icon,
  description,
  aside,
}: {
  kicker: string;
  title: string;
  icon: SkkupIconName;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="skuup-admin-page-heading">
      <div className="skuup-admin-page-heading-copy">
        <p className="skuup-kicker">{kicker}</p>
        <h1 className="skuup-dashboard-page-title flex items-center gap-3"><SkkupIcon name={icon} size={40} />{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="skuup-admin-page-heading-aside">{aside}</div>}
    </header>
  );
}
