import { useEffect, useState } from 'react';
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

// Thẻ đã lưu trong trình duyệt, tra theo id để ghép thêm các trường chỉ có ở giao diện
const loadCachedCards = (workspaceId) => {
  const cardsById = new Map();
  try {
    const raw = localStorage.getItem(storageKeyFor(workspaceId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      parsed.forEach((col) => {
        (col.cards || []).forEach((card) => cardsById.set(String(card.id), card));
      });
    }
  } catch {
    // Dữ liệu đệm hỏng thì bỏ qua, dùng dữ liệu từ server
  }
  return cardsById;
};

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
    dueDate,
    dueTime,
    dueDateEnabled: Boolean(dueDate),
    color: existingLocalCard?.color || '#ffffff',
  };
};

// Area đã ghim luôn nằm trước, trong mỗi nhóm sắp theo position (khớp thứ tự server trả về)
const sortColumns = (columns) =>
  [...columns].sort(
    (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || a.position - b.position
  );

// Đổi dữ liệu area từ API thành dạng "cột" mà giao diện đang dùng
function toColumn(area, cachedCards = new Map()) {
  return {
    id: area.id,
    title: area.name,
    position: area.position,
    color: area.color ?? null,
    pinned: Boolean(area.pinned),
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
        const cachedCards = loadCachedCards(workspaceId);
        setColumns(areas.map((area) => toColumn(area, cachedCards)));
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
      setColumns((currentColumns) => [...currentColumns, toColumn(area)]);
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
    try {
      await areaService.archive(columnId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId)
      );
      setArchivedRefreshKey((key) => key + 1); // bảng "Đã lưu trữ" đang mở thì tải lại
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không lưu trữ được danh sách');
    }
  };

  // Tính năng 5: area vừa được khôi phục -> đưa lại lên board đúng vị trí cũ
  const handleAreaRestored = (area) => {
    setColumns((currentColumns) => {
      if (currentColumns.some((column) => column.id === area.id)) {
        return currentColumns;
      }
      return sortColumns([...currentColumns, toColumn(area, loadCachedCards(workspaceId))]);
    });
  };

  // Tính năng 6: đổi màu area (color = '#RRGGBB' hoặc null để bỏ màu).
  // Đổi ngay trên giao diện, nếu API lỗi thì trả lại màu cũ.
  const handleChangeColor = async (columnId, color) => {
    const previousColor = columns.find((column) => column.id === columnId)?.color ?? null;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, color } : column
      )
    );

    try {
      await areaService.changeColor(columnId, color);
      setError('');
    } catch (err) {
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, color: previousColor } : column
        )
      );
      setError(err.response?.data?.message ?? 'Không đổi được màu danh sách');
    }
  };

  // Tính năng 8: ghim / bỏ ghim area. Chờ server xong rồi sắp lại (ghim lên đầu board).
  const handleTogglePin = async (columnId, pinned) => {
    try {
      const area = await areaService.pin(columnId, pinned);
      setColumns((currentColumns) =>
        sortColumns(
          currentColumns.map((column) =>
            column.id === columnId ? { ...column, pinned: Boolean(area.pinned) } : column
          )
        )
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không ghim được danh sách');
    }
  };

  // Tính năng 9: sao chép area (kèm thẻ), bản sao nằm ngay sau area gốc
  const handleCopyList = async (columnId) => {
    try {
      const area = await areaService.copy(columnId);
      setColumns((currentColumns) => sortColumns([...currentColumns, toColumn(area)]));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không sao chép được danh sách');
    }
  };

  // Tính năng 10: chuyển area (kèm thẻ) sang workspace khác -> biến mất khỏi board này
  const handleMoveToWorkspace = async (columnId, targetWorkspaceId) => {
    try {
      await areaService.moveToWorkspace(columnId, targetWorkspaceId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId)
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không chuyển được danh sách');
    }
  };

  // Tính năng 7: kéo area đến trước / sau một area khác.
  // Đổi thứ tự ngay trên giao diện, gửi id hai area hai bên để server tự tính position,
  // nếu API lỗi thì trả lại thứ tự cũ.
  const handleMoveArea = async (draggedId, targetId, placement) => {
    if (draggedId === targetId) return;

    const previousColumns = columns;
    const draggedColumn = columns.find((column) => column.id === draggedId);
    const withoutDragged = columns.filter((column) => column.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((column) => column.id === targetId);

    if (!draggedColumn || targetIndex === -1) return;

    // Area ghim và không ghim là hai nhóm riêng, không kéo xen kẽ nhau
    if (Boolean(draggedColumn.pinned) !== Boolean(withoutDragged[targetIndex].pinned)) return;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    const reordered = [
      ...withoutDragged.slice(0, insertIndex),
      draggedColumn,
      ...withoutDragged.slice(insertIndex),
    ];

    // Thả đúng chỗ cũ thì không làm gì
    if (reordered.every((column, index) => column.id === previousColumns[index].id)) return;

    setColumns(reordered);

    // Chỉ lấy hàng xóm cùng nhóm ghim (hàng xóm khác nhóm coi như đầu / cuối nhóm)
    const sameGroup = (column) =>
      column && Boolean(column.pinned) === Boolean(draggedColumn.pinned) ? column : null;
    const previousAreaId = sameGroup(reordered[insertIndex - 1])?.id ?? null;
    const nextAreaId = sameGroup(reordered[insertIndex + 1])?.id ?? null;

    try {
      await areaService.move(draggedId, previousAreaId, nextAreaId);
      setError('');
    } catch (err) {
      setColumns(previousColumns);
      setError(err.response?.data?.message ?? 'Không đổi được thứ tự danh sách');
    }
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
      await cardApi.updateCardApi(numericCardId, {
        title: updatedCard.title,
        content: updatedCard.description?.trim() || '',
        coverImage: updatedCard.coverImage || null,
        comments: JSON.stringify(commentList),
        dueDate: dueDateIso,
      });
    } catch {
      // Fallback khi server chưa kết nối DB
    }
  };

  const handleSaveCard = async (updatedCard) => {
    await syncCardUpdateToBackend(updatedCard);

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === updatedCard.id ? updatedCard : card
            ),
          }
          : column
      )
    );

    setSelectedCard(null);
  };

  const handleUpdateCard = async (updatedCard) => {
    if (!selectedCard) return;

    await syncCardUpdateToBackend(updatedCard);

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === updatedCard.id ? updatedCard : card
            ),
          }
          : column
      )
    );
    setSelectedCard((currentSelection) =>
      currentSelection ? { ...currentSelection, card: updatedCard } : currentSelection
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

  const handleDeleteCard = async () => {
    if (!selectedCard) return;

    const numericCardId = parseNumericId(selectedCard.card.id);
    if (numericCardId) {
      try {
        await cardApi.deleteCardApi(numericCardId);
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.filter(
              (card) => card.id !== selectedCard.card.id
            ),
          }
          : column
      )
    );

    setSelectedCard(null);
  };

  return (
    <div
      className="board-page"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000')" }}
    >
      <BoardHeader onOpenArchived={() => setShowArchived(true)} />

      <main className="board-lists">
        {loading && <p style={{ color: '#fff' }}>Đang tải...</p>}
        {error && <p style={{ color: '#ff8f8f' }}>{error}</p>}

        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
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
            workspaceId={workspaceId}
            onTogglePin={handleTogglePin}
            onCopyList={handleCopyList}
            onMoveToWorkspace={handleMoveToWorkspace}
            draggingAreaId={draggingAreaId}
            onAreaDragStart={setDraggingAreaId}
            onAreaDragEnd={() => setDraggingAreaId(null)}
          />
        ))}

        {isAddingList ? (
          <form onSubmit={handleCreateList} className="board-add-list-form">
            <input
              autoFocus
              type="text"
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
          columns={columns}
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
          onDelete={handleDeleteCard}
        />
      )}

      {showArchived && (
        <ArchivedAreasPanel
          workspaceId={workspaceId}
          refreshKey={archivedRefreshKey}
          onClose={() => setShowArchived(false)}
          onRestored={handleAreaRestored}
        />
      )}
    </div>
  );
}