import React from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
}

const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    gold: { iconBg: "bg-yellow-100", iconText: "text-yellow-600" },
    blue: { iconBg: "bg-blue-100", iconText: "text-blue-600" },
    green: { iconBg: "bg-green-100", iconText: "text-green-600" },
    orange: { iconBg: "bg-orange-100", iconText: "text-orange-600" },
    red: { iconBg: "bg-red-100", iconText: "text-red-600" },
    purple: { iconBg: "bg-purple-100", iconText: "text-purple-600" },
    indigo: { iconBg: "bg-indigo-100", iconText: "text-indigo-600" },
    yellow: { iconBg: "bg-yellow-100", iconText: "text-yellow-600" },
    pink: { iconBg: "bg-pink-100", iconText: "text-pink-600" },
};

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    trend,
    color = "gold",
}) => {
    const isPositiveTrend = trend?.startsWith("+");
    const palette = colorMap[color] || colorMap.gold;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
            {/* Left: Value + Label */}
            <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold text-gray-900 leading-tight">
                    {value}
                </span>
                <span className="text-sm text-gray-500 mt-1.5 truncate">{title}</span>
                {trend && (
                    <span
                        className={`text-xs font-semibold mt-2 ${isPositiveTrend ? "text-green-500" : "text-red-500"
                            }`}
                    >
                        {trend} so với hôm qua
                    </span>
                )}
            </div>

            {/* Right: Icon */}
            <div
                className={`flex items-center justify-center w-14 h-14 rounded-full shrink-0 ${palette.iconBg} ${palette.iconText}`}
            >
                {icon}
            </div>
        </div>
    );
};

export default StatsCard;
