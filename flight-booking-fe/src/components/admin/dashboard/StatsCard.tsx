import React from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
}

const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    yellow: "bg-yellow-100 text-yellow-600",
    pink: "bg-pink-100 text-pink-600",
};

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    trend,
    color = "blue",
}) => {
    const isPositiveTrend = trend?.startsWith("+");
    const iconColorClasses = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
            {/* Icon */}
            <div
                className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${iconColorClasses}`}
            >
                {icon}
            </div>

            {/* Text Info */}
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-500 truncate">
                    {title}
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{value}</span>
                    {trend && (
                        <span
                            className={`text-xs font-semibold ${isPositiveTrend ? "text-green-500" : "text-red-500"
                                }`}
                        >
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
