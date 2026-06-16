import { Navigate, Route, Routes } from "react-router-dom";
import { SkyStarfield } from "@/components/SkyStarfield";
import HomePage from "@/pages/HomePage";
import ListingPage from "@/pages/ListingPage";
import ShortsPage from "@/pages/ShortsPage";
import VideoDetailPage from "@/pages/VideoDetailPage";
import { AdminLayout } from "@/admin/AdminLayout";
import { LoginPage as AdminLoginPage } from "@/admin/LoginPage";
import { RequireAuth } from "@/admin/RequireAuth";
import { DrivesPage } from "@/admin/DrivesPage";
import { CrawlersPage } from "@/admin/CrawlersPage";
import { VideosPage } from "@/admin/VideosPage";
import { TagsPage } from "@/admin/TagsPage";
import { ThemePage } from "@/admin/ThemePage";
import { LoginPage as ViewerLoginPage } from "@/auth/LoginPage";
import { RegisterPage } from "@/auth/RegisterPage";
import { RequireUserAuth } from "@/auth/RequireUserAuth";

export default function App() {
  return (
    <>
      {/* 星空蓝主题的固定位置星星层，仅在 data-theme="sky" 下可见 */}
      <SkyStarfield />
      <Routes>
        <Route path="/login" element={<ViewerLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* 主站需要登录 */}
        <Route
          path="/"
          element={
            <RequireUserAuth>
              <HomePage />
            </RequireUserAuth>
          }
        />
        <Route
          path="/list"
          element={
            <RequireUserAuth>
              <ListingPage />
            </RequireUserAuth>
          }
        />
        <Route
          path="/shorts"
          element={
            <RequireUserAuth>
              <ShortsPage />
            </RequireUserAuth>
          }
        />
        <Route
          path="/video/:id"
          element={
            <RequireUserAuth>
              <VideoDetailPage />
            </RequireUserAuth>
          }
        />

        {/* 管理后台也需要登录 */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/drives" replace />} />
          <Route path="drives" element={<DrivesPage />} />
          <Route path="crawlers" element={<CrawlersPage />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="theme" element={<ThemePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
