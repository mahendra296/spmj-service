import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getGallery } from "../../api/gallery";
import { usePagedList } from "../../hooks/usePagedList";
import GalleryGrid from "../../components/GalleryGrid";
import Pagination from "../../components/Pagination";
import PageSizeSelect from "../../components/PageSizeSelect";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function Services() {
  useEffect(() => {
    document.title = "Programs — SPMJ Foundation";
  }, []);
  useScrollReveal();

  const { items, pagination, pageSize, setPage, setPageSize, loading } = usePagedList(
    (page, size) => getGallery(page, size)
  );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Our programs</span>
          <h1 className="display">Support for <span className="grad">every step</span> of the way.</h1>
          <p className="lead">
            From health awareness camps to education and child development support, our programs
            work together to help families in our community thrive.
          </p>
        </div>
      </section>

      <section className="section" id="gallery">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Gallery</span>
            <h2>Moments from our programs.</h2>
            <p className="lead" style={{ margin: "12px auto 0" }}>Photos and videos from our events, camps, and learning centres.</p>
          </div>
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

      <section className="section cta-section">
        <div className="container cta-card">
          <div>
            <h2>Not sure how to help?</h2>
            <p className="lead">Tell us a little about you — we'll suggest the best way to make a difference.</p>
          </div>
          <Link to="/contact" className="btn btn-primary btn-lg">Get in touch →</Link>
        </div>
      </section>
    </>
  );
}
