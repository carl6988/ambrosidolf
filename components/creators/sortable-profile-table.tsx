"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteAccountButton } from "@/components/accounts/delete-account-button";
import { formatNumber } from "@/lib/format";
import { reorderAccounts } from "@/app/accounts/actions";

export type ProfileRow = {
  id: string;
  username: string;
  displayName: string;
  followers: number | null;
  views24h: number | null;
  postsCount: number;
};

function SortableRow({ row }: { row: ProfileRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Ziehen zum Sortieren"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <Link
              href={`/accounts/${row.id}`}
              className="font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.username}
            </Link>
            <div className="text-xs text-muted-foreground">{row.displayName}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(row.followers)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(row.views24h)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(row.postsCount)}
      </TableCell>
      <TableCell>
        <DeleteAccountButton accountId={row.id} username={row.username} />
      </TableCell>
    </TableRow>
  );
}

export function SortableProfileTable({
  creatorId,
  rows: initialRows,
}: {
  creatorId: string;
  rows: ProfileRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);
    startTransition(async () => {
      await reorderAccounts(
        creatorId,
        next.map((r) => r.id)
      );
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        Noch keine Accounts für diesen Creator angelegt.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead className="text-right">Follower aktuell</TableHead>
            <TableHead className="text-right">Views (24h)</TableHead>
            <TableHead className="text-right">Posts</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {rows.map((row) => (
                <SortableRow key={row.id} row={row} />
              ))}
            </TableBody>
          </SortableContext>
        </DndContext>
      </Table>
    </div>
  );
}
