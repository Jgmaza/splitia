import clsx from "clsx";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={clsx(
        "flex w-full mb-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={clsx(
          "max-w-xs rounded-2xl px-4 py-2 text-sm whitespace-pre-line",
          isUser
            ? "bg-emerald-500 text-white rounded-br-sm shadow-sm shadow-emerald-500/40"
            : "bg-zinc-800 text-zinc-50 rounded-bl-sm border border-zinc-700",
        )}
      >
        {content}
      </div>
    </div>
  );
}

