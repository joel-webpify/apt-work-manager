import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, FileText, LogOut } from "lucide-react";
import { useQuotes } from "@/lib/quotesStore";
import { quotesForEmail, signOutPortal, usePortalSession } from "@/lib/portalSession";
import { docTotals, fmt, fmtDate, hasCustomerChoices } from "@/lib/quoteUtils";

/** The customer's little home page: every quote we've sent them. */
export default function PortalQuotes() {
  const [all] = useQuotes();
  const session = usePortalSession();
  const mine = useMemo(
    () => (session ? quotesForEmail(all, session.email) : []),
    [all, session],
  );

  if (!session) return <Navigate to="/portal" replace />;

  return (
    <main className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-medium">S</span>
            </div>
            <div>
              <div className="font-medium">ServiceCRM Trades Ltd</div>
              <div className="text-xs text-muted-foreground">{session.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={signOutPortal}
            className="h-9 px-3 rounded-md border-hairline text-sm inline-flex items-center gap-2 hover:bg-surface-hover"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        <h1 className="text-xl font-medium tracking-tight mb-1">Your quotes</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Open a quote to choose your options and accept it.
        </p>

        {mine.length === 0 ? (
          <div className="bg-card border-hairline rounded-xl p-6 text-sm text-muted-foreground">
            Nothing here yet. Any quote we send you will show up on this page.
          </div>
        ) : (
          <div className="space-y-2">
            {mine.map((q) => {
              const t = docTotals(q);
              const accepted = !!q.selection?.acceptedAt;
              return (
                <Link
                  key={q.id}
                  to={`/quote/${q.id}`}
                  className="block bg-card border-hairline rounded-xl p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {q.number}
                        {accepted ? (
                          <span className="text-xs text-[hsl(var(--success))] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        ) : hasCustomerChoices(q.items) ? (
                          <span className="text-xs px-1.5 py-0.5 rounded border-hairline text-muted-foreground">
                            Options to choose
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Sent {fmtDate(q.issueDate)} · valid until {fmtDate(q.validUntil)}
                      </div>
                    </div>
                    <div className="text-sm tabular-nums shrink-0">{fmt(t.total)}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8">
          Questions? hello@servicecrm.co.uk · 0117 000 0000
        </p>
      </div>
    </main>
  );
}
