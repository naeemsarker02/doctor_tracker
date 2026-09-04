import { cn } from "@/lib/cn";
import { getAssetUrl } from "@/lib/api";

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function Avatar({
    name,
    avatarUrl,
    size = "md",
    className,
}: {
    name: string;
    avatarUrl?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}) {
    const sizeClasses = {
        sm: "size-8 text-xs",
        md: "size-9 text-sm",
        lg: "size-14 text-lg",
        xl: "size-24 text-3xl",
    }[size];

    const resolvedUrl = getAssetUrl(avatarUrl);

    if (resolvedUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={resolvedUrl}
                alt={name}
                className={cn(sizeClasses, "shrink-0 rounded-full object-cover", className)}
            />
        );
    }

    return (
        <div
            className={cn(
                sizeClasses,
                "flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white",
                className
            )}
        >
            {getInitials(name) || "?"}
        </div>
    );
}
