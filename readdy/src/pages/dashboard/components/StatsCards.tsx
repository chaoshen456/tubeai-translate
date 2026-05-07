import { Video, TrendingUp, Languages, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  {
    label: "Total Videos",
    value: "128",
    change: "+12",
    trend: "up",
    period: "this month",
    icon: Video,
    bg: "bg-emerald-500/[0.07]",
    iconBg: "bg-emerald-500/[0.12]",
    text: "text-emerald-600",
    iconColor: "text-emerald-500",
    border: "border-emerald-200/[0.3]",
  },
  {
    label: "Active Translations",
    value: "5",
    change: "2",
    trend: "up",
    period: "queued",
    icon: Languages,
    bg: "bg-amber-500/[0.07]",
    iconBg: "bg-amber-500/[0.12]",
    text: "text-amber-600",
    iconColor: "text-amber-500",
    border: "border-amber-200/[0.3]",
  },
  {
    label: "Success Rate",
    value: "94%",
    change: "+2%",
    trend: "up",
    period: "from last month",
    icon: CheckCircle,
    bg: "bg-teal-500/[0.07]",
    iconBg: "bg-teal-500/[0.12]",
    text: "text-teal-600",
    iconColor: "text-teal-500",
    border: "border-teal-200/[0.3]",
  },
  {
    label: "Total Views",
    value: "452K",
    change: "+18%",
    trend: "up",
    period: "this month",
    icon: TrendingUp,
    bg: "bg-rose-500/[0.07]",
    iconBg: "bg-rose-500/[0.12]",
    text: "text-rose-600",
    iconColor: "text-rose-500",
    border: "border-rose-200/[0.3]",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
        return (
          <div
            key={stat.label}
            className={`group relative rounded-2xl border ${stat.border} bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-default`}
          >
            {/* Subtle background tint */}
            <div className={`absolute inset-0 rounded-2xl ${stat.bg} opacity-50`} />

            <div className="relative flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-primary mt-1.5 tracking-tight">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                    <TrendIcon className="w-3 h-3" />
                    {stat.change}
                  </span>
                  <span className="text-[12px] text-muted-foreground">{stat.period}</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
