import { useEffect } from "react";
import { getBlogPosts } from "../../api/blog";
import { usePagedList } from "../../hooks/usePagedList";
import ContentCard from "../../components/ContentCard";
import Pagination from "../../components/Pagination";
import PageSizeSelect from "../../components/PageSizeSelect";

export default function Blog() {
  useEffect(() => {
    document.title = "Blog & News — SPMJ Foundation";
  }, []);

  const { items, pagination, pageSize, setPage, setPageSize, loading } = usePagedList(
    (page, size) => getBlogPosts(page, size).then((d) => ({ items: d.posts, pagination: d.pagination }))
  );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Blog &amp; News</span>
          <h1 className="display">Stories, news &amp; <span className="grad">updates</span>.</h1>
          <p className="lead">Articles, press coverage, and announcements from across our work.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!loading && (
            items.length === 0 ? (
              <p className="muted">No articles published yet — check back soon.</p>
            ) : (
              <>
                <div className="list-controls">
                  <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
                </div>
                <div className="grid grid-3">
                  {items.map((p) => (
                    <ContentCard post={p} key={p.id} />
                  ))}
                </div>
                {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
              </>
            )
          )}
        </div>
      </section>
    </>
  );
}
