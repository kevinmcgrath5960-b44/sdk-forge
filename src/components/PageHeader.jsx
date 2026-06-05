import React from "react";

export default function PageHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
        )}
        <h1 className="text-2xl font-bold font-heading tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground ml-12">{description}</p>
      )}
    </div>
  );
}