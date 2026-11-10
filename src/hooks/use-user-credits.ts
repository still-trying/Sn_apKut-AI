import { useState, useEffect, useCallback } from "react";
import {
  UserCreditsData,
  getUserCredits,
  deductCreditOnSuccess,
  addCredits,
  upgradeToPro,
  canProcessImage,
  rotateLocalApiKey,
  CREDITS_EVENT,
} from "@/lib/credits-storage";

export function useUserCredits() {
  const [creditsData, setCreditsData] = useState<UserCreditsData>(getUserCredits());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCreditsData(getUserCredits());
    setIsLoaded(true);

    const handleUpdate = () => {
      setCreditsData(getUserCredits());
    };

    window.addEventListener(CREDITS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CREDITS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const deduct = useCallback(() => {
    return deductCreditOnSuccess();
  }, []);

  const add = useCallback((amount: number) => {
    return addCredits(amount);
  }, []);

  const makePro = useCallback(() => {
    return upgradeToPro();
  }, []);

  const rotateKey = useCallback((newKey?: string) => {
    return rotateLocalApiKey(newKey);
  }, []);

  const hasCredits = useCallback(() => {
    return canProcessImage();
  }, []);

  return {
    creditsData,
    isLoaded,
    plan: creditsData.plan,
    creditsRemaining: creditsData.creditsRemaining,
    totalProcessed: creditsData.totalProcessed,
    monthProcessed: creditsData.monthProcessed,
    apiKey: creditsData.apiKey,
    hasCredits,
    deduct,
    add,
    makePro,
    rotateKey,
  };
}

