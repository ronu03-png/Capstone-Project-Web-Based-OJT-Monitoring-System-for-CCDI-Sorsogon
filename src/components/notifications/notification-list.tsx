"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notification-actions";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function open(n: NotificationItem) {
    startTransition(async () => {
      if (!n.is_read) await markNotificationReadAction(n.id);
      if (n.link) router.push(n.link);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <Card
          key={n.id}
          role="button"
          tabIndex={0}
          onClick={() => open(n)}
          onKeyDown={(e) => e.key === "Enter" && open(n)}
          className={cn(
            "cursor-pointer p-4 transition-colors hover:bg-accent/40",
            n.is_read ? "opacity-60" : "border-l-4 border-l-brand-accent"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {!n.is_read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-accent" />}
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(n.created_at)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MarkAllReadButton({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!hasUnread || pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      <CheckCheck className="mr-1 h-4 w-4" />
      {pending ? "Marking..." : "Mark all as read"}
    </Button>
  );
}
