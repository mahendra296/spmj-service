import { useEffect } from "react";
import { Link } from "react-router-dom";
import { listGalleryAdmin, deleteGalleryItem } from "../../api/gallery";
import { usePagedList } from "../../hooks/usePagedList";
import PageSizeSelect from "../../components/PageSizeSelect";
import Pagination from "../../components/Pagination";
import RowActions from "../../components/RowActions";
import { useToast } from "../../components/Toast";

export default function GalleryListAdmin() {
  useEffect(() => {
    document.title = "Manage Gallery — SPMJ Admin";
  }, []);

  const toast = useToast();
  const { items, pagination, pageSize, setPage, setPageSize, loading, reload } = usePagedList(
    (p, size) => listGalleryAdmin(p, size)
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteGalleryItem(id);
      toast.success("Media deleted.");
      reload();
    } catch {
      toast.error("Could not delete the media.");
    }
  };

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Gallery</span>
          <h1>Manage media</h1>
        </div>
        <div className="admin-list-actions">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
          <Link to="/admin/gallery/new" className="btn btn-primary">+ Add media</Link>
        </div>
      </div>

      <div className="admin-panel">
        {!loading && (
          items.length === 0 ? (
            <p className="muted">
              No media yet. <Link to="/admin/gallery/new" className="link-arrow">Add the first photo or video →</Link>
            </p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table data-table-rich">
                  <thead>
                    <tr>
                      <th className="col-thumb"></th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Linked event</th>
                      <th>Added</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isFile = item.mediaUrl.startsWith("/uploads/");
                      return (
                        <tr key={item.id}>
                          <td className="col-thumb">
                            {item.mediaType === "video" ? (
                              isFile ? (
                                <video className="table-thumb" src={item.mediaUrl} preload="metadata" muted />
                              ) : (
                                <span className="table-thumb placeholder">▶</span>
                              )
                            ) : (
                              <img className="table-thumb" src={item.mediaUrl} alt="" loading="lazy" />
                            )}
                          </td>
                          <td><span className="table-title">{item.title || "Untitled"}</span></td>
                          <td>
                            {item.mediaType === "video" ? (
                              <span className="badge badge-press">Video</span>
                            ) : (
                              <span className="badge badge-article">Photo</span>
                            )}
                          </td>
                          <td>{item.eventTitle || "—"}</td>
                          <td className="nowrap">
                            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="col-actions">
                            <RowActions editUrl={`/admin/gallery/${item.id}/edit`} onDelete={() => handleDelete(item.id)} confirmMsg="Delete this media?" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
            </>
          )
        )}
      </div>
    </>
  );
}
