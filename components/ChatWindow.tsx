import { ChatMessage as ChatMessageType } from "@/lib/openai";
import { ChatMessage } from "./ChatMessage";

type Props = {
  messages: ChatMessageType[];
};

export function ChatWindow({ messages }: Props) {
  return (
    <div className="flex-1 w-full overflow-y-auto space-y-1 p-3 bg-zinc-950">
      {messages.map((m, idx) =>
        m.role === "system" ? null : (
          <ChatMessage
            key={idx}
            role={m.role === "user" ? "user" : "assistant"}
            content={m.content}
          />
        ),
      )}
    </div>
  );
}

