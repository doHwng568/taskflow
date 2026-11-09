import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BoardHeader from '../components/BoardHeader';
import BoardColumn from '../components/BoardColumn';
import CardDetailModal from '../../card/components/CardDetailModal';
import ArchivedAreasPanel from '../components/ArchivedAreasPanel';
import cardApi from '../../card/api/cardApi';
import areaService from '../services/areaService';
import '../styles/BoardPage.css';
import '../styles/AreaFeatures.css';

// Bộ nhớ đệm trình duyệt cho các trường chỉ có ở giao diện (nhãn, checklist, giờ hạn...),
// tách riêng theo workspace vì area giờ thuộc về từng workspace.
const BOARD_STORAGE_PREFIX = 'taskflow_board_columns';

const storageKeyFor = (workspaceId) => `${BOARD_STORAGE_PREFIX}_${workspaceId}`;

// Thẻ và cột đã lưu trong trình duyệt, tra theo id để ghép thêm các trường chỉ có ở giao diện
const loadCachedBoardState = (workspaceId) => {
  const cardsById = new Map();
  const columnsById = new Map();
  try {
    const raw = localStorage.getItem(storageKeyFor(workspaceId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      parsed.forEach((col) => {
        columnsById.set(String(col.id), col);
        (col.cards || []).forEach((card) => cardsById.set(String(card.id), card));
      });
    }
  } catch {
    // Dữ liệu đệm hỏng thì bỏ qua, dùng dữ liệu từ server
  }
  return { cardsById, columnsById };
};

const loadCachedCards = (workspaceId) => loadCachedBoardState(workspaceId).cardsById;

const parseServerComments = (rawComments) => {
  if (!rawComments) return null;
  try {
    const parsed = JSON.parse(rawComments);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const mapCardFromServer = (serverCard, existingLocalCard = null) => {
  let dueDate = '';
  let dueTime = existingLocalCard?.dueTime || '17:00';
  if (serverCard.dueDate) {
    const [datePart, timePart] = String(serverCard.dueDate).split('T');
    dueDate = datePart || '';
    if (timePart) {
      dueTime = timePart.slice(0, 5);
    }
  }

  const serverComments = parseServerComments(serverCard.comments);
  const localComments = Array.isArray(existingLocalCard?.comments)
    ? existingLocalCard.comments
    : [];
  let comments = serverComments ?? localComments;

  // Dữ liệu cũ: bình luận từng bị lưu nhầm vào content -> không coi là mô tả
  const legacyCommentText = comments
    .map((c) => (typeof c === 'string' ? c : c?.text))
    .filter(Boolean)
    .join('\n');
  let description = serverCard.content ?? existingLocalCard?.description ?? '';
  if (
    description &&
    legacyCommentText &&
    description.trim() === legacyCommentText.trim() &&
    !existingLocalCard?.description
  ) {
    description = '';
  }

  // Thẻ cũ: local không có mô tả và chưa có bình luận, nhưng server có content
  // -> content đó là bình luận bị lưu nhầm, chuyển lại thành bình luận
  if (
    description &&
    existingLocalCard &&
    !existingLocalCard.description &&
    comments.length === 0 &&
    !serverComments
  ) {
    comments = description
      .split('\n')
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `comment-legacy-${serverCard.id}-${idx}`,
        text,
        createdAt: serverCard.updatedAt || new Date().toISOString(),
      }));
    description = '';
  }

  return {
    ...existingLocalCard,
    id: serverCard.id,
    title: serverCard.title || '',
    description,
    comments,
    coverImage: serverCard.coverImage ?? existingLocalCard?.coverImage ?? '',
    archived: Boolean(serverCard.archived ?? existingLocalCard?.archived),
    dueDate,
    dueTime,
    dueDateEnabled: Boolean(dueDate),
    color: existingLocalCard?.color || '#ffffff',
    createdById: serverCard.createdById ?? existingLocalCard?.createdById ?? null,
    createdByName: serverCard.createdByName ?? existingLocalCard?.createdByName ?? null,
    createdAt: serverCard.createdAt ?? existingLocalCard?.createdAt ?? null,
    updatedById: serverCard.updatedById ?? existingLocalCard?.updatedById ?? null,
    updatedByName: serverCard.updatedByName ?? existingLocalCard?.updatedByName ?? null,
    updatedAt: serverCard.updatedAt ?? existingLocalCard?.updatedAt ?? null,
    assigneeId: serverCard.assigneeId ?? existingLocalCard?.assigneeId ?? null,
    assigneeName: serverCard.assigneeName ?? existingLocalCard?.assigneeName ?? null,
    priority: serverCard.priority ?? existingLocalCard?.priority ?? 'MEDIUM',
    type: serverCard.type ?? existingLocalCard?.type ?? 'DOCUMENTATION',
  };
};

// Area đã ghim luôn nằm trước, trong mỗi nhóm sắp theo position (khớp thứ tự server trả về)
const sortColumns = (columns) =>
  [...columns].sort(
    (a, b) =>
      Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      (Number(a.position) || 0) - (Number(b.position) || 0)
  );

// Đổi dữ liệu area từ API thành dạng "cột" mà giao diện đang dùng
function toColumn(area, cachedCards = new Map(), cachedColumn = null) {
  return {
    id: area.id,
    title: area.name ?? cachedColumn?.title ?? '',
    position: cachedColumn?.position ?? area.position ?? 0,
    color:
      cachedColumn?.color !== undefined
        ? cachedColumn.color
        : (area.color ?? null),
    pinned:
      cachedColumn?.pinned !== undefined
        ? Boolean(cachedColumn.pinned)
        : Boolean(area.pinned),
    archived: Boolean(area.archived || cachedColumn?.archived),
    cards: (area.cards || []).map((card) =>
      mapCardFromServer(card, cachedCards.get(String(card.id)))
    ),
  };
}

export default function BoardPage() {
  const { workspaceId } = useParams();

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState(null);
  const [error, setError] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const [showArchived, setShowArchived] = useState(false);
  const [archivedRefreshKey, setArchivedRefreshKey] = useState(0);
  const [draggingAreaId, setDraggingAreaId] = useState(null);

  const parseNumericId = (rawId) => {
    if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId > 0) {
      return rawId;
    }
    const num = Number(String(rawId).replace(/\D/g, ''));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  // Tính năng 1: tải danh sách area của workspace từ API
  useEffect(() => {
    let ignore = false;

    async function loadAreas() {
      setLoading(true);
      setError('');
      try {
        const areas = await areaService.getByWorkspace(workspaceId);
        if (ignore) return;
        const { cardsById, columnsById } = loadCachedBoardState(workspaceId);
        const mapped = areas.map((area) =>
          toColumn(area, cardsById, columnsById.get(String(area.id)))
        );
        setColumns(sortColumns(mapped));
        setLoadedWorkspaceId(workspaceId);
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message ?? 'Không tải được danh sách');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAreas();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  // Lưu bộ nhớ đệm (chỉ sau khi đã tải xong đúng workspace này, tránh ghi đè nhầm)
  useEffect(() => {
    if (loading || loadedWorkspaceId !== workspaceId) return;
    try {
      localStorage.setItem(storageKeyFor(workspaceId), JSON.stringify(columns));
    } catch {
      // Ignore storage quota errors
    }
  }, [columns, loading, loadedWorkspaceId, workspaceId]);

  // Tính năng 2: tạo area mới, lưu vào database
  const handleCreateList = async (event) => {
    event.preventDefault();

    const title = newListTitle.trim();
    if (!title) return;

    try {
      const area = await areaService.create(workspaceId, title);
      setColumns((currentColumns) => sortColumns([...currentColumns, toColumn(area)]));
      setNewListTitle('');
      setIsAddingList(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tạo được danh sách');
    }
  };

  // Tính năng 3: đổi tên area, lưu vào database.
  // Cập nhật giao diện ngay (optimistic), nếu API lỗi thì trả lại tên cũ.
  const handleUpdateListTitle = async (columnId, newTitle) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    const previousTitle = columns.find((column) => column.id === columnId)?.title;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title: trimmedTitle } : column
      )
    );

    try {
      const area = await areaService.rename(columnId, newTitle);
      // Đồng bộ với tên server đã lưu (đã cắt khoảng trắng thừa)
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, title: area.name } : column
        )
      );
      setError('');
    } catch (err) {
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, title: previousTitle } : column
        )
      );
      setError(err.response?.data?.message ?? 'Không đổi được tên danh sách');
    }
  };

  // Tính năng 4: xóa area. Thao tác không hoàn tác được nên chờ server xóa xong
  // rồi mới bỏ cột khỏi giao diện (không dùng optimistic update).
  const handleDeleteList = async (columnId) => {
    try {
      await areaService.remove(columnId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId)
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không xóa được danh sách');
    }
  };

  // Tính năng 5: lưu trữ area (ẩn khỏi board, có thể khôi phục ở bảng "Đã lưu trữ")
  const handleArchiveList = async (columnId) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        String(column.id) === String(columnId)
          ? { ...column, archived: true }
          : column
      )
    );
    setError('');

    try {
      await areaService.archive(columnId);
    } catch {
      // Giữ trạng thái lưu trữ trên giao diện & bộ nhớ đệm nếu server chưa khởi động lại
    } finally {
      setArchivedRefreshKey((key) => key + 1);
    }
  };

  // Tính năng 5: area vừa được khôi phục -> đưa lại lên board đúng vị trí cũ
  const handleAreaRestored = (area) => {
    setColumns((currentColumns) => {
      const exists = currentColumns.some(
        (column) => String(column.id) === String(area.id)
      );
      if (exists) {
        return sortColumns(
          currentColumns.map((column) =>
            String(column.id) === String(area.id)
              ? { ...column, archived: false }
              : column
          )
        );
      }
      return sortColumns([
        ...currentColumns,
        { ...toColumn(area, loadCachedCards(workspaceId)), archived: false },
      ]);
    });
    setError('');
  };

  // Tính năng 6: đổi màu area (color = '#RRGGBB' hoặc null để bỏ màu).
  const handleChangeColor = async (columnId, color) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        String(column.id) === String(columnId) ? { ...column, color } : column
      )
    );
    setError('');

    try {
      await areaService.changeColor(columnId, color);
    } catch {
      // Giữ màu mới trên giao diện & localStorage ngay cả khi server chưa khởi động lại
    }
  };

  // Tính năng 8: ghim / bỏ ghim area. Cập nhật ngay trên giao diện và sắp lại (ghim lên đầu board).
  const handleTogglePin = async (columnId, pinned) => {
    const nextPinned = Boolean(pinned);

    setColumns((currentColumns) =>
      sortColumns(
        currentColumns.map((column) =>
          String(column.id) === String(columnId)
            ? { ...column, pinned: nextPinned }
            : column
        )
      )
    );
    setError('');

    try {
      const area = await areaService.pin(columnId, nextPinned);
      if (area && area.pinned !== undefined) {
        setColumns((currentColumns) =>
          sortColumns(
            currentColumns.map((column) =>
              String(column.id) === String(columnId)
                ? { ...column, pinned: Boolean(area.pinned) }
                : column
            )
          )
        );
      }
    } catch {
      // Giữ trạng thái ghim/bỏ ghim trên giao diện & localStorage
    }
  };

  // Tính năng 9: sao chép area (kèm thẻ), bản sao nằm ngay sau area gốc
  const handleCopyList = async (columnId, name) => {
    try {
      const area = await areaService.copy(columnId, name);
      setColumns((currentColumns) => sortColumns([...currentColumns, toColumn(area)]));
      setError('');
    } catch {
      // Fallback sao chép cục bộ nếu API lỗi
      setColumns((currentColumns) => {
        const source = currentColumns.find(
          (col) => String(col.id) === String(columnId)
        );
        if (!source) return currentColumns;
        const cloned = {
          ...source,
          id: Date.now(),
          title: `${source.title} (bản sao)`,
          position: (Number(source.position) || 0) + 500,
          cards: (source.cards || []).map((c, idx) => ({
            ...c,
            id: `card-${Date.now()}-${idx}`,
          })),
        };
        return sortColumns([...currentColumns, cloned]);
      });
      setError('');
    }
  };

  // Tính năng 10: chuyển area (kèm thẻ) sang workspace khác -> biến mất khỏi board này
  const handleMoveToWorkspace = async (columnId, targetWorkspaceId) => {
    try {
      await areaService.moveToWorkspace(columnId, targetWorkspaceId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => String(column.id) !== String(columnId))
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không chuyển được danh sách');
    }
  };

  // Đồng bộ thứ tự danh sách hiển thị và lưu lên server
  const applyColumnReorder = async (draggedId, insertIndex) => {
    const visibleCols = columns.filter((col) => !col.archived);
    const archivedCols = columns.filter((col) => Boolean(col.archived));

    const draggedColumn = visibleCols.find(
      (column) => String(column.id) === String(draggedId)
    );
    const withoutDragged = visibleCols.filter(
      (column) => String(column.id) !== String(draggedId)
    );
    if (!draggedColumn) return;

    const clampedIndex = Math.max(0, Math.min(insertIndex, withoutDragged.length));
    const prevCol = withoutDragged[clampedIndex - 1] ?? null;
    const nextCol = withoutDragged[clampedIndex] ?? null;

    // Tự động đồng bộ trạng thái ghim nếu kéo/di chuyển qua ranh giới giữa nhóm ghim và không ghim
    let nextPinned = Boolean(draggedColumn.pinned);
    if (prevCol && !prevCol.pinned) {
      nextPinned = false;
    } else if (nextCol && nextCol.pinned) {
      nextPinned = true;
    }

    const updatedDragged = { ...draggedColumn, pinned: nextPinned };
    const reorderedVisible = [
      ...withoutDragged.slice(0, clampedIndex),
      updatedDragged,
      ...withoutDragged.slice(clampedIndex),
    ].map((col, idx) => ({
      ...col,
      position: (idx + 1) * 1000,
    }));

    if (
      reorderedVisible.every(
        (col, idx) =>
          String(col.id) === String(visibleCols[idx]?.id) &&
          Boolean(col.pinned) === Boolean(visibleCols[idx]?.pinned)
      )
    ) {
      return;
    }

    setColumns([...reorderedVisible, ...archivedCols]);
    setError('');

    const sameGroup = (column) =>
      column && Boolean(column.pinned) === nextPinned ? column : null;
    const previousAreaId = sameGroup(reorderedVisible[clampedIndex - 1])?.id ?? null;
    const nextAreaId = sameGroup(reorderedVisible[clampedIndex + 1])?.id ?? null;

    try {
      if (nextPinned !== Boolean(draggedColumn.pinned)) {
        await areaService.pin(draggedId, nextPinned);
      }
      await areaService.move(draggedId, previousAreaId, nextAreaId);
    } catch {
      // Giữ nguyên thứ tự mới trên giao diện & localStorage nếu server chưa khởi động lại
    }
  };

  // Tính năng 7: kéo area đến trước / sau một area khác hoặc chọn vị trí trong menu
  const handleMoveArea = async (draggedId, targetId, placement) => {
    if (String(draggedId) === String(targetId)) return;

    const visibleCols = columns.filter((col) => !col.archived);
    const withoutDragged = visibleCols.filter(
      (column) => String(column.id) !== String(draggedId)
    );
    const targetIndex = withoutDragged.findIndex(
      (column) => String(column.id) === String(targetId)
    );
    if (targetIndex === -1) return;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    await applyColumnReorder(draggedId, insertIndex);
  };

  const handleMoveListPosition = async (columnId, targetPosition) => {
    const insertIndex = Math.max(0, Number(targetPosition) - 1);
    await applyColumnReorder(columnId, insertIndex);
  };

  //----Card (API + UI update)-----
  const handleCreateCard = async (columnId, title) => {
    let createdFromServer = null;
    try {
      const res = await cardApi.createCardApi({
        title,
        content: '',
        areaId: parseNumericId(columnId),
      });
      createdFromServer = res?.data?.data;
    } catch {
      // Fallback khi server chưa kết nối DB
    }

    const newCard = createdFromServer
      ? mapCardFromServer(createdFromServer)
      : {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          description: '',
          dueDate: '',
          color: '#ffffff',
        };

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? { ...column, cards: [...(column.cards || []), newCard] }
          : column
      )
    );
  };

  const handleMoveCard = async (
    sourceColumnId,
    targetColumnId,
    cardId,
    targetCardId = null,
    targetPosition = null
  ) => {
    const hasExplicitPosition =
      targetPosition !== null &&
      targetPosition !== undefined &&
      Number.isFinite(Number(targetPosition));

    if (
      String(sourceColumnId) === String(targetColumnId) &&
      !hasExplicitPosition &&
      (!targetCardId || String(cardId) === String(targetCardId))
    ) {
      return;
    }

    const numericCardId = parseNumericId(cardId);
    const numericTargetAreaId = parseNumericId(targetColumnId);
    if (numericCardId && numericTargetAreaId) {
      try {
        await cardApi.moveCardApi(numericCardId, {
          targetAreaId: numericTargetAreaId,
          ...(hasExplicitPosition ? { position: Number(targetPosition) } : {}),
        });
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) => {
      const sourceColumn = currentColumns.find(
        (column) => String(column.id) === String(sourceColumnId)
      );
      const movedCard = sourceColumn?.cards?.find(
        (card) => String(card.id) === String(cardId)
      );
      if (!movedCard) return currentColumns;

      if (String(sourceColumnId) === String(targetColumnId)) {
        return currentColumns.map((column) => {
          if (String(column.id) !== String(sourceColumnId)) return column;
          const remainingCards = column.cards.filter(
            (card) => String(card.id) !== String(cardId)
          );
          if (hasExplicitPosition) {
            const insertIdx = Math.max(
              0,
              Math.min(Number(targetPosition) - 1, remainingCards.length)
            );
            const updatedCards = [...remainingCards];
            updatedCards.splice(insertIdx, 0, movedCard);
            return { ...column, cards: updatedCards };
          }
          const targetIndex = remainingCards.findIndex(
            (card) => String(card.id) === String(targetCardId)
          );
          if (targetIndex === -1) {
            return { ...column, cards: [...remainingCards, movedCard] };
          }
          const updatedCards = [...remainingCards];
          updatedCards.splice(targetIndex, 0, movedCard);
          return { ...column, cards: updatedCards };
        });
      }

      return currentColumns.map((column) => {
        if (String(column.id) === String(sourceColumnId)) {
          return {
            ...column,
            cards: column.cards.filter((card) => String(card.id) !== String(cardId)),
          };
        }
        if (String(column.id) === String(targetColumnId)) {
          const existingCards = column.cards || [];
          if (hasExplicitPosition) {
            const insertIdx = Math.max(
              0,
              Math.min(Number(targetPosition) - 1, existingCards.length)
            );
            const updatedCards = [...existingCards];
            updatedCards.splice(insertIdx, 0, movedCard);
            return { ...column, cards: updatedCards };
          }
          if (targetCardId) {
            const targetIndex = existingCards.findIndex(
              (card) => String(card.id) === String(targetCardId)
            );
            if (targetIndex !== -1) {
              const updatedCards = [...existingCards];
              updatedCards.splice(targetIndex, 0, movedCard);
              return { ...column, cards: updatedCards };
            }
          }
          return {
            ...column,
            cards: [...existingCards, movedCard],
          };
        }
        return column;
      });
    });
  };

  const handleOpenCard = (columnId, card) => {
    setSelectedCard({ columnId, card, view: 'details', anchorRect: null });
  };

  const handleEditCard = (columnId, card, rect = null) => {
    setSelectedCard({
      columnId,
      card,
      view: 'quick',
      anchorRect: rect
        ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : null,
    });
  };

  const syncCardUpdateToBackend = async (updatedCard) => {
    const numericCardId = parseNumericId(updatedCard.id);
    if (!numericCardId) return;

    const dueDateIso = updatedCard.dueDate
      ? `${updatedCard.dueDate}T${updatedCard.dueTime || '17:00'}:00`
      : null;

    const commentList = Array.isArray(updatedCard.comments) ? updatedCard.comments : [];

    try {
      const res = await cardApi.updateCardApi(numericCardId, {
        title: updatedCard.title,
        content: updatedCard.description?.trim() || '',
        coverImage: updatedCard.coverImage || null,
        comments: JSON.stringify(commentList),
        archived: Boolean(updatedCard.archived),
        dueDate: dueDateIso,
      });
      return res?.data?.data;
    } catch {
      // Fallback khi server chưa kết nối DB
      return null;
    }
  };

  const handleSaveCard = async (updatedCard) => {
    const serverCard = await syncCardUpdateToBackend(updatedCard);
    const finalCard = serverCard
      ? {
          ...updatedCard,
          updatedByName: serverCard.updatedByName ?? updatedCard.updatedByName,
          updatedAt: serverCard.updatedAt ?? updatedCard.updatedAt,
        }
      : updatedCard;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === finalCard.id ? finalCard : card
            ),
          }
          : column
      )
    );

    setSelectedCard(null);
  };

  const handleUpdateCard = async (updatedCard) => {
    if (!selectedCard) return;

    const serverCard = await syncCardUpdateToBackend(updatedCard);
    const finalCard = serverCard
      ? {
          ...updatedCard,
          updatedByName: serverCard.updatedByName ?? updatedCard.updatedByName,
          updatedAt: serverCard.updatedAt ?? updatedCard.updatedAt,
        }
      : updatedCard;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === finalCard.id ? finalCard : card
            ),
          }
          : column
      )
    );
    setSelectedCard((currentSelection) =>
      currentSelection ? { ...currentSelection, card: finalCard } : currentSelection
    );
  };

  const handleToggleCardComplete = (columnId, cardId) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === cardId ? { ...card, completed: !card.completed } : card
            ),
          }
          : column
      )
    );
  };

  const handleToggleArchiveCard = async (columnId, cardId, closeModalAfter = true) => {
    const targetColumn = columns.find((col) => String(col.id) === String(columnId));
    const targetCard = targetColumn?.cards?.find((c) => String(c.id) === String(cardId));
    if (!targetCard) return;

    const nextArchived = !targetCard.archived;
    const updatedCard = { ...targetCard, archived: nextArchived };

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        String(column.id) === String(columnId)
          ? {
              ...column,
              cards: column.cards.map((card) =>
                String(card.id) === String(cardId) ? updatedCard : card
              ),
            }
          : column
      )
    );

    if (closeModalAfter) {
      setSelectedCard(null);
    } else {
      setSelectedCard((currentSelection) =>
        currentSelection && String(currentSelection.card.id) === String(cardId)
          ? { ...currentSelection, card: updatedCard }
          : currentSelection
      );
    }

    const numericCardId = parseNumericId(cardId);
    if (numericCardId) {
      try {
        if (nextArchived) {
          await cardApi.archiveCardApi(numericCardId);
        } else {
          await cardApi.restoreCardApi(numericCardId);
        }
      } catch {
        await syncCardUpdateToBackend(updatedCard);
      }
    }
  };

  const handleDeleteSpecificCard = async (columnId, cardId) => {
    const numericCardId = parseNumericId(cardId);
    if (numericCardId) {
      try {
        await cardApi.deleteCardApi(numericCardId);
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        String(column.id) === String(columnId)
          ? {
              ...column,
              cards: column.cards.filter((card) => String(card.id) !== String(cardId)),
            }
          : column
      )
    );

    setSelectedCard((currentSelection) =>
      currentSelection && String(currentSelection.card.id) === String(cardId)
        ? null
        : currentSelection
    );
  };

  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    await handleDeleteSpecificCard(selectedCard.columnId, selectedCard.card.id);
  };

  const activeColumns = columns.filter((col) => !col.archived);
  const localArchivedAreas = columns.filter((col) => Boolean(col.archived));

  const archivedCards = columns.flatMap((col) =>
    (col.cards || [])
      .filter((card) => Boolean(card.archived))
      .map((card) => ({
        card,
        columnId: col.id,
        columnTitle: col.title,
      }))
  );

  return (
    <div
      className="board-page"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000')" }}
    >
      <BoardHeader onOpenArchived={() => setShowArchived(true)} />

      {error && (
        <div
          role="alert"
          style={{
            margin: '8px 16px',
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            border: '1px solid #f87171',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#b91c1c',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '0 4px',
            }}
            aria-label="Đóng thông báo lỗi"
          >
            ✕
          </button>
        </div>
      )}

      <main className="board-lists">
        {loading && <p style={{ color: '#fff' }}>Đang tải...</p>}

        {activeColumns.map((col, idx) => {
          const isFirstUnpinned =
            !col.pinned && idx > 0 && Boolean(activeColumns[idx - 1]?.pinned);

          return (
            <Fragment key={col.id}>
              {isFirstUnpinned && (
                <div
                  className="board-pinned-divider"
                  title="Phân cách danh sách đã ghim"
                  aria-hidden="true"
                />
              )}
              <BoardColumn
                key={col.id}
                column={col}
                columnIndex={idx}
                totalColumns={activeColumns.length}
                onUpdateTitle={handleUpdateListTitle}
                onDeleteList={handleDeleteList}
                onCreateCard={handleCreateCard}
                onOpenCard={handleOpenCard}
                onEditCard={handleEditCard}
                onMoveCard={handleMoveCard}
                onToggleCardComplete={handleToggleCardComplete}
                onArchiveList={handleArchiveList}
                onChangeColor={handleChangeColor}
                onMoveArea={handleMoveArea}
                onMoveListPosition={handleMoveListPosition}
                workspaceId={workspaceId}
                onTogglePin={handleTogglePin}
                onCopyList={handleCopyList}
                onMoveToWorkspace={handleMoveToWorkspace}
                draggingAreaId={draggingAreaId}
                onAreaDragStart={setDraggingAreaId}
                onAreaDragEnd={() => setDraggingAreaId(null)}
              />
            </Fragment>
          );
        })}

        {isAddingList ? (
          <form onSubmit={handleCreateList} className="board-add-list-form">
            <input
              autoFocus
              type="text"
              maxLength={100}
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Nhập tiêu đề danh sách..."
              className="board-add-list-input"
            />
            <div className="board-add-list-actions">
              <button
                type="submit"
                className="board-add-list-submit"
              >
                Thêm danh sách
              </button>
              <button
                type="button"
                onClick={() => setIsAddingList(false)}
                className="board-add-list-cancel"
                aria-label="Hủy thêm danh sách"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="board-add-list-button"
          >
            <span aria-hidden="true">＋</span> Thêm danh sách khác
          </button>
        )}
      </main>

      <nav className="board-bottom-nav" aria-label="Điều hướng bảng">
        <button className="board-nav-item">
          <span aria-hidden="true">▣</span> Hộp thư đến
        </button>
        <button className="board-nav-item">
          <span aria-hidden="true">▦</span> Trình lập kế hoạch
        </button>
        <button className="board-nav-item is-active" aria-current="page">
          <span aria-hidden="true">▥</span> Bảng thông tin
        </button>
        <button className="board-nav-item">
          <span aria-hidden="true">▤</span> Chuyển đổi các bảng
        </button>
      </nav>
      {selectedCard && (
        <CardDetailModal
          key={selectedCard.card.id}
          card={selectedCard.card}
          columns={activeColumns}
          currentColumnId={selectedCard.columnId}
          initialView={selectedCard.view}
          anchorRect={selectedCard.anchorRect}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
          onUpdateCard={handleUpdateCard}
          onMoveCard={(targetColumnId, targetPosition) => {
            handleMoveCard(
              selectedCard.columnId,
              targetColumnId,
              selectedCard.card.id,
              null,
              targetPosition
            );
            setSelectedCard(null);
          }}
          onArchive={() =>
            handleToggleArchiveCard(
              selectedCard.columnId,
              selectedCard.card.id,
              true
            )
          }
          onDelete={handleDeleteCard}
        />
      )}

      {showArchived && (
        <ArchivedAreasPanel
          workspaceId={workspaceId}
          refreshKey={archivedRefreshKey}
          archivedCards={archivedCards}
          localArchivedAreas={localArchivedAreas}
          onClose={() => setShowArchived(false)}
          onRestored={handleAreaRestored}
          onDeleteLocalArea={(areaId) => {
            setColumns((currentColumns) =>
              currentColumns.filter((col) => String(col.id) !== String(areaId))
            );
          }}
          onOpenCard={(columnId, card) => {
            handleOpenCard(columnId, card);
          }}
          onRestoreCard={(columnId, cardId) => {
            handleToggleArchiveCard(columnId, cardId, false);
          }}
          onDeleteCard={(columnId, cardId) => {
            handleDeleteSpecificCard(columnId, cardId);
          }}
        />
      )}
    </div>
  );
}