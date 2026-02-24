import { useState, type FormEvent } from "react";

const initialFormState = { title: "", details: "" };

type NewCardFormProps = {
  onAdd: (title: string, details: string) => void;
};

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onAdd(formState.title.trim(), formState.details.trim());
    setFormState(initialFormState);
    setIsOpen(false);
  };

  return (
    <div className="mt-4">
      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Card title"
            className="w-full rounded-xl glass-input px-3 py-2 text-sm font-medium text-white placeholder-[var(--text-muted)]"
            required
          />
          <textarea
            value={formState.details}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, details: event.target.value }))
            }
            placeholder="Details"
            rows={3}
            className="w-full resize-none rounded-xl glass-input px-3 py-2 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)]"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--purple-neon)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:shadow-[var(--glow-purple)] hover:brightness-110"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormState(initialFormState);
              }}
              className="rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:text-white hover:border-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-full border border-dashed border-[var(--glass-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neon-cyan transition hover:border-[var(--cyan-glow)] hover:shadow-[var(--glow-cyan)] hover:bg-[var(--glass-light)]"
        >
          Add a card
        </button>
      )}
    </div>
  );
};
