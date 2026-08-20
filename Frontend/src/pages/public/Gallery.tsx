import { useEffect } from "react";
import { getGallery } from "../../api/gallery";
import { usePagedList } from "../../hooks/usePagedList";
import GalleryGrid from "../../components/GalleryGrid";
import Pagination from "../../components/Pagination";
import PageSizeSelect from "../../components/PageSizeSelect";

export default function Gallery() {
  useEffect(() => {
    document.title = "Gallery — SPMJ Foundation";
  }, []);

  const { items, pagination, pageSize, setPage, setPageSize, loading } = usePagedList(
    (page, size) => getGallery(page, size)
  );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Gallery</span>
          <h1 className="display">Moments from our <span className="grad">programs</span>.</h1>
          <p className="lead">Photos and videos from our events, camps, and community programs.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!loading && (
            <>
              <div className="list-controls">
                <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
              </div>
              <GalleryGrid items={items} />
              {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
            </>
          )}
        </div>
      </section>
    </>
  );
}
