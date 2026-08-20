import { Link } from "react-router-dom";

interface Props {
  editUrl: string;
  onDelete: () => void;
  confirmMsg?: string;
}

export default function RowActions({ editUrl, onDelete, confirmMsg = "Delete this item?" }: Props) {
  const handleDelete = () => {
    if (window.confirm(confirmMsg)) onDelete();
  };

  return (
    <div className="table-actions">
      <Link to={editUrl} className="icon-btn" title="Edit" aria-label="Edit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </Link>
      <button type="button" className="icon-btn danger" title="Delete" aria-label="Delete" onClick={handleDelete}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
