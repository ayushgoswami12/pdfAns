// FILE: app/chat/page.tsx

"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import Sidebar, {
  HistoryItem,
} from "@/components/Sidebar";

import TopBar from "@/components/TopBar";

import AuthGuard from "@/components/AuthGuard";

import { logout } from "@/lib/auth";

import {
  IconDiamond,
  IconPlus,
  IconMic,
  IconSend,
} from "@/components/icons";

import UploadIndicatorStack, {
  UploadJob,
} from "@/components/UploadIndicator";

import MarkdownLite from "@/components/MarkdownLite";

import { QuizModal } from "@/components/QuizModal";

import {
  ACCENT_GRADIENT,
} from "@/lib/theme";

import {
  listSessions,
  createSession,
  deleteSession,
  getSessionMessages,
  streamChat,
  listSources,
  uploadFile,
  generateQuiz,
  SessionRow,
  QuizQuestion,
} from "@/lib/api";


interface ChatMessage {
  role:
    | "user"
    | "assistant";
  content: string;
}


// ============================================================
// QUIZ REQUEST DETECTION
// ============================================================

function isQuizRequest(
  text: string
): boolean {

  const query =
    text
      .toLowerCase()
      .replace(
        /[?!.,]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  const patterns = [
    /\bquiz me\b/,
    /\btest me\b/,
    /\bmake me a quiz\b/,
    /\bmake a quiz\b/,
    /\bcreate a quiz\b/,
    /\bcreate quiz\b/,
    /\bgenerate a quiz\b/,
    /\bgenerate quiz\b/,
    /\bgive me a quiz\b/,
    /\bgive me quiz\b/,
    /\bstart a quiz\b/,
    /\bstart quiz\b/,
    /\bprepare a quiz\b/,
    /\bprepare quiz\b/,
    /\bbuild a quiz\b/,
    /\bbuild quiz\b/,
    /\bcreate a test\b/,
    /\bmake a test\b/,
    /\bgenerate a test\b/,
    /\bgive me a test\b/,
    /\btest my knowledge\b/,
    /\btest my understanding\b/,
    /\bquiz\b/,
    /\bmcq\b/,
    /\bmcqs\b/,
    /\bmultiple choice questions?\b/,
  ];


  return patterns.some(
    (pattern) =>
      pattern.test(
        query
      )
  );
}


function extractQuizCount(
  text: string
): number {

  const query =
    text
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  const patterns = [

    /(\d+)\s*(?:questions?|ques|qns?)/i,

    /(\d+)\s*(?:mcqs?|multiple[\s-]?choice)/i,

    /(?:quiz|test).{0,30}?(?:with|of|for)\s+(\d+)/i,

    /(?:give|make|create|generate|prepare|build).{0,30}?\b(\d+)\b/i,
  ];


  for (
    const pattern of patterns
  ) {

    const match =
      query.match(
        pattern
      );


    if (
      match &&
      match[1]
    ) {

      const count =
        Number(
          match[1]
        );


      if (
        Number.isFinite(
          count
        ) &&
        count >= 1
      ) {

        return Math.min(
          count,
          20
        );
      }
    }
  }


  return 5;
}


// ============================================================
// CHAT PAGE
// ============================================================

function ChatPageInner() {

  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const scopedFile =
    searchParams.get(
      "file"
    );


  // ==========================================================
  // CHAT STATE
  // ==========================================================

  const [
    sessions,
    setSessions,
  ] =
    useState<SessionRow[]>(
      []
    );


  const [
    activeSessionId,
    setActiveSessionId,
  ] =
    useState<
      number | null
    >(null);


  const [
    sessionTitle,
    setSessionTitle,
  ] =
    useState(
      "New Chat"
    );


  const [
    sourcesTotal,
    setSourcesTotal,
  ] =
    useState(0);


  const [
    showAddSourcesModal,
    setShowAddSourcesModal,
  ] =
    useState(false);


  const [
    messages,
    setMessages,
  ] =
    useState<ChatMessage[]>(
      []
    );


  const [
    input,
    setInput,
  ] =
    useState("");


  const [
    isTyping,
    setIsTyping,
  ] =
    useState(false);


  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] =
    useState(false);


  const [
    uploadJobs,
    setUploadJobs,
  ] =
    useState<UploadJob[]>(
      []
    );


  // ==========================================================
  // QUIZ STATE
  // ==========================================================

  const [
    quizQuestions,
    setQuizQuestions,
  ] =
    useState<QuizQuestion[]>(
      []
    );


  const [
    quizAttemptId,
    setQuizAttemptId,
  ] =
    useState<
      number | null
    >(null);


  const [
    showQuizModal,
    setShowQuizModal,
  ] =
    useState(false);


  const [
    isGeneratingQuiz,
    setIsGeneratingQuiz,
  ] =
    useState(false);


  const [
    quizError,
    setQuizError,
  ] =
    useState<
      string | null
    >(null);


  const [
    quizCount,
    setQuizCount,
  ] =
    useState(5);


  // ==========================================================
  // REFS
  // ==========================================================

  const bottomRef =
    useRef<HTMLDivElement>(
      null
    );


  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );


  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    );


  const isComposingRef =
    useRef(false);


  const LAST_SESSION_KEY =
    "scholarai:lastSessionId";


  const DISMISSED_KEY =
    "scholarai:dismissedSourcesPrompt";


  // ==========================================================
  // TITLE
  // ==========================================================

  useEffect(
    () => {
      document.title =
        "Chat · ScholarAI";
    },
    []
  );


  // ==========================================================
  // REFRESH SESSIONS
  // ==========================================================

  const refreshSessions =
    useCallback(
      async () => {

        try {

          setSessions(
            await listSessions()
          );

        } catch {
          // Non-fatal.
        }
      },
      []
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {

      refreshSessions();


      listSources()
        .then(
          (
            rows
          ) => {

            setSourcesTotal(
              rows.length
            );

            if (
              rows.length >
              0
            ) {

              setShowAddSourcesModal(
                false
              );
            }
          }
        )
        .catch(
          () => {}
        );


      if (
        !scopedFile
      ) {

        const savedId =
          typeof window !==
          "undefined"
            ? localStorage.getItem(
                LAST_SESSION_KEY
              )
            : null;


        if (
          savedId
        ) {

          loadSession(
            Number(
              savedId
            )
          );

        } else {

          const dismissed =
            typeof window !==
            "undefined"
              ? sessionStorage.getItem(
                  DISMISSED_KEY
                )
              : null;


          if (
            !dismissed
          ) {

            setShowAddSourcesModal(
              true
            );
          }
        }
      }


    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      refreshSessions,
    ]
  );


  // ==========================================================
  // SOURCE MODAL
  // ==========================================================

  const dismissAddSourcesModal =
    () => {

      setShowAddSourcesModal(
        false
      );


      if (
        typeof window !==
        "undefined"
      ) {

        sessionStorage.setItem(
          DISMISSED_KEY,
          "1"
        );
      }
    };


  // ==========================================================
  // DEEP LINK
  // ==========================================================

  useEffect(
    () => {

      if (
        scopedFile
      ) {

        setInput(
          `Regarding ${scopedFile}, `
        );

        textareaRef.current?.focus();
      }

    },
    [
      scopedFile,
    ]
  );


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(
    () => {

      bottomRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",
        }
      );

    },
    [
      messages,
      isTyping,
    ]
  );


  // ==========================================================
  // TEXTAREA
  // ==========================================================

  useEffect(
    () => {

      const element =
        textareaRef.current;


      if (!element) {
        return;
      }


      element.style.height =
        "auto";


      element.style.height =
        `${element.scrollHeight}px`;

    },
    [
      input,
    ]
  );


  // ==========================================================
  // RESET QUIZ
  // ==========================================================

  const resetQuiz =
    () => {

      setQuizQuestions(
        []
      );

      setQuizAttemptId(
        null
      );

      setShowQuizModal(
        false
      );

      setQuizError(
        null
      );
    };


  // ==========================================================
  // NEW CHAT
  // ==========================================================

  const handleNewChat =
    () => {

      setMessages(
        []
      );

      setActiveSessionId(
        null
      );

      setSessionTitle(
        "New Chat"
      );

      setInput(
        ""
      );

      setIsSidebarOpen(
        false
      );

      setQuizCount(
        5
      );

      resetQuiz();


      if (
        typeof window !==
        "undefined"
      ) {

        localStorage.removeItem(
          LAST_SESSION_KEY
        );
      }
    };


  // ==========================================================
  // LOAD SESSION
  // ==========================================================

  const loadSession =
    async (
      sessionId: number
    ) => {

      setActiveSessionId(
        sessionId
      );


      if (
        typeof window !==
        "undefined"
      ) {

        localStorage.setItem(
          LAST_SESSION_KEY,
          String(
            sessionId
          )
        );
      }


      try {

        const rows =
          await getSessionMessages(
            sessionId
          );


        setMessages(
          rows.map(
            (
              row
            ) => ({
              role:
                row.role,

              content:
                row.content,
            })
          )
        );


        resetQuiz();


      } catch {

        if (
          typeof window !==
          "undefined"
        ) {

          localStorage.removeItem(
            LAST_SESSION_KEY
          );
        }


        setActiveSessionId(
          null
        );

        setSessionTitle(
          "New Chat"
        );

        setMessages(
          []
        );
      }
    };


  // ==========================================================
  // HISTORY
  // ==========================================================

  const handleSelectHistory =
    async (
      id:
        | string
        | number
    ) => {

      setIsSidebarOpen(
        false
      );

      await loadSession(
        Number(
          id
        )
      );
    };


  const handleDeleteHistory =
    async (
      id:
        | string
        | number
    ) => {

      const sessionId =
        Number(
          id
        );


      const previous =
        sessions;


      setSessions(
        (
          current
        ) =>
          current.filter(
            (
              session
            ) =>
              session.id !==
              sessionId
          )
      );


      try {

        await deleteSession(
          sessionId
        );

      } catch {

        setSessions(
          previous
        );

        return;
      }


      if (
        activeSessionId ===
        sessionId
      ) {

        handleNewChat();
      }
    };


  // ==========================================================
  // SESSION TITLE
  // ==========================================================

  useEffect(
    () => {

      if (
        activeSessionId ===
        null
      ) {

        return;
      }


      const session =
        sessions.find(
          (
            item
          ) =>
            item.id ===
            activeSessionId
        );


      if (
        session
      ) {

        setSessionTitle(
          session.title
        );
      }

    },
    [
      sessions,
      activeSessionId,
    ]
  );


  // ==========================================================
  // GENERATE QUIZ
  // ==========================================================

  const handleCreateQuiz =
    async (
      requestedCount:
        number
    ) => {

      setQuizError(
        null
      );


      if (
        activeSessionId ===
        null
      ) {

        setQuizError(
          "Ask at least one question before creating a quiz."
        );

        return;
      }


      if (
        isTyping
      ) {

        setQuizError(
          "Wait for the current answer to finish before creating a quiz."
        );

        return;
      }


      const safeCount =
        Math.min(
          Math.max(
            Math.floor(
              requestedCount
            ),
            1
          ),
          20
        );


      setQuizCount(
        safeCount
      );


      setIsGeneratingQuiz(
        true
      );


      try {

        const result =
          await generateQuiz(
            activeSessionId,
            safeCount
          );


        if (
          !result ||
          !result.questions ||
          result.questions.length ===
            0
        ) {

          throw new Error(
            "There isn't enough useful content in this current chat and your uploaded material to create a quiz."
          );
        }


        setQuizAttemptId(
          result.attempt_id
        );


        setQuizQuestions(
          result.questions
        );


        setShowQuizModal(
          true
        );


      } catch (
        error
      ) {

        setQuizError(
          error instanceof
          Error
            ? error.message
            : "Failed to create quiz."
        );

      } finally {

        setIsGeneratingQuiz(
          false
        );
      }
    };


  // ==========================================================
  // TRY AGAIN
  // ==========================================================

  const handleTryAgain =
    async () => {

      if (
        isGeneratingQuiz
      ) {

        return;
      }


      /*
       * Close the old quiz while the new one is being prepared.
       *
       * The backend now knows:
       *
       * Previous quiz:
       *   Q1 wrong
       *   Q2 correct
       *   Q3 wrong
       *   Q4 correct
       *   Q5 wrong
       *
       * Next quiz:
       *   Q1 again
       *   Q3 again
       *   Q5 again
       *   + 2 NEW questions
       */
      setShowQuizModal(
        false
      );


      setQuizQuestions(
        []
      );


      setQuizAttemptId(
        null
      );


      setQuizError(
        null
      );


      await handleCreateQuiz(
        quizCount
      );
    };


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage =
    async () => {

      const userMessage =
        input.trim();


      if (
        !userMessage ||
        isTyping ||
        isGeneratingQuiz
      ) {

        return;
      }


      if (
        isQuizRequest(
          userMessage
        )
      ) {

        const count =
          extractQuizCount(
            userMessage
          );


        setInput(
          ""
        );


        await handleCreateQuiz(
          count
        );


        return;
      }


      let sessionId =
        activeSessionId;


      setInput(
        ""
      );


      setQuizError(
        null
      );


      setMessages(
        (
          previous
        ) => [
          ...previous,
          {
            role:
              "user",

            content:
              userMessage,
          },
        ]
      );


      setIsTyping(
        true
      );


      setMessages(
        (
          previous
        ) => [
          ...previous,
          {
            role:
              "assistant",

            content:
              "",
          },
        ]
      );


      try {

        if (
          sessionId ===
          null
        ) {

          const title =
            userMessage.length >
            40
              ? `${userMessage.slice(
                  0,
                  40
                )}…`
              : userMessage;


          const created =
            await createSession(
              title
            );


          sessionId =
            created.id;


          setActiveSessionId(
            sessionId
          );


          setSessionTitle(
            title
          );


          setSessions(
            (
              previous
            ) => [
              created,
              ...previous,
            ]
          );


          if (
            typeof window !==
            "undefined"
          ) {

            localStorage.setItem(
              LAST_SESSION_KEY,
              String(
                sessionId
              )
            );
          }
        }


        await streamChat(
          userMessage,
          sessionId,
          (
            chunk
          ) => {

            setMessages(
              (
                previous
              ) => {

                const updated =
                  [
                    ...previous,
                  ];


                const last =
                  updated.length -
                  1;


                updated[last] =
                  {
                    ...
                      updated[
                        last
                      ],

                    content:
                      updated[
                        last
                      ].content +
                      chunk,
                  };


                return updated;
              }
            );
          }
        );


      } catch (
        error
      ) {

        setMessages(
          (
            previous
          ) => {

            const updated =
              [
                ...previous,
              ];


            const last =
              updated.length -
              1;


            updated[last] =
              {
                role:
                  "assistant",

                content:
                  `⚠️ ${
                    error instanceof
                    Error
                      ? error.message
                      : "Connection interrupted."
                  }`,
              };


            return updated;
          }
        );

      } finally {

        setIsTyping(
          false
        );
      }
    };


  // ==========================================================
  // UPLOAD
  // ==========================================================

  const handleFileUpload =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const files =
        event.target.files;


      if (
        !files ||
        files.length ===
          0
      ) {

        return;
      }


      if (
        showAddSourcesModal
      ) {

        dismissAddSourcesModal();
      }


      const newJobs:
        UploadJob[] =
        Array.from(
          files
        ).map(
          (
            file
          ) => ({
            id:
              Math.random()
                .toString(
                  36
                )
                .slice(
                  2,
                  9
                ),

            filename:
              file.name,

            progress:
              0,

            status:
              "uploading",
          })
        );


      setUploadJobs(
        (
          previous
        ) => [
          ...previous,
          ...newJobs,
        ]
      );


      await Promise.all(
        Array.from(
          files
        ).map(
          async (
            file,
            fileIndex
          ) => {

            const jobId =
              newJobs[
                fileIndex
              ].id;


            try {

              await uploadFile(
                file,
                (
                  percent
                ) =>
                  setUploadJobs(
                    (
                      previous
                    ) =>
                      previous.map(
                        (
                          job
                        ) =>
                          job.id ===
                          jobId
                            ? {
                                ...
                                  job,

                                progress:
                                  percent,
                              }
                            : job
                      )
                  )
              );


              setUploadJobs(
                (
                  previous
                ) =>
                  previous.map(
                    (
                      job
                    ) =>
                      job.id ===
                      jobId
                        ? {
                            ...
                              job,

                            status:
                              "success",

                            progress:
                              100,
                          }
                        : job
                  )
              );


              setTimeout(
                () => {

                  setUploadJobs(
                    (
                      previous
                    ) =>
                      previous.filter(
                        (
                          job
                        ) =>
                          job.id !==
                          jobId
                      )
                  );

                },
                1400
              );


            } catch (
              error
            ) {

              setUploadJobs(
                (
                  previous
                ) =>
                  previous.map(
                    (
                      job
                    ) =>
                      job.id ===
                      jobId
                        ? {
                            ...
                              job,

                            status:
                              "error",

                            errorMessage:
                              error instanceof
                              Error
                                ? error.message
                                : "Upload failed",
                          }
                        : job
                  )
              );
            }
          }
        )
      );


      try {

        const rows =
          await listSources();

        setSourcesTotal(
          rows.length
        );

      } catch {
        // Non-fatal.
      }


      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";
      }
    };


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleComposerKeyDown =
    (
      event:
        React.KeyboardEvent<HTMLTextAreaElement>
    ) => {

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey &&
        !isComposingRef.current
      ) {

        event.preventDefault();

        sendMessage();
      }
    };


  const canSend =
    input.trim().length >
      0 &&
    !isTyping &&
    !isGeneratingQuiz;


  const historyItems:
    HistoryItem[] =
    sessions.map(
      (
        session
      ) => ({
        id:
          session.id,

        title:
          session.title,
      })
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AuthGuard>
      {(
        user
      ) => (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 relative antialiased">

          <Sidebar
            active="new-chat"
            showRecentHistory
            historyItems={
              historyItems
            }
            activeHistoryId={
              activeSessionId
            }
            onSelectHistory={
              handleSelectHistory
            }
            onDeleteHistory={
              handleDeleteHistory
            }
            onNewChat={
              handleNewChat
            }
            userEmail={
              user.email
            }
            onLogout={() => {

              logout();

              router.push(
                "/login"
              );
            }}
            isOpen={
              isSidebarOpen
            }
            onClose={() =>
              setIsSidebarOpen(
                false
              )
            }
          />


          <main className="flex-1 flex flex-col min-w-0">

            <TopBar
              mode="session"
              activeTab="history"
              sessionTitle={
                sessionTitle
              }
              sourcesActiveCount={
                sourcesTotal
              }
              onOpenSidebar={() =>
                setIsSidebarOpen(
                  true
                )
              }
            />


            {/* ========================================================
                MESSAGES
            ======================================================== */}

            <div className="flex-1 overflow-y-auto px-4 sm:px-8 custom-scrollbar flex flex-col pt-6 pb-4">

              {uploadJobs.length >
                0 && (
                <div className="sticky top-0 z-10 w-full flex justify-center mb-6">

                  <UploadIndicatorStack
                    jobs={
                      uploadJobs
                    }
                  />

                </div>
              )}


              {messages.length ===
              0 ? (

                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 text-center pb-16">

                  <div className="w-20 h-20 mb-8 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(124,92,252,0.15)] ring-1 ring-violet-500/20 bg-gradient-to-br from-gray-50 to-gray-100">

                    <IconDiamond className="w-10 h-10 text-violet-500" />

                  </div>


                  <h1 className="font-brand text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-violet-500 to-violet-700">

                    What do you want to explore today?

                  </h1>


                  <p className="text-[17px] mt-2 font-medium text-gray-500 max-w-md leading-relaxed">

                    {sourcesTotal >
                    0
                      ? `${sourcesTotal} source${
                          sourcesTotal ===
                          1
                            ? ""
                            : "s"
                        } available — ask anything, or mention a filename to focus on one.`
                      : "Upload a document from Sources to begin analyzing, or just start typing to explore."}

                  </p>

                </div>

              ) : (

                <div className="w-full max-w-3xl mx-auto py-2 space-y-8">

                  {messages.map(
                    (
                      msg,
                      messageIndex
                    ) => (

                      <div
                        key={
                          messageIndex
                        }
                        className={`flex w-full ${
                          msg.role ===
                          "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        {msg.role ===
                        "user" ? (

                          <div className="px-5 py-3.5 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed max-w-[85%] sm:max-w-[75%] rounded-[20px] rounded-br-sm bg-gray-100 text-gray-900 border border-gray-300/60">

                            {
                              msg.content
                            }

                          </div>

                        ) : (

                          <div className="flex gap-3.5 max-w-[95%] sm:max-w-[88%]">

                            <div
                              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white mt-0.5"
                              style={{
                                background:
                                  ACCENT_GRADIENT,
                              }}
                            >

                              <IconDiamond className="w-4 h-4" />

                            </div>


                            <div className="px-5 py-5 rounded-[20px] rounded-tl-sm bg-gray-50 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] min-w-0 flex-1">

                              {msg.content ? (

                                <MarkdownLite
                                  text={
                                    msg.content
                                  }
                                />

                              ) : isTyping &&
                                messageIndex ===
                                  messages.length -
                                    1 ? (

                                <div className="flex items-center gap-1.5 h-6">

                                  <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500" />

                                  <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500 [animation-delay:150ms]" />

                                  <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500 [animation-delay:300ms]" />

                                </div>

                              ) : null}

                            </div>

                          </div>
                        )}

                      </div>
                    )
                  )}


                  <div
                    ref={
                      bottomRef
                    }
                    className="h-4"
                  />

                </div>
              )}

            </div>


            {/* ========================================================
                COMPOSER
            ======================================================== */}

            <div className="w-full px-4 sm:px-8 pb-6 pt-4 shrink-0 relative">

              <div className="absolute top-0 left-0 w-full h-12 -mt-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />


              <div className="max-w-3xl mx-auto relative">

                {(quizError ||
                  isGeneratingQuiz) && (

                  <div className="mb-3 flex justify-center">

                    <div
                      className={`px-4 py-2.5 rounded-xl border text-[12px] font-medium ${
                        quizError
                          ? "bg-red-50 border-red-200 text-red-600"
                          : "bg-violet-50 border-violet-100 text-violet-700"
                      }`}
                    >

                      {quizError ? (
                        quizError
                      ) : (
                        <div className="flex items-center gap-2">

                          <span className="w-3.5 h-3.5 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />

                          Preparing{" "}
                          {
                            quizCount
                          }{" "}
                          questions...

                        </div>
                      )}

                    </div>

                  </div>
                )}


                <div className="flex items-end gap-2 rounded-[28px] p-2 bg-white/80 backdrop-blur-xl border border-gray-200 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all">

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    title="Upload a source"
                    className="mb-0.5 ml-0.5 w-10 h-10 shrink-0 rounded-full bg-gray-100 text-gray-500 hover:text-violet-600 hover:bg-violet-500/10 flex items-center justify-center transition-colors"
                  >

                    <IconPlus
                      width={18}
                      height={18}
                    />

                  </button>


                  <textarea
                    ref={
                      textareaRef
                    }
                    value={
                      input
                    }
                    onChange={(
                      event
                    ) => {

                      setInput(
                        event.target.value
                      );

                      if (
                        quizError
                      ) {

                        setQuizError(
                          null
                        );
                      }

                    }}
                    onKeyDown={
                      handleComposerKeyDown
                    }
                    onCompositionStart={() =>
                      (
                        isComposingRef.current =
                          true
                      )
                    }
                    onCompositionEnd={() =>
                      (
                        isComposingRef.current =
                          false
                      )
                    }
                    placeholder="Ask ScholarAI or say 'create a quiz with 5 questions'..."
                    className="flex-1 resize-none custom-scrollbar text-[14.5px] py-3 min-h-[44px] max-h-[200px] font-medium outline-none bg-transparent border-none text-gray-900 placeholder:text-gray-500 leading-relaxed"
                    rows={1}
                  />


                  <button
                    type="button"
                    disabled
                    title="Voice input"
                    className="mb-0.5 w-10 h-10 shrink-0 rounded-full text-gray-400 flex items-center justify-center cursor-not-allowed"
                  >

                    <IconMic />

                  </button>


                  <button
                    type="button"
                    onClick={
                      sendMessage
                    }
                    disabled={
                      !canSend
                    }
                    className={`mb-0.5 mr-0.5 w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                      canSend
                        ? "text-white hover:scale-105 active:scale-95"
                        : "bg-gray-100 text-gray-400 opacity-40 cursor-not-allowed"
                    }`}
                    style={
                      canSend
                        ? {
                            background:
                              ACCENT_GRADIENT,
                          }
                        : undefined
                    }
                  >

                    <IconSend />

                  </button>

                </div>


                <div className="flex items-center justify-center mt-3">

                  <span className="text-[11.5px] font-medium text-gray-400">

                    {isGeneratingQuiz
                      ? `Preparing ${quizCount} questions...`
                      : "ScholarAI can make mistakes. Verify important info."}

                  </span>

                </div>

              </div>

            </div>

          </main>


          <input
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            ref={
              fileInputRef
            }
            onChange={
              handleFileUpload
            }
          />


          {/* ========================================================
              ADD SOURCES MODAL
          ======================================================== */}

          {showAddSourcesModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 text-center border border-gray-100">

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
                  style={{
                    background:
                      ACCENT_GRADIENT,
                  }}
                >

                  <IconPlus
                    width={24}
                    height={24}
                  />

                </div>


                <h2 className="text-[18px] font-bold text-gray-900 mb-2">
                  Add your first source
                </h2>


                <p className="text-[13.5px] text-gray-500 leading-relaxed mb-6">
                  ScholarAI answers from documents you upload. Add a PDF to get started, or skip and just chat freely.
                </p>


                <div className="flex flex-col gap-2.5">

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/sources"
                      )
                    }
                    className="w-full py-3 rounded-xl text-white text-[13.5px] font-bold"
                    style={{
                      background:
                        ACCENT_GRADIENT,
                    }}
                  >
                    Add Sources
                  </button>


                  <button
                    type="button"
                    onClick={
                      dismissAddSourcesModal
                    }
                    className="w-full py-2.5 text-[12.5px] font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Skip for now
                  </button>

                </div>

              </div>

            </div>
          )}


          {/* ========================================================
              QUIZ MODAL
          ======================================================== */}

          {showQuizModal &&
            quizAttemptId !==
              null &&
            quizQuestions.length >
              0 && (

            <QuizModal
              attemptId={
                quizAttemptId
              }

              questions={
                quizQuestions
              }

              onTryAgain={
                handleTryAgain
              }

              isGeneratingNextQuiz={
                isGeneratingQuiz
              }

              onClose={() => {

                resetQuiz();

              }}
            />

          )}

        </div>
      )}
    </AuthGuard>
  );
}


export default function ChatPage() {

  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-white">

          <span className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />

        </div>
      }
    >

      <ChatPageInner />

    </Suspense>
  );
}