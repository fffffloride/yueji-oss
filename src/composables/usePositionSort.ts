import { computed, ref, unref, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";

export interface PositionRow {
  id?: string;
  sort?: number;
  parentId?: string;
  children?: PositionRow[];
}

interface PositionSortOptions<T extends PositionRow> {
  rows: Ref<T[]>;
  total?: Ref<number>;
  filtered?: ComputedRef<boolean>;
  request: (row: T, position: number) => Promise<unknown>;
  refresh: () => Promise<unknown> | void;
}

export function usePositionSort<T extends PositionRow>(options: PositionSortOptions<T>) {
  const status = ref<"idle" | "saving" | "saved">("idle");
  const dragId = ref("");
  const dragDisabled = computed(() => Boolean(options.filtered && unref(options.filtered)));
  let queue = Promise.resolve();
  let pending = 0;
  let revision = 0;
  let failed = false;
  let statusTimer: number | undefined;

  const findRow = (rows: PositionRow[], id: string): T | undefined => {
    for (const row of rows) {
      if (String(row.id) === id) return row as T;
      const child = row.children?.length ? findRow(row.children, id) : undefined;
      if (child) return child;
    }
  };

  const findContainer = (rows: T[], id: string): T[] | undefined => {
    if (rows.some((row) => String(row.id) === id)) return rows;
    for (const row of rows) {
      const child = row.children?.length ? findContainer(row.children as T[], id) : undefined;
      if (child) return child;
    }
  };

  const scopeTotal = (row: PositionRow) =>
    options.total?.value ?? findContainer(options.rows.value, String(row.id))?.length ?? 1;

  const optimisticMove = (source: PositionRow, position: number) => {
    const container = findContainer(options.rows.value, String(source.id));
    if (!container) return;
    const targetIndex = container.findIndex((row) => row.sort === position);
    const currentIndex = container.findIndex((row) => String(row.id) === String(source.id));
    if (targetIndex < 0 || currentIndex < 0) return;

    const positions = container.map((row) => row.sort ?? 0).sort((a, b) => a - b);
    const [moved] = container.splice(currentIndex, 1);
    container.splice(targetIndex, 0, moved);
    container.forEach((row, index) => {
      row.sort = positions[index];
    });
  };

  const enqueueMove = (row: PositionRow, position: number, optimistic = true) => {
    if (position === row.sort || position < 1 || position > scopeTotal(row)) return;
    if (optimistic) optimisticMove(row, position);

    pending += 1;
    revision += 1;
    status.value = "saving";
    if (statusTimer) window.clearTimeout(statusTimer);

    const task = queue.then(async () => {
      if (failed) return;
      try {
        await options.request(row as T, position);
      } catch {
        failed = true;
      }
    });
    queue = task;

    void task.finally(async () => {
      pending -= 1;
      if (pending > 0) return;

      const completedRevision = revision;
      let refreshed = true;
      try {
        await options.refresh();
      } catch {
        refreshed = false;
        failed = true;
      }
      if (pending > 0 || completedRevision !== revision) return;
      if (failed) {
        ElMessage.error(refreshed ? "排序保存失败，已恢复" : "排序保存失败，请刷新后重试");
        status.value = "idle";
      } else {
        status.value = "saved";
        statusTimer = window.setTimeout(() => (status.value = "idle"), 1500);
      }
      failed = false;
    });
  };

  const rowClassName = ({ row }: { row: PositionRow }) => `position-sort-row-${String(row.id)}`;

  const handleDragStart = (row: PositionRow, event: DragEvent) => {
    if (dragDisabled.value) {
      event.preventDefault();
      return;
    }
    dragId.value = String(row.id);
    event.dataTransfer?.setData("text/plain", dragId.value);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    if (dragDisabled.value) return;

    const source = findRow(
      options.rows.value,
      dragId.value || event.dataTransfer?.getData("text/plain") || ""
    );
    const targetElement = (event.target as HTMLElement | null)?.closest("tr");
    const targetClass = targetElement
      ? Array.from(targetElement.classList).find((name) => name.startsWith("position-sort-row-"))
      : undefined;
    const target = targetClass
      ? findRow(options.rows.value, targetClass.slice("position-sort-row-".length))
      : undefined;
    dragId.value = "";
    if (!source || !target || source.id === target.id) return;
    if (String(source.parentId ?? "0") !== String(target.parentId ?? "0")) {
      ElMessage.warning("只能在同级内排序");
      return;
    }
    enqueueMove(source, target.sort ?? 1);
  };

  return {
    status,
    dragDisabled,
    scopeTotal,
    enqueueMove,
    rowClassName,
    handleDragStart,
    handleDrop,
  };
}
