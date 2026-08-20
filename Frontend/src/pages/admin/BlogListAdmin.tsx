import { useEffect } from "react";
import { Link } from "react-router-dom";
import { listBlogAdmin, deleteBlogPost } from "../../api/blog";
import { usePagedList } from "../../hooks/usePagedList";
import PageSizeSelect from "../../components/PageSizeSelect";
import Pagination from "../../components/Pagination";
import RowActions from "../../components/RowActions";
import { useToast } from "../../components/Toast";

export default function BlogListAdmin() {
  useEffect(() => {
    document.title = "Manage Blog — SPMJ Admin";
  }, []);

  const toast = useToast();
  const { items, pagination, pageSize, setPage, setPageSize, loading, reload } = usePagedList(
    (p, size) => listBlogAdmin(p, size).then((d) => ({ items: d.posts, pagination: d.pagination }))
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteBlogPost(id);
      toast.success("Post deleted.");
      reload();
    } catch {
      toast.error("Could not delete the post.");
    }
  };

  return (
    <>
      <div className="admin-list-head">
        <div>
          <span className="eyebrow">Blog &amp; News</span>
          <h1>Manage posts</h1>
        </div>
        <div className="admin-list-actions">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
          <Link to="/admin/blog/new" className="btn btn-primary">+ New post</Link>
        </div>
      </div>

      <div className="admin-panel">
        {!loading && (
          items.length === 0 ? (
            <p className="muted">
              No posts yet. <Link to="/admin/blog/new" className="link-arrow">Write the first one →</Link>
            </p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table data-table-rich">
                  <thead>
                    <tr>
                      <th className="col-thumb"></th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Published</th>
                      <th>Status</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td className="col-thumb">
                          {p.coverImage ? (
                            <img className="table-thumb" src={p.coverImage} alt="" loading="lazy" />
                          ) : (
                            <span className="table-thumb placeholder">{p.title.charAt(0).toUpperCase()}</span>
                          )}
                        </td>
                        <td>
                          <a className="table-title" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                            {p.title}
                          </a>
                        </td>
                        <td><span className={`badge badge-${p.category}`}>{p.category}</span></td>
                        <td className="nowrap">
                          {new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          {p.published ? (
                            <span className="badge badge-upcoming">Live</span>
                          ) : (
                            <span className="badge badge-draft">Draft</span>
                          )}
                        </td>
                        <td className="col-actions">
                          <RowActions editUrl={`/admin/blog/${p.id}/edit`} onDelete={() => handleDelete(p.id)} confirmMsg="Delete this post?" />
                        </td>
                      </tr>
                    ))}
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
