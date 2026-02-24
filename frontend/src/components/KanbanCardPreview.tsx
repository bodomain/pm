import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="rounded-2xl border border-[var(--cyan-glow)] bg-[var(--glass-dark)] px-4 py-4 shadow-[var(--glow-cyan)] scale-105 backdrop-blur-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-display text-lg font-bold text-white tracking-wide [text-shadow:0_2px_8px_rgba(0,0,0,1),0_1px_3px_rgba(0,0,0,1)]">
          {card.title}
        </h4>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {card.details}
        </p>
      </div>
    </div>
  </article>
);
