interface SettingsHeaderProps {
  title: string;
  description: string;
}

export function SettingsHeader({ title, description }: SettingsHeaderProps) {
  return (
    <div className="pb-2 flex-shrink-0">
      <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground/80">{description}</p>
    </div>
  );
}
