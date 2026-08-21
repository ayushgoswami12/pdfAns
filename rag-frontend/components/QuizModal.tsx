// FILE: components/QuizModal.tsx

"use client";

import { useState } from "react";

import type {
  QuizQuestion,
  QuizAnswer,
  QuizResult,
} from "@/lib/api";

import {
  submitQuizAttempt,
} from "@/lib/api";

import {
  IconClose,
  IconCheck,
} from "@/components/icons";

import {
  ACCENT_GRADIENT,
} from "@/lib/theme";


interface QuizModalProps {
  attemptId: number;
  questions: QuizQuestion[];
  onClose: () => void;
  onTryAgain: () => void;
  isGeneratingNextQuiz?: boolean;
}


export function QuizModal({
  attemptId,
  questions,
  onClose,
  onTryAgain,
  isGeneratingNextQuiz = false,
}: QuizModalProps) {

  const [index, setIndex] =
    useState(0);

  const [selected, setSelected] =
    useState<number | null>(null);

  const [answers, setAnswers] =
    useState<
      Record<number, number | null>
    >({});

  const [finished, setFinished] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [serverResult, setServerResult] =
    useState<QuizResult | null>(null);


  if (
    !questions ||
    questions.length === 0
  ) {
    return null;
  }


  const question =
    questions[index];

  const isLast =
    index === questions.length - 1;


  const pick = (
    optionIndex: number
  ) => {

    if (
      selected !== null ||
      saving ||
      finished
    ) {
      return;
    }

    setSelected(
      optionIndex
    );

    setAnswers(
      (current) => ({
        ...current,
        [question.id]:
          optionIndex,
      })
    );
  };


  const finishQuiz =
    async () => {

      if (
        selected === null ||
        saving
      ) {
        return;
      }

      setSaving(true);
      setSaveError(null);


      const payload: QuizAnswer[] =
        questions.map(
          (item) => ({
            question_id:
              item.id,

            selected_index:
              answers[item.id] ??
              null,
          })
        );


      try {

        const result =
          await submitQuizAttempt(
            attemptId,
            payload
          );

        setServerResult(
          result
        );

        setFinished(
          true
        );

      } catch (error) {

        setSaveError(
          error instanceof Error
            ? error.message
            : "Could not save quiz results."
        );

      } finally {

        setSaving(false);
      }
    };


  const next =
    async () => {

      if (
        selected === null
      ) {
        return;
      }

      if (
        isLast
      ) {
        await finishQuiz();
        return;
      }

      setIndex(
        (current) =>
          current + 1
      );

      setSelected(null);
    };


  const displayedScore =
    serverResult?.score ?? 0;

  const displayedTotal =
    serverResult?.total ??
    questions.length;

  const percentage =
    serverResult?.percentage ??
    0;


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

          <div>

            <p className="text-[15px] font-bold text-gray-900">
              🧠 Quick Quiz
            </p>

            {!finished && (
              <p className="text-[12px] text-gray-500 mt-0.5">
                Question {index + 1} of{" "}
                {questions.length}
              </p>
            )}

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={
              saving ||
              isGeneratingNextQuiz
            }
            aria-label="Close quiz"
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <IconClose
              width={16}
              height={16}
            />
          </button>

        </div>


        {/* ============================================================
            PROGRESS
        ============================================================ */}

        {!finished && (
          <div className="h-1 w-full bg-gray-100">

            <div
              className="h-full transition-[width] duration-300"
              style={{
                width: `${
                  (
                    (
                      index +
                      (
                        selected !==
                        null
                          ? 1
                          : 0
                      )
                    ) /
                    questions.length
                  ) * 100
                }%`,
                background:
                  ACCENT_GRADIENT,
              }}
            />

          </div>
        )}


        {/* ============================================================
            BODY
        ============================================================ */}

        <div className="px-6 py-6">

          {/* ==========================================================
              RESULTS
          ========================================================== */}

          {finished ? (

            <div className="text-center py-3">

              <div
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-white mx-auto mb-5"
                style={{
                  background:
                    ACCENT_GRADIENT,
                }}
              >

                <span className="text-[21px] font-bold">
                  {displayedScore}/
                  {displayedTotal}
                </span>

                <span className="text-[9px] opacity-80">
                  {percentage}%
                </span>

              </div>


              <p className="text-[18px] font-bold text-gray-900 mb-1">
                {displayedScore ===
                displayedTotal
                  ? "Perfect score!"
                  : displayedScore >=
                    displayedTotal / 2
                  ? "Nice work!"
                  : "Keep practising"}
              </p>


              <p className="text-[13px] text-gray-500 mb-5">
                You got{" "}
                {displayedScore}{" "}
                out of{" "}
                {displayedTotal}{" "}
                questions correct.
              </p>


              {/* Learning behavior */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4 text-left mb-6">

                <p className="text-[12.5px] font-bold text-violet-800 mb-1.5">
                  What happens in the next quiz?
                </p>

                <p className="text-[12px] leading-5 text-violet-700">
                  Any questions you got wrong will be brought
                  back first. The remaining slots will be filled
                  with new questions from your current chat and
                  your uploaded material.
                </p>

              </div>


              {/* Save error */}
              {saveError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">

                  <p className="text-[12px] font-semibold text-red-600">
                    {saveError}
                  </p>

                </div>
              )}


              {/* Actions */}
              <div className="flex flex-col gap-2.5">

                <button
                  type="button"
                  onClick={onTryAgain}
                  disabled={
                    isGeneratingNextQuiz ||
                    saving
                  }
                  className="w-full py-3 rounded-xl text-white text-[13.5px] font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      ACCENT_GRADIENT,
                  }}
                >

                  {isGeneratingNextQuiz
                    ? "Preparing next quiz..."
                    : "Try Again"}

                </button>


                <button
                  type="button"
                  onClick={onClose}
                  disabled={
                    isGeneratingNextQuiz ||
                    saving
                  }
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Done
                </button>

              </div>

            </div>

          ) : (

            <>
              {/* ======================================================
                  QUESTION
              ====================================================== */}

              <p className="text-[15.5px] font-semibold text-gray-900 mb-4 leading-relaxed">
                {question.question}
              </p>


              {/* ======================================================
                  OPTIONS
              ====================================================== */}

              <div className="flex flex-col gap-2 mb-4">

                {question.options.map(
                  (
                    option,
                    optionIndex
                  ) => {

                    const isCorrect =
                      optionIndex ===
                      question.correct_index;

                    const isPicked =
                      optionIndex ===
                      selected;

                    const answered =
                      selected !== null;


                    let style =
                      "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 text-gray-800";


                    if (
                      answered &&
                      isCorrect
                    ) {

                      style =
                        "border-emerald-400 bg-emerald-50 text-emerald-900";

                    } else if (
                      answered &&
                      isPicked &&
                      !isCorrect
                    ) {

                      style =
                        "border-red-300 bg-red-50 text-red-900";

                    } else if (
                      answered
                    ) {

                      style =
                        "border-gray-200 text-gray-400";
                    }


                    return (
                      <button
                        key={
                          optionIndex
                        }
                        type="button"
                        onClick={() =>
                          pick(
                            optionIndex
                          )
                        }
                        disabled={
                          answered ||
                          saving
                        }
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[14px] font-medium transition-colors ${style} disabled:cursor-default`}
                      >

                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            answered &&
                            isCorrect
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : answered &&
                                isPicked
                              ? "border-red-400 text-red-400"
                              : "border-gray-300 text-gray-400"
                          }`}
                        >

                          {answered &&
                          isCorrect ? (

                            <IconCheck
                              width={11}
                              height={11}
                            />

                          ) : (

                            String.fromCharCode(
                              65 +
                              optionIndex
                            )

                          )}

                        </span>


                        <span className="flex-1">
                          {option}
                        </span>

                      </button>
                    );
                  }
                )}

              </div>


              {/* ======================================================
                  EXPLANATION
              ====================================================== */}

              {selected !==
                null && (

                <div className="mb-4 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">

                  <p className="text-[12.5px] text-violet-800 leading-relaxed m-0">

                    <span className="font-bold">
                      {selected ===
                      question.correct_index
                        ? "Correct — "
                        : "Not quite — "}
                    </span>

                    {question.explanation}

                  </p>

                </div>
              )}


              {/* ======================================================
                  SAVE ERROR
              ====================================================== */}

              {saveError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">

                  <p className="text-[12px] text-red-600 m-0">
                    {saveError}
                  </p>

                </div>
              )}


              {/* ======================================================
                  NEXT
              ====================================================== */}

              <button
                type="button"
                onClick={next}
                disabled={
                  selected === null ||
                  saving
                }
                className="w-full py-3 rounded-xl text-white text-[13.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95"
                style={{
                  background:
                    ACCENT_GRADIENT,
                }}
              >

                {saving
                  ? "Saving results..."
                  : isLast
                  ? "See results"
                  : "Next question"}

              </button>

            </>
          )}

        </div>
      </div>
    </div>
  );
}