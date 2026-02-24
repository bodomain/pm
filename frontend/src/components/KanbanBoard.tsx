"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { AIChatSidebar } from "@/components/AIChatSidebar";
import { createId, initialData, moveCard, type BoardData, type Column, type DBBoard, type DBColumn, type DBCard, type Card } from "@/lib/kanban";

interface KanbanBoardProps {
  onLogout?: () => void;
  // for testing or server-side rendering we can provide a starting board
  initialBoard?: BoardData;
}

// Helper: convert backend numeric IDs to namespaced frontend IDs
const toColId = (id: number | string) => `col-${id}`;
const toCardId = (id: number | string) => `card-${id}`;
const fromPrefixedId = (prefixed: string) => parseInt(prefixed.replace(/^(col-|card-)/, ''), 10);
const findColumnId = (columns: Column[], id: string) => {
  if (columns.some((column) => column.id === id)) {
    return id;
  }
  return columns.find((column) => column.cardIds.includes(id))?.id;
};

export const KanbanBoard = ({ onLogout, initialBoard }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>(() => initialBoard ?? initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerListenerRef = useRef<((e: PointerEvent) => void) | null>(null);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const userRes = await fetch("/api/users/user");
        if (!userRes.ok) return;
        const user = await userRes.json();
        setUserId(user.id);
        
        const boardsRes = await fetch(`/api/users/${user.id}/boards`);
        if (!boardsRes.ok) return;
        const boards = await boardsRes.json();
        
        if (boards.length > 0) {
          const dbBoard: DBBoard = boards[0];
          dbBoard.columns.sort((a: DBColumn, b: DBColumn) => a.order - b.order);
          
          const columns: Column[] = dbBoard.columns.map((c: DBColumn) => ({
            id: toColId(c.id),
            title: c.title,
            cardIds: c.cards.sort((a: DBCard, b: DBCard) => a.order - b.order).map((card: DBCard) => toCardId(card.id)),
          }));
          
          const cards: Record<string, Card> = {};
          dbBoard.columns.forEach((c: DBColumn) => {
            c.cards.forEach((card: DBCard) => {
              const cid = toCardId(card.id);
              cards[cid] = {
                id: cid,
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

  const sensorOptions = useMemo(() => ({
    activationConstraint: { distance: 6 },
  }), []);
  
  const mouseSensor = useSensor(PointerSensor, sensorOptions);
  const sensors = useSensors(mouseSensor);

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
    
    const onPointerMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onPointerMove);
    activePointerListenerRef.current = onPointerMove;
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setBoard((prev) => {
      const activeColumnId = findColumnId(prev.columns, activeId);
      const overColumnId = findColumnId(prev.columns, overId);

      if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
        return prev;
      }

      const nextColumns = moveCard(prev.columns, activeId, overColumnId);
      if (nextColumns === prev.columns) return prev;
      
      return { ...prev, columns: nextColumns };
    });
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveCardId(null);

    if (activePointerListenerRef.current) {
      window.removeEventListener("pointermove", activePointerListenerRef.current);
      activePointerListenerRef.current = null;
    }

    let resolvedOverId = over?.id as string | undefined;

    if (!resolvedOverId || resolvedOverId === activeId) {
      const p = pointerPosRef.current;
      if (p) {
        const el = document.elementFromPoint(p.x, p.y);
        const col = el?.closest('[data-testid^="column-"]');
        if (col) {
          const testId = col.getAttribute('data-testid');
          resolvedOverId = testId?.replace(/^column-/, '');
        }
      }
    }

    if (!resolvedOverId || resolvedOverId === activeId) {
      pointerPosRef.current = null;
      return;
    }

    let finalColumns: Column[] = [];
    setBoard((prev) => {
      const currentActiveColId = findColumnId(prev.columns, activeId);
      if (resolvedOverId === currentActiveColId) return prev;
      finalColumns = moveCard(prev.columns, activeId, resolvedOverId);
      return { ...prev, columns: finalColumns };
    });

    // API side effects
    setTimeout(async () => {
      if (finalColumns.length === 0) return;
      try {
        const activeColumnId = findColumnId(board.columns, activeId);
        if (!activeColumnId) return;

        const targetColumn = finalColumns.find(c => c.cardIds.includes(activeId));
        const sourceColumn = finalColumns.find(c => c.id === activeColumnId);
        if (!targetColumn) return;

        const targetColIdNum = fromPrefixedId(targetColumn.id);
        const sourceColIdNum = sourceColumn ? fromPrefixedId(sourceColumn.id) : null;

        if (!isNaN(targetColIdNum)) {
          const updates = targetColumn.cardIds.map((id, index) => {
            const numId = fromPrefixedId(id);
            if (!isNaN(numId)) {
              return fetch(`/api/cards/${numId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ column_id: targetColIdNum, order: index }),
              });
            }
            return Promise.resolve();
          });

          if (sourceColumn && sourceColIdNum !== targetColIdNum) {
            sourceColumn.cardIds.forEach((id, index) => {
              const numId = fromPrefixedId(id);
              if (!isNaN(numId)) {
                updates.push(fetch(`/api/cards/${numId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ column_id: sourceColIdNum, order: index }),
                }));
              }
            });
          }
          await Promise.all(updates);
        }
      } catch (e) {
        console.error("Failed to update card position", e);
      }
    }, 0);

    pointerPosRef.current = null;
  }, [board.columns]);

  const handleRenameColumn = useCallback(async (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));

    try {
      const cId = fromPrefixedId(columnId);
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
  }, []);

  const handleAddCard = useCallback(async (columnId: string, title: string, details: string) => {
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
      const colIdNum = fromPrefixedId(columnId);
      if (!isNaN(colIdNum)) {
        const order = board.columns.find(c => c.id === columnId)?.cardIds.length || 0;
        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: newDetails, order, column_id: colIdNum }),
        });
        
        if (res.ok) {
          const realCard = await res.json();
          const realId = toCardId(realCard.id);
          setBoard((latest) => {
            const newCards = { ...latest.cards };
            delete newCards[optimisticId];
            newCards[realId] = { id: realId, title: realCard.title, details: realCard.description || "" };
            return {
              ...latest,
              cards: newCards,
              columns: latest.columns.map((col) => 
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
  }, [board.columns]);

  const handleDeleteCard = useCallback(async (columnId: string, cardId: string) => {
    setBoard((prev) => {
      const newCards = { ...prev.cards };
      delete newCards[cardId];
      return {
        ...prev,
        cards: newCards,
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) }
            : column
        ),
      };
    });

    try {
      const cId = fromPrefixedId(cardId);
      if (!isNaN(cId)) {
        await fetch(`/api/cards/${cId}`, { method: "DELETE" });
      }
    } catch(e) {
      console.error("Failed to delete card", e);
    }
  }, []);

  const activeCard = activeCardId ? cardsById[activeCardId] : null;

  return (
    <div className="relative overflow-hidden">
      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 glass-panel p-8 transition-smooth hover:shadow-[var(--glow-cyan)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neon-cyan animate-pulse">
                Cosmic Single Board
              </p>
              <h1 className="mt-3 font-display text-5xl font-bold gradient-text drop-shadow-lg">
                Kanban Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Keep momentum visible in the cosmic flow. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="glass-card px-5 py-4 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Focus
                </p>
                <p className="mt-2 text-lg font-semibold text-neon-purple">
                  One board. Five columns. Zero clutter.
                </p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="glass-input px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-neon-amber hover:text-white rounded-lg transition-smooth border border-[var(--glass-border)] hover:border-[var(--amber-warm)] hover:shadow-[var(--glow-amber)]"
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
                className="flex items-center gap-2 rounded-full glass-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-primary)] transition-smooth hover:shadow-[var(--glow-purple)] hover:border-[var(--purple-neon)] cursor-default"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--cyan-glow)] shadow-[var(--glow-cyan)] animate-pulse" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map(id => board.cards[id])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay className="pointer-events-none" data-testid="drag-overlay">
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
      {userId && (
        <AIChatSidebar userId={userId} onUpdateBoard={setBoard} />
      )}
    </div>
  );
};
