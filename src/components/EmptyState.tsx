import Icon from "./Icon";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = "search", title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mb-4">
        <Icon name={icon} className="w-6 h-6 text-text-tertiary" />
      </div>
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      {description && <p className="text-xs text-text-secondary max-w-xs">{description}</p>}
    </div>
  );
}
