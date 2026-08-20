import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function About() {
  useEffect(() => {
    document.title = "About — SPMJ Foundation";
  }, []);
  useScrollReveal();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About SPMJ Foundation</span>
          <h1 className="display">Stronger families, <span className="grad">stronger</span> communities.</h1>
          <p className="lead">
            SPMJ Foundation works across education, women &amp; child development, and health
            awareness — because no family's future should be decided by where they were born or
            what they can afford. We exist to close that gap, one community at a time.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Our story</span>
            <h2>Rooted in Banaskantha, working for the community.</h2>
            <p>
              SPMJ Foundation was started by a group of local volunteers who kept meeting families
              across Palanpur and Vav Tharad who needed support with education, child welfare, and
              access to basic healthcare — but distance, awareness, and daily survival kept getting
              in the way.
            </p>
            <p>
              So we began running health awareness camps and community outreach programs from our
              offices in Palanpur and Tharad. Word spread, families came, and our work grew. Today
              we run education, women &amp; child development, and health awareness programs
              across the district — but our promise is unchanged: support should be accessible,
              dignified, and within every family's reach.
            </p>
          </div>
          <div className="story-art">
            <div className="story-card">
              <strong>Education</strong>
              <span>Supporting learning opportunities for children in our community.</span>
            </div>
            <div className="story-card">
              <strong>Women &amp; Child Development</strong>
              <span>Programs focused on the welfare and development of women and children.</span>
            </div>
            <div className="story-card">
              <strong>Health Awareness</strong>
              <span>Camps and awareness programs on health and hygiene for families.</span>
            </div>
            <div className="story-card">
              <strong>Today</strong>
              <span>A growing team of volunteers and supporters working for every family.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            <div className="value-card">
              <h3>Our mission</h3>
              <p>To support education, women &amp; child development, and health awareness across our community — so families can break the cycle of poverty and access the care they need.</p>
            </div>
            <div className="value-card">
              <h3>Our vision</h3>
              <p>A community where every family — regardless of income, gender, or background — has equal access to education, healthcare, and opportunity.</p>
            </div>
            <div className="value-card">
              <h3>Our approach</h3>
              <p>We support the whole family: education, health awareness camps, and welfare programs for women and children — working alongside families and local communities, not apart from them.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What we believe</span>
            <h2>The values that shape our work.</h2>
          </div>
          <div className="grid grid-3">
            <div className="value-card">
              <h3>Every family matters</h3>
              <p>We meet families where they are and believe in every one of them — no one is written off, ever.</p>
            </div>
            <div className="value-card">
              <h3>Care is a right</h3>
              <p>Education and healthcare should never depend on a family's income. Our programs are free and open to all.</p>
            </div>
            <div className="value-card">
              <h3>Dignity first</h3>
              <p>We serve with respect, never charity that shames. Families are partners, not recipients.</p>
            </div>
            <div className="value-card">
              <h3>Transparency &amp; trust</h3>
              <p>Open reporting and honest numbers. Every supporter can see exactly how their contribution is used.</p>
            </div>
            <div className="value-card">
              <h3>Rooted in community</h3>
              <p>Our volunteers come from the same neighbourhoods as the families we serve. Change grows from within.</p>
            </div>
            <div className="value-card">
              <h3>In it for the long run</h3>
              <p>We walk with families from their first visit through years of support. Real change takes years.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container cta-card">
          <div>
            <h2>Want to be part of the change?</h2>
            <p className="lead">Donate, volunteer, or simply learn more — we'd love to hear from you.</p>
          </div>
          <Link to="/contact" className="btn btn-primary btn-lg">Get involved →</Link>
        </div>
      </section>
    </>
  );
}
