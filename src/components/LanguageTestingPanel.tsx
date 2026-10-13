"use client";

import {
  LANGUAGE_MODE_OPTIONS,
  type LanguageMode,
} from "@/lib/language";

type LanguageTestingPanelProps = {
  mode: LanguageMode;
  disabled: boolean;
  onModeChange: (mode: LanguageMode) => void;
};

export function LanguageTestingPanel({
  mode,
  disabled,
  onModeChange,
}: LanguageTestingPanelProps) {
  return (
    <section className="desk-panel p-5">
      <h2 className="text-[15px] text-[#f6efe4]">Language</h2>
      <p className="mt-2 text-[13px] leading-6 text-[#9c8e7c]">
        Choose how Maya should speak on the next call.
      </p>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Call language"
      >
        {LANGUAGE_MODE_OPTIONS.map((option) => {
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onModeChange(option.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] ${
                selected
                  ? "border border-[rgba(224,196,138,0.55)] bg-[rgba(224,196,138,0.16)] text-[#f6efe4]"
                  : "border border-[rgba(224,196,138,0.16)] text-[#cbbfae]"
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
