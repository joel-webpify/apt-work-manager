import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuotes } from "@/lib/quotesStore";
import {
  knownCustomerEmails,
  normEmail,
  quotesForEmail,
  requestCode,
  usePortalSession,
  verifyCode,
} from "@/lib/portalSession";

/**
 * Customer sign-in for the quote portal. They type their email, we show a
 * six-digit code (a real build would email it) and they type it back.
 */
export default function PortalLogin() {
  const [all] = useQuotes();
  const session = usePortalSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState("");

  const emails = useMemo(() => knownCustomerEmails(all), [all]);

  if (session) return <Navigate to={next || "/portal/quotes"} replace />;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normEmail(email);
    if (!clean.includes("@")) {
      toast({ title: "Please enter your email address" });
      return;
    }
    if (quotesForEmail(all, clean).length === 0) {
      toast({
        title: "We can't find a quote for that email",
        description: "Please use the address we sent your quote to.",
      });
      return;
    }
    setSentCode(requestCode(clean));
    setStep("code");
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode(email, code)) {
      toast({ title: "That code doesn't match", description: "Check the code and try again." });
      return;
    }
    navigate(next || "/portal/quotes", { replace: true });
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-base font-medium">S</span>
          </div>
          <div>
            <div className="font-medium">ServiceCRM Trades Ltd</div>
            <div className="text-xs text-muted-foreground">Your quotes, in one place</div>
          </div>
        </div>

        <div className="bg-card border-hairline rounded-xl p-6">
          {step === "email" ? (
            <form onSubmit={send} className="space-y-3">
              <h1 className="text-lg font-medium">See your quote</h1>
              <p className="text-sm text-muted-foreground">
                Pop in the email address we sent your quote to and we'll send you a code.
              </p>
              <div>
                <Label htmlFor="portal-email">Email</Label>
                <Input
                  id="portal-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.co.uk"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
              >
                <Mail className="w-4 h-4" /> Send me a code
              </button>
              {emails.length > 0 && (
                <div className="pt-2 border-t-hairline">
                  <div className="text-xs text-muted-foreground mb-1">
                    Demo addresses with quotes on file:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {emails.slice(0, 6).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmail(e)}
                        className="text-xs px-2 py-1 rounded-md border-hairline hover:bg-surface-hover"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={check} className="space-y-3">
              <h1 className="text-lg font-medium">Enter your code</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a six-digit code to {normEmail(email)}.
              </p>
              <div className="rounded-md bg-surface border-hairline p-3 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  Demo code: <span className="font-medium tabular-nums tracking-widest">{sentCode}</span>
                </span>
              </div>
              <div>
                <Label htmlFor="portal-code">Code</Label>
                <Input
                  id="portal-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="tracking-widest"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          ServiceCRM Trades Ltd · 12 Park St, Bristol BS1 5HX
        </p>
      </div>
    </main>
  );
}
