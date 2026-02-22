"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { createId, initialData, moveCard, type BoardData } from "@/lib/kanban";

interface KanbanBoardProps {
  onLogout?: () => void;
}

export const KanbanBoard = ({ onLogout }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>(() => initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const userRes = await fetch("/api/users/user");
        if (!userRes.ok) return;
        const user = await userRes.json();
        
        const boardsRes = await fetch(`/api/users/${user.id}/boards`);
        if (!boardsRes.ok) return;
        const boards = await boardsRes.json();
        
        if (boards.length > 0) {
          const dbBoard = boards[0];
          
          dbBoard.columns.sort((a: any, b: any) => a.order - b.order);
          
          const columns: typeof initialData.columns = dbBoard.columns.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            cardIds: c.cards.sort((a: any, b: any) => a.order - b.order).map((card: any) => String(card.id)),
          }));
          
          const cards: Record<string, any> = {};
          dbBoard.columns.forEach((c: any) => {
            c.cards.forEach((card: any) => {
              cards[String(card.id)] = {
                id: String(card.id),
                title: card.title,
                details: card.description || "",
              };
            });
          });
          
          setBoard({ columns, cards });
        }
      } catch (error) {
        console.error("Failed to load backend board", error);
      }
    };
    
    loadBoard();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    let newColumns = [...board.columns];
    const activeId = active.id as string;
    const overId = over.id as string;

    setBoard((prev) => {
      newColumns = moveCard(prev.columns, activeId, overId);
      return {
        ...prev,
        columns: newColumns,
      };
    });

    try {
      const targetColumn = newColumns.find(c => c.cardIds.includes(activeId));
      if (!targetColumn) return;
      
      const newOrder = targetColumn.cardIds.indexOf(activeId);
      const colId = parseInt(targetColumn.id, 10);
      const cId = parseInt(activeId, 10);
      
      if (!isNaN(colId) && !isNaN(cId)) {
        await fetch(`/api/cards/${cId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            column_id: colId,
            order: newOrder
          })
        });
      }
    } catch(e) {
      console.error("Failed to update card position", e);
    }
  };

  const handleRenameColumn = async (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));

    try {
      const cId = parseInt(columnId, 10);
      if (!isNaN(cId)) {
        await fetch(`/api/columns/${cId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      }
    } catch (e) {
       console.error("Failed to rename column", e);
    }
  };

  const handleAddCard = async (columnId: string, title: string, details: string) => {
    const optimisticId = createId("card");
    const newDetails = details || "No details yet.";
    
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [optimisticId]: { id: optimisticId, title, details: newDetails },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, optimisticId] }
          : column
      ),
    }));

    try {
      const colIdNum = parseInt(columnId, 10);
      if (!isNaN(colIdNum)) {
        const order = board.columns.find(c => c.id === columnId)?.cardIds.length || 0;
        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: newDetails,
            order,
            column_id: colIdNum,
          }),
        });
        
        if (res.ok) {
          const realCard = await res.json();
          const realId = String(realCard.id);
          
          setBoard((prev) => {
            const newCards = { ...prev.cards };
            delete newCards[optimisticId];
            newCards[realId] = { id: realId, title: realCard.title, details: realCard.description || "" };
            
            return {
              ...prev,
              cards: newCards,
              columns: prev.columns.map((col) => 
                 col.id === columnId 
                   ? { ...col, cardIds: col.cardIds.map(id => id === optimisticId ? realId : id) }
                   : col
              )
            };
          });
        }
      }
    } catch(e) {
      console.error("Failed to add card to DB", e);
    }
  };

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    setBoard((prev) => {
      const newCards = { ...prev.cards };
      delete newCards[cardId];
      return {
        ...prev,
        cards: newCards,
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });

    try {
      const cId = parseInt(cardId, 10);
      if (!isNaN(cId)) {
        await fetch(`/api/cards/${cId}`, { method: "DELETE" });
      }
    } catch(e) {
      console.error("Failed to delete card", e);
    }
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Single Board Kanban
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Kanban Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                  Focus
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                  One board. Five columns. Zero clutter.
                </p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};
