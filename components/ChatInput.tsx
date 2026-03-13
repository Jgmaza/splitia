type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
};

export function ChatInput({ value, onChange, onSend, loading }: Props) {
  return (
    <div className="flex w-full items-center gap-2 border-t border-zinc-800 px-3 py-2 bg-zinc-900">
      <input
        className="flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder="Escribe tu mensaje..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <button
        onClick={onSend}
        disabled={loading || !value.trim()}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-500/40 disabled:opacity-60 disabled:shadow-none"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}

