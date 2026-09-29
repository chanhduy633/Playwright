interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  tone?: "default" | "success" | "danger" | "warning";
}

const TONE = {
  default: "text-gray-900",
  success: "text-green-600",
  danger: "text-red-600",
  warning: "text-amber-600",
} as const;

export function StatCard({ title, value, description, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${TONE[tone]}`}>{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  );
}