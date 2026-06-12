import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { PricingPlan } from "@/data/pricing-plans";
import { CreditCard, Landmark, CheckCircle2, Loader2, ShieldCheck, Upload, AlertCircle } from "lucide-react";

interface CheckoutModalProps {
  plan: PricingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  billingPeriod: "monthly" | "annually";
}

export function CheckoutModal({ plan, isOpen, onClose, billingPeriod }: CheckoutModalProps) {
  const { t, locale } = useI18n();
  const { updateSubscription } = useAuth();
  
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [cardholder, setCardholder] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<string | null>(null);

  // Card brand detection
  const cardBrand = React.useMemo(() => {
    if (!cardNumber) return null;
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.startsWith("607") || cleanNum.startsWith("628")) {
      return "dahabia";
    }
    if (cleanNum.length > 0) {
      return "cib";
    }
    return null;
  }, [cardNumber]);

  React.useEffect(() => {
    if (isOpen) {
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setCardholder("");
      setIsProcessing(false);
      setIsSuccess(false);
      setUploadedFile(null);
    }
  }, [isOpen]);

  if (!plan) return null;

  const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnually;
  const formattedPrice = typeof price === "number" ? `${price.toLocaleString()} DZD` : t("pricing.custom_price");

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await updateSubscription(plan.id);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await updateSubscription(plan.id);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleMockUpload = () => {
    setUploadedFile("recu_matax_payment.pdf");
  };

  const isRtl = locale === "ar";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border p-6 rounded-lg shadow-xl" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className={isRtl ? "text-right" : "text-left"}>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t("pricing.checkout.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {t(`pricing.plan.${plan.id}`)} — {formattedPrice} ({t(`pricing.${billingPeriod}`)})
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("pricing.checkout.success")}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {t(`pricing.plan.${plan.id}`)} is now active
            </p>
          </div>
        ) : (
          <Tabs defaultValue="card" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-md">
              <TabsTrigger value="card" className="flex items-center gap-2 py-2 rounded-sm text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                {t("pricing.cib_dahabia")}
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-2 py-2 rounded-sm text-sm font-medium">
                <Landmark className="h-4 w-4" />
                {t("pricing.bank_transfer")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <form onSubmit={handleCardSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-sm font-medium">
                    {t("pricing.checkout.card_number")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      required
                      placeholder="6070 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => {
                        // Format credit card spaces
                        const val = e.target.value.replace(/\D/g, "").substring(0, 16);
                        const parts = [];
                        for (let i = 0; i < val.length; i += 4) {
                          parts.push(val.substring(i, i + 4));
                        }
                        setCardNumber(parts.join(" "));
                      }}
                      className="pr-12 pl-3 h-10 border-border"
                      disabled={isProcessing}
                    />
                    <div className={`absolute ${isRtl ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 flex items-center`}>
                      {cardBrand === "dahabia" && (
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                          DAHABIA
                        </span>
                      )}
                      {cardBrand === "cib" && (
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300">
                          CIB
                        </span>
                      )}
                      {!cardBrand && <CreditCard className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-sm font-medium">
                      {t("pricing.checkout.expiry")}
                    </Label>
                    <Input
                      id="expiry"
                      required
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) {
                          val = val.substring(0, 2) + "/" + val.substring(2, 4);
                        }
                        setExpiry(val.substring(0, 5));
                      }}
                      className="h-10 border-border"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-sm font-medium">
                      {t("pricing.checkout.cvv")}
                    </Label>
                    <Input
                      id="cvv"
                      required
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      className="h-10 border-border"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholder" className="text-sm font-medium">
                    {t("pricing.checkout.cardholder")}
                  </Label>
                  <Input
                    id="cardholder"
                    required
                    placeholder="SMAIN MEZIANI"
                    value={cardholder}
                    onChange={(e) => setCardholder(e.target.value.toUpperCase())}
                    className="h-10 border-border"
                    disabled={isProcessing}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded text-amber-800 dark:text-amber-300 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {t("pricing.confirm_payment")} (Simulé). Aucun débit réel ne sera effectué sur votre carte.
                  </span>
                </div>

                <Button type="submit" className="w-full h-11 cursor-pointer font-semibold" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("pricing.checkout.processing")}
                    </>
                  ) : (
                    t("pricing.confirm_payment")
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="transfer">
              <form onSubmit={handleOfflineSubmit} className="space-y-4">
                <div className="bg-muted/30 border border-border p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">{t("pricing.checkout.rib")}</span>
                    <span className="font-mono font-semibold text-foreground">007 99999 0000123456 78</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">{t("pricing.checkout.account_holder")}</span>
                    <span className="font-semibold text-foreground">Matax FinTech SPA</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("pricing.checkout.transfer_desc")}
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("pricing.checkout.upload_receipt")}</Label>
                  <div 
                    onClick={handleMockUpload}
                    className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer rounded-lg p-6 text-center transition-colors"
                  >
                    {uploadedFile ? (
                      <div className="flex flex-col items-center space-y-1">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <span className="text-xs font-semibold text-foreground">{uploadedFile}</span>
                        <span className="text-[10px] text-muted-foreground">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Click to upload transfer slip / check photo</span>
                        <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG (Max 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 cursor-pointer font-semibold" 
                  disabled={isProcessing || !uploadedFile}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("pricing.checkout.processing")}
                    </>
                  ) : (
                    t("pricing.upgrade")
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
