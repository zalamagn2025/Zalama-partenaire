"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  masked?: boolean;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
  masked = true,
}: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mettre à jour les refs quand la longueur change
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    // Ne permettre que les chiffres
    if (!/^\d*$/.test(inputValue)) return;

    const newValue = value.split("");
    newValue[index] = inputValue;
    const updatedValue = newValue.join("").slice(0, length);

    onChange(updatedValue);

    // Si on a saisi un chiffre, passer au champ suivant
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Si on a complété tous les champs, appeler onComplete
    if (updatedValue.length === length) {
      onComplete?.(updatedValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Gérer la navigation avec les flèches et backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      
      const newValue = value.split("");
      if (newValue[index]) {
        // Si le champ actuel a une valeur, la supprimer
        newValue[index] = "";
        onChange(newValue.join(""));
      } else if (index > 0) {
        // Sinon, aller au champ précédent et supprimer sa valeur
        newValue[index - 1] = "";
        onChange(newValue.join(""));
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    
    // Ne garder que les chiffres
    const numbersOnly = pastedData.replace(/\D/g, "");
    
    if (numbersOnly.length <= length) {
      onChange(numbersOnly);
      
      // Focus sur le dernier champ rempli ou le premier vide
      const nextIndex = Math.min(numbersOnly.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);
      
      // Si on a complété tous les champs, appeler onComplete
      if (numbersOnly.length === length) {
        onComplete?.(numbersOnly);
      }
    }
  };

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <div
          key={index}
          className={cn(
            "relative w-12 h-12 rounded-lg border-2 transition-all duration-200",
            "flex items-center justify-center",
            "bg-white dark:bg-gray-800",
            "hover:border-blue-300 dark:hover:border-blue-600",
            focusedIndex === index && "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800",
            error && "border-red-500 dark:border-red-400",
            !error && !focusedIndex && value[index] && "border-green-500 dark:border-green-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={masked ? (value[index] ? "•" : "") : (value[index] || "")}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            disabled={disabled}
            className={cn(
              "w-full h-full text-center text-xl font-bold",
              "bg-transparent border-none outline-none",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-600",
              disabled && "cursor-not-allowed"
            )}
            autoComplete="off"
          />
        </div>
      ))}
    </div>
  );
}
