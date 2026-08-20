import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

import PublicLayout from "./layout/PublicLayout";
import AdminLayout from "./layout/AdminLayout";
import AdminLoginLayout from "./layout/AdminLoginLayout";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Events from "./pages/public/Events";
import EventDetail from "./pages/public/EventDetail";
import Blog from "./pages/public/Blog";
import BlogDetail from "./pages/public/BlogDetail";
import Gallery from "./pages/public/Gallery";
import Contact from "./pages/public/Contact";
import Donate from "./pages/public/Donate";
import DonateSuccess from "./pages/public/DonateSuccess";
import NotFound from "./pages/public/NotFound";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import EventsListAdmin from "./pages/admin/EventsListAdmin";
import EventForm from "./pages/admin/EventForm";
import BlogListAdmin from "./pages/admin/BlogListAdmin";
import BlogForm from "./pages/admin/BlogForm";
import GalleryListAdmin from "./pages/admin/GalleryListAdmin";
import GalleryForm from "./pages/admin/GalleryForm";
import DonationsListAdmin from "./pages/admin/DonationsListAdmin";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/donate/success" element={<DonateSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminLoginLayout />}>
          <Route path="/admin/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/events" element={<EventsListAdmin />} />
            <Route path="/admin/events/new" element={<EventForm mode="create" />} />
            <Route path="/admin/events/:id/edit" element={<EventForm mode="edit" />} />
            <Route path="/admin/blog" element={<BlogListAdmin />} />
            <Route path="/admin/blog/new" element={<BlogForm mode="create" />} />
            <Route path="/admin/blog/:id/edit" element={<BlogForm mode="edit" />} />
            <Route path="/admin/gallery" element={<GalleryListAdmin />} />
            <Route path="/admin/gallery/new" element={<GalleryForm mode="create" />} />
            <Route path="/admin/gallery/:id/edit" element={<GalleryForm mode="edit" />} />
            <Route path="/admin/donations" element={<DonationsListAdmin />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  );
}
