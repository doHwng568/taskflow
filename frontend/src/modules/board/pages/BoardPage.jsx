import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import BoardHeader from '../components/BoardHeader';
import BoardColumn from '../components/BoardColumn';
import CardDetailModal from '../../card/components/CardDetailModal';
import cardApi from '../../card/api/cardApi';
import '../styles/BoardPage.css';

const getBoardStorageKey = (workspaceId) =>
  workspaceId ? `taskflow_board_columns_${workspaceId}` : 'taskflow_board_columns';

const DEFAULT_COLUMNS = [
  { id: 'col-1', title: 'Cần làm', cards: [] },
  { id: 'col-2', title: 'Đang làm', cards: [] },
  { id: 'col-3', title: 'Đã xong', cards: [] },
];

const loadColumnsFromStorage = (workspaceId) => {
  try {
    const key = getBoardStorageKey(workspaceId);
    const raw = localStorage.getItem(key);
    if (!raw) return workspaceId ? [] : DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : (workspaceId ? [] : DEFAULT_COLUMNS);
  } catch {
    return workspaceId ? [] : DEFAULT_COLUMNS;
  }
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

export default function BoardPage() {
  const { workspaceId } = useParams();
  const [columns, setColumns] = useState(() => loadColumnsFromStorage(workspaceId));
  const [prevWorkspaceId, setPrevWorkspaceId] = useState(workspaceId);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [errorNotification, setErrorNotification] = useState('');
  const inFlightMovesRef = useRef(new Set());

  useEffect(() => {
    if (!errorNotification) return;
    const timer = setTimeout(() => {
      setErrorNotification('');
    }, 4500);
    return () => clearTimeout(timer);
  }, [errorNotification]);

  if (prevWorkspaceId !== workspaceId) {
    setPrevWorkspaceId(workspaceId);
    setColumns(loadColumnsFromStorage(workspaceId));
  }

  const parseNumericId = (rawId) => {
    if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId > 0) {
      return rawId;
    }
    const num = Number(String(rawId).replace(/\D/g, ''));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  useEffect(() => {
    try {
      const key = getBoardStorageKey(workspaceId);
      localStorage.setItem(key, JSON.stringify(columns));
    } catch {
      // Ignore storage quota errors
    }
  }, [columns, workspaceId]);

  useEffect(() => {
    let isMounted = true;

    const fetchBoardData = async () => {
      try {
        const res = await cardApi.getAreasApi(workspaceId);
        const serverAreas = res?.data?.data;
        if (isMounted && Array.isArray(serverAreas)) {
          setColumns((currentColumns) => {
            const localCardsById = new Map();
            currentColumns.forEach((col) => {
              (col.cards || []).forEach((c) => {
                localCardsById.set(String(c.id), c);
              });
            });

            return serverAreas.map((area) => ({
              id: area.id,
              title: area.name,
              cards: (area.cards || []).map((serverCard) =>
                mapCardFromServer(serverCard, localCardsById.get(String(serverCard.id)))
              ),
            }));
          });
        }
      } catch {
        // Khi Backend chưa chạy hoặc lỗi kết nối, giữ nguyên dữ liệu từ localStorage
      }
    };

    fetchBoardData();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleCreateList = async (event) => {
    event.preventDefault();

    const title = newListTitle.trim();
    if (!title) return;

    setNewListTitle('');
    setIsAddingList(false);

    let createdArea = null;
    const numericWorkspaceId = parseNumericId(workspaceId);
    try {
      const res = await cardApi.createAreaApi({
        name: title,
        position: columns.length + 1,
        ...(numericWorkspaceId ? { workspaceId: numericWorkspaceId } : {}),
      });
      createdArea = res?.data?.data;
    } catch {
      // Fallback khi server chưa kết nối DB
    }

    setColumns((currentColumns) => [
      ...currentColumns,
      {
        id: createdArea?.id ?? `col-${Date.now()}`,
        title: createdArea?.name ?? title,
        cards: [],
      },
    ]);
  };

  const handleUpdateListTitle = async (columnId, newTitle) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    const numericAreaId = parseNumericId(columnId);
    if (numericAreaId) {
      try {
        await cardApi.updateAreaApi(numericAreaId, { name: trimmedTitle });
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title: trimmedTitle } : column
      )
    );
  };

  const handleDeleteList = async (columnId) => {
    const numericAreaId = parseNumericId(columnId);
    if (numericAreaId) {
      try {
        await cardApi.deleteAreaApi(numericAreaId);
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId)
    );
  };

  const handleMoveColumn = (sourceColumnId, targetColumnId) => {
    if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
      return;
    }

    setColumns((currentColumns) => {
      const sourceIndex = currentColumns.findIndex((col) => col.id === sourceColumnId);
      const targetIndex = currentColumns.findIndex((col) => col.id === targetColumnId);
      if (sourceIndex === -1 || targetIndex === -1) return currentColumns;

      const updatedColumns = [...currentColumns];
      const [movedColumn] = updatedColumns.splice(sourceIndex, 1);
      updatedColumns.splice(targetIndex, 0, movedColumn);

      updatedColumns.forEach((col, index) => {
        const numericAreaId = parseNumericId(col.id);
        if (numericAreaId) {
          cardApi.updateAreaApi(numericAreaId, { position: index + 1 }).catch(() => {});
        }
      });

      return updatedColumns;
    });
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
    targetPosition = null,
    comment = null
  ) => {
    // 1. Chỉ di chuyển card giữa 2 Area khác nhau, chặn cùng Area
    if (
      !sourceColumnId ||
      !targetColumnId ||
      String(sourceColumnId) === String(targetColumnId)
    ) {
      return false;
    }

    // 2. Chặn duplicate API requests khi có thao tác drop liên tục trên cùng 1 card
    const cardKey = String(cardId);
    if (inFlightMovesRef.current.has(cardKey)) {
      return false;
    }
    inFlightMovesRef.current.add(cardKey);

    // 3. Snapshot trạng thái trước khi chuyển để phục hồi khi API thất bại
    const previousColumns = columns;

    const sourceColumn = previousColumns.find(
      (column) => String(column.id) === String(sourceColumnId)
    );
    const movedCard = sourceColumn?.cards?.find(
      (card) => String(card.id) === String(cardId)
    );

    if (!movedCard) {
      inFlightMovesRef.current.delete(cardKey);
      return false;
    }

    const targetColumn = previousColumns.find(
      (column) => String(column.id) === String(targetColumnId)
    );
    const existingTargetCards = targetColumn?.cards || [];

    const hasExplicitPosition =
      targetPosition !== null &&
      targetPosition !== undefined &&
      Number.isFinite(Number(targetPosition));

    let targetInsertIdx = existingTargetCards.length;
    let reqPosition = existingTargetCards.length + 1;

    if (hasExplicitPosition) {
      targetInsertIdx = Math.max(
        0,
        Math.min(Number(targetPosition) - 1, existingTargetCards.length)
      );
      reqPosition = targetInsertIdx + 1;
    } else if (targetCardId) {
      const idx = existingTargetCards.findIndex(
        (card) => String(card.id) === String(targetCardId)
      );
      if (idx !== -1) {
        targetInsertIdx = idx;
        reqPosition = idx + 1;
      }
    }

    // 4. Cập nhật lạc quan trên frontend
    const updatedTargetCards = [...existingTargetCards];
    updatedTargetCards.splice(targetInsertIdx, 0, movedCard);

    setColumns((currentColumns) =>
      currentColumns.map((column) => {
        if (String(column.id) === String(sourceColumnId)) {
          return {
            ...column,
            cards: (column.cards || []).filter(
              (card) => String(card.id) !== String(cardId)
            ),
          };
        }
        if (String(column.id) === String(targetColumnId)) {
          return {
            ...column,
            cards: updatedTargetCards,
          };
        }
        return column;
      })
    );

    // 5. Gửi request lên Backend API
    const numericCardId = parseNumericId(cardId);
    const numericTargetAreaId = parseNumericId(targetColumnId);
    let serverUpdatedCard = null;

    if (numericCardId && numericTargetAreaId) {
      try {
        const payload = {
          targetAreaId: numericTargetAreaId,
          position: Number(reqPosition),
          ...(comment && typeof comment === 'string' && comment.trim()
            ? { comment: comment.trim() }
            : {}),
        };
        const res = await cardApi.moveCardApi(numericCardId, payload);
        serverUpdatedCard = res?.data?.data;
      } catch (err) {
        // Hoàn tác về trạng thái ban đầu khi API thất bại
        setColumns(previousColumns);
        const errMsg =
          err?.response?.data?.message ||
          'Di chuyển thẻ thất bại. Đã khôi phục trạng thái ban đầu.';
        setErrorNotification(errMsg);
        return false;
      } finally {
        inFlightMovesRef.current.delete(cardKey);
      }
    } else {
      inFlightMovesRef.current.delete(cardKey);
    }

    // 6. Đồng bộ trạng thái từ backend response (bảo toàn position & content/description mapping)
    if (serverUpdatedCard) {
      setColumns((currentColumns) =>
        currentColumns.map((column) => {
          if (String(column.id) === String(targetColumnId)) {
            const mappedCard = mapCardFromServer(serverUpdatedCard, movedCard);
            return {
              ...column,
              cards: (column.cards || []).map((c) =>
                String(c.id) === String(serverUpdatedCard.id) ? mappedCard : c
              ),
            };
          }
          return column;
        })
      );
    }

    return true;
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
      <BoardHeader />

      <main className="board-lists">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            onUpdateTitle={handleUpdateListTitle}
            onDeleteList={handleDeleteList}
            onMoveColumn={handleMoveColumn}
            onCreateCard={handleCreateCard}
            onOpenCard={handleOpenCard}
            onEditCard={handleEditCard}
            onMoveCard={handleMoveCard}
            onToggleCardComplete={handleToggleCardComplete}
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
          onMoveCard={async (targetColumnId, targetPosition, comment) => {
            const success = await handleMoveCard(
              selectedCard.columnId,
              targetColumnId,
              selectedCard.card.id,
              null,
              targetPosition,
              comment
            );
            if (success) {
              setSelectedCard((prev) =>
                prev
                  ? {
                      ...prev,
                      columnId: targetColumnId,
                    }
                  : null
              );
            }
            return success;
          }}
          onDelete={handleDeleteCard}
        />
      )}
      {errorNotification && (
        <div className="board-error-toast" role="alert">
          <span>{errorNotification}</span>
          <button
            type="button"
            onClick={() => setErrorNotification('')}
            aria-label="Đóng thông báo lỗi"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
