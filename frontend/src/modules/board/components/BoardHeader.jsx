import ThemeToggle from "../../../shared/components/ThemeToggle";

export default function BoardHeader({
    onOpenArchived,
    workspaceId,
}) {
    return (
        <header className="board-header">
            <div className="board-header-left"></div>

            <div className="board-header-actions">
                <button
                    type="button"
                    className="board-archive-button"
                    onClick={onOpenArchived}
                >
                    Đã lưu trữ
                </button>

                <ThemeToggle />
            </div>
        </header>
    );
}
