"use client";

import { useTranslation } from "@/lib/translation-context";

type Props = {
  createdAt: string;
  dpdLabelCreatedAt?: string | null;
  dpdSentAt?: string | null;
  dpdDeliveredAt?: string | null;
  dpdLastStatus?: string | null;
};

type StepId = "created" | "tracking" | "sent" | "delivered";

export function OrderTimeline({
  createdAt,
  dpdLabelCreatedAt,
  dpdSentAt,
  dpdDeliveredAt,
  dpdLastStatus,
}: Props) {
  const { t } = useTranslation();

  const steps: { id: StepId; label: string; date?: string; done: boolean }[] = [
    {
      id: "created",
      label: t("account.timelineCreated"),
      date: createdAt,
      done: true,
    },
    {
      id: "tracking",
      label: t("account.timelineTracking"),
      date: dpdLabelCreatedAt ?? undefined,
      done: !!dpdLabelCreatedAt,
    },
    {
      id: "sent",
      label: t("account.timelineSent"),
      date: dpdSentAt ?? undefined,
      done: !!dpdSentAt,
    },
    {
      id: "delivered",
      label: t("account.timelineDelivered"),
      date: dpdDeliveredAt ?? undefined,
      done: !!dpdDeliveredAt,
    },
  ];

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 last:flex-none">
            <div className="flex items-center">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                  step.done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`ml-1 h-[2px] flex-1 ${
                    steps[index + 1].done ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="mt-1 text-xs">
              <p
                className={
                  step.done ? "font-medium text-gray-900" : "text-gray-500"
                }
              >
                {step.label}
              </p>
              <p className="text-[11px] text-gray-500">
                {step.date
                  ? new Date(step.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : step.done
                  ? ""
                  : t("account.timelinePending")}
              </p>
            </div>
          </div>
        ))}
      </div>
      {dpdLastStatus && (
        <p className="text-[11px] text-gray-500">
          {t("account.timelineLastStatus")}: {dpdLastStatus}
        </p>
      )}
    </div>
  );
}

