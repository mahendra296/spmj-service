import { useEffect } from "react";
import { Link } from "react-router-dom";
import HeroSlider, { type Slide } from "../../components/HeroSlider";
import ServiceIcon from "../../components/ServiceIcon";
import { PROGRAMS } from "../../constants";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const SLIDES: Slide[] = [
  {
    image: "/images/slide-1.svg",
    eyebrow: "Education · Health · Community",
    heading: <>Every family deserves a <span className="grad">future</span>.</>,
    lead: "SPMJ Foundation brings education, women & child development, and health awareness to families who would otherwise be left behind.",
  },
  {
    image: "/images/slide-2.svg",
    eyebrow: "Support that lasts",
    heading: <>From awareness to <span className="grad">confidence</span>.</>,
    lead: "Health camps, education support, and community outreach that help families stay healthy, informed, and thriving.",
  },
  {
    image: "/images/slide-3.svg",
    eyebrow: "Building stronger communities",
    heading: <>Aware. Supported. <span className="grad">Ready.</span></>,
    lead: "Health awareness camps and social programs that give every family the tools to learn, grow, and thrive.",
  },
];

const PARTNERS = ["Asha Trust", "Vidya Fund", "Sahyog", "Jyoti&Co", "Prerna", "Udaan"];

export default function Home() {
  useEffect(() => {
    document.title = "SPMJ Foundation — Education for every child";
  }, []);
  useScrollReveal();

  return (
    <>
      <HeroSlider slides={SLIDES} />

      <section className="section logos">
        <div className="container">
          <p className="logos-label">Supported by partners and well-wishers like</p>
          <div className="logos-row">
            {PARTNERS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What we do</span>
            <h2>A whole-family approach,<br />from health awareness to opportunity.</h2>
          </div>
          <div className="grid grid-3">
            {PROGRAMS.slice(0, 6).map((s) => (
              <article className="service-card" key={s.title}>
                <ServiceIcon icon={s.icon} />
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <Link to="/services" className="link-arrow">Learn more →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Voices from our community</span>
            <h2>Stories of change.</h2>
          </div>
          <div className="grid grid-3">
            <blockquote className="testimonial">
              <p>"The health camp near our village gave my family a check-up we never had access to before."</p>
              <footer><strong>Community member</strong> · Palanpur</footer>
            </blockquote>
            <blockquote className="testimonial">
              <p>"The awareness sessions helped me understand how to care for my child's health and education."</p>
              <footer><strong>Community member</strong> · Vav Tharad</footer>
            </blockquote>
            <blockquote className="testimonial">
              <p>"Volunteering here changed me as much as the families we serve. You see hope grow, one visit at a time."</p>
              <footer><strong>Volunteer</strong> · SPMJ Foundation</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container cta-card">
          <div>
            <h2>Help us reach more families.</h2>
            <p className="lead">Donate, volunteer, or partner with us — every contribution opens a door to a healthier, better-informed community.</p>
          </div>
          <Link to="/contact" className="btn btn-primary btn-lg">Get involved →</Link>
        </div>
      </section>
    </>
  );
}
