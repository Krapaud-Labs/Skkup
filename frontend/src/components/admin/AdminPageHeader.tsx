import type { ReactNode } from "react";

/** Page header shared by secondary Admin routes and aligned with Viewer tokens. */
export function AdminPageHeader({
  kicker,
  title,
  description,
  aside,
}: {
  kicker: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="skuup-admin-page-heading">
      <div className="skuup-admin-page-heading-copy">
        <p className="skuup-kicker">{kicker}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="skuup-admin-page-heading-aside">{aside}</div>}
    </header>
  );
}
