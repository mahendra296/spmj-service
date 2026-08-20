import { PAGE_SIZE_OPTIONS } from "../constants";

interface Props {
  pageSize: number;
  onChange: (size: number) => void;
}

export default function PageSizeSelect({ pageSize, onChange }: Props) {
  return (
    <div className="page-size">
      <label className="page-size-label">
        <span>Show</span>
        <span className="select-wrap">
          <select
            className="page-size-select"
            aria-label="Items per page"
            value={pageSize}
            onChange={(e) => onChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
        <span>per page</span>
      </label>
    </div>
  );
}
