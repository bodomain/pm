import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="tilt-container group cursor-grab active:cursor-grabbing">
      <article
        ref={setNodeRef}
        style={style}
        className={clsx(
          "tilt-element rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-dark)] px-4 py-4 backdrop-blur-md transition-smooth",
          "group-hover:shadow-[inset_0_0_20px_rgba(0,245,255,0.1),_0_4px_20px_rgba(0,0,0,0.5)] group-hover:border-[var(--cyan-glow)] group-hover:rotate-y-[2deg] group-hover:rotate-x-[2deg] group-hover:bg-[var(--glass-medium)]",
          isDragging && "opacity-60 shadow-[var(--glow-cyan)] scale-105 border-[var(--cyan-glow)] rotate-0"
        )}
        {...attributes}
        {...listeners}
        data-testid={`card-${card.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-display text-lg font-bold text-white tracking-wide [text-shadow:0_2px_8px_rgba(0,0,0,1),0_1px_3px_rgba(0,0,0,1)]">
              {card.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {card.details}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-[var(--text-muted)] transition-smooth hover:border-red-500/50 hover:text-red-400 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:bg-red-500/10 cursor-pointer relative z-10"
            aria-label={`Delete ${card.title}`}
          >
            Remove
          </button>
        </div>
      </article>
    </div>
  );
};
