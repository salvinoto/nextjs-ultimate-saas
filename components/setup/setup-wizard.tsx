"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { WelcomeStep } from "./steps/welcome-step";
import { DatabaseStep } from "./steps/database-step";
import { AuthStep } from "./steps/auth-step";
import { EmailStep } from "./steps/email-step";
import { PaymentsStep } from "./steps/payments-step";
import { CompleteStep } from "./steps/complete-step";
import { SETUP_STEPS, getStepProgress, type SetupStep, type SetupFormData } from "@/lib/setup/types";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [direction, setDirection] = useState(0);
  const [isPending, startTransition] = useTransition();
  
  const [formData, setFormData] = useState<Partial<SetupFormData>>({
    database: { DATABASE_URL: "" },
    auth: { 
      BETTER_AUTH_URL: "http://localhost:3000", 
      BETTER_AUTH_SECRET: "", 
      BETTER_AUTH_EMAIL: "delivered@resend.dev" 
    },
    email: { RESEND_API_KEY: "" },
    payments: { 
      POLAR_ACCESS_TOKEN: "", 
      POLAR_ORGANIZATION_ID: "", 
      POLAR_SERVER: "sandbox" 
    },
  });

  const progress = getStepProgress(currentStep);

  const goToStep = (step: SetupStep) => {
    const currentIndex = SETUP_STEPS.indexOf(currentStep);
    const nextIndex = SETUP_STEPS.indexOf(step);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    startTransition(() => {
      setCurrentStep(step);
    });
  };

  const nextStep = () => {
    const currentIndex = SETUP_STEPS.indexOf(currentStep);
    if (currentIndex < SETUP_STEPS.length - 1) {
      goToStep(SETUP_STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = SETUP_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(SETUP_STEPS[currentIndex - 1]);
    }
  };

  const updateFormData = <K extends keyof SetupFormData>(
    section: K,
    data: Partial<SetupFormData[K]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-3xl mx-auto py-4 px-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground font-mono">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="flex justify-between mt-2">
            {SETUP_STEPS.map((step, index) => (
              <button
                key={step}
                onClick={() => index <= SETUP_STEPS.indexOf(currentStep) && goToStep(step)}
                disabled={index > SETUP_STEPS.indexOf(currentStep)}
                className={`text-xs capitalize transition-colors ${
                  step === currentStep
                    ? "text-primary font-medium"
                    : index < SETUP_STEPS.indexOf(currentStep)
                    ? "text-muted-foreground hover:text-foreground cursor-pointer"
                    : "text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 container max-w-3xl mx-auto py-12 px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {currentStep === "welcome" && (
              <WelcomeStep onNext={nextStep} />
            )}
            {currentStep === "database" && (
              <DatabaseStep
                data={formData.database!}
                onUpdate={(data) => updateFormData("database", data)}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === "auth" && (
              <AuthStep
                data={formData.auth!}
                onUpdate={(data) => updateFormData("auth", data)}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === "email" && (
              <EmailStep
                data={formData.email!}
                onUpdate={(data) => updateFormData("email", data)}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === "payments" && (
              <PaymentsStep
                data={formData.payments!}
                onUpdate={(data) => updateFormData("payments", data)}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === "complete" && (
              <CompleteStep
                formData={formData as SetupFormData}
                onPrev={prevStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

