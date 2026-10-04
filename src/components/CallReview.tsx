import { CheckCircle2, CircleHelp, MinusCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { normalizeCallReview, REVIEW_QUESTIONS, type CallReviewItem } from "@/lib/call-review";

const status = {
  yes: { label: "Yes", tone: "text-success", Icon: CheckCircle2 },
  partial: { label: "Partly", tone: "text-accent", Icon: MinusCircle },
  no: { label: "No", tone: "text-destructive", Icon: XCircle },
  not_observed: { label: "Not observed", tone: "text-muted-foreground", Icon: CircleHelp },
};

export function CallReview({ review }: { review?: CallReviewItem[] | null }) {
  const items = normalizeCallReview(review);
  return (
    <Card className="card-soft mt-4">
      <CardHeader>
        <h2 className="text-base font-semibold leading-none">Call moments</h2>
        <p className="text-xs text-muted-foreground">A listening-based review of what happened, without replaying the conversation.</p>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {REVIEW_QUESTIONS.map((question, index) => {
          const item = items[index];
          const result = status[item?.answer ?? "not_observed"];
          return (
            <div key={question.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <result.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${result.tone}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-medium">{question.label}</p>
                  <span className={`text-xs font-semibold ${result.tone}`}>{result.label}</span>
                </div>
                {item?.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}