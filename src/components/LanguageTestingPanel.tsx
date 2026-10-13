"use client";

import { useState } from "react";
import {
  LANGUAGE_MODE_OPTIONS,
  type LanguageMode,
  type LanguageSessionReport,
} from "@/lib/language";
import { LANGUAGE_TEST_SCENARIOS } from "@/lib/test-scenarios";

type LanguageTestingPanelProps = {
  mode: LanguageMode;
  disabled: boolean;
  report: LanguageSessionReport | null;
  onModeChange: (mode: LanguageMode) => void;
};

export function LanguageTestingPanel({
  mode,
  disabled,
  report,
  onModeChange,
}: LanguageTestingPanelProps) {
  const [scenarioId, setScenarioId] = useState(LANGUAGE_TEST_SCENARIOS[0]?.id ?? "");
  const scenario =
    LANGUAGE_TEST_SCENARIOS.find((item) => item.id === scenarioId) ??
    LANGUAGE_TEST_SCENARIOS[0];

  return (
    <section className="desk-panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] text-[#f6efe4]">Language testing</h2>
        <p className="text-[12px] text-[#9c8e7c]">Demo only</p>
      </div>
      <p className="mt-2 text-[13px] leading-6 text-[#9c8e7c]">
        Leave Auto-detect for normal calls — that uses Maya’s original dashboard agent.
        English / Hindi / Marwari only add a light test hint. Scripts stay here and never
        enter the live call log.
      </p>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Language for the next call"
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
      {disabled ? (
        <p className="mt-2 text-[12px] text-[#9c8e7c]">
          Language applies on the next call. The current microphone session is left as-is.
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-3 py-2.5 text-[13px] leading-6 text-[#cbbfae]">
        <p className="text-[11px] text-[#9c8e7c]">Session language</p>
        <p className="mt-1 text-[#f6efe4]">
          {report?.engineLanguageLabel ?? "Uses the agent default until you place a call"}
        </p>
        {report?.limitation ? (
          <p className="mt-2 text-[12px] leading-5 text-[#9c8e7c]">{report.limitation}</p>
        ) : null}
        {report?.asrNote ? (
          <p className="mt-2 text-[12px] text-[#9c8e7c]">ASR: {report.asrNote}</p>
        ) : null}
        {report?.error ? (
          <p className="mt-2 text-[12px] text-[#e15b4c]">{report.error}</p>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-[11px] text-[#9c8e7c]">Marwari test scripts</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_TEST_SCENARIOS.map((item) => {
            const selected = scenario?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScenarioId(item.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] ${
                  selected
                    ? "border border-[rgba(224,196,138,0.4)] text-[#f6efe4]"
                    : "border border-[rgba(224,196,138,0.14)] text-[#cbbfae]"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      {scenario ? (
        <div className="mt-4 rounded-xl border border-dashed border-[rgba(224,196,138,0.28)] bg-black/10 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#e0c48a]">
            Scripted test · not live speech
          </p>
          <p className="mt-2 text-[13px] text-[#cbbfae]">{scenario.language}</p>
          <p className="mt-2 text-[14px] leading-6 text-[#f6efe4]">{scenario.speak}</p>
          {scenario.romanized ? (
            <p className="mt-2 text-[12px] leading-5 text-[#9c8e7c]">{scenario.romanized}</p>
          ) : null}
          <p className="mt-3 text-[13px] leading-6 text-[#cbbfae]">{scenario.expect}</p>
        </div>
      ) : null}
    </section>
  );
}
