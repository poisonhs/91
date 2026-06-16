import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useViewerAuth } from "./AuthContext";

export function LoginPage() {
  const { status, login } = useViewerAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (status === "loading") {
    return <div className="admin-loading-screen">检查登录状态...</div>;
  }

  if (status === "authed") {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(username, password);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">用户登录</h1>
        <div className="admin-form">
          <div className="admin-form__row">
            <label htmlFor="viewer-login-username">用户名</label>
            <input
              id="viewer-login-username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="viewer-login-password">密码</label>
            <input
              id="viewer-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="admin-btn is-primary"
            type="submit"
            disabled={loading || !username || !password}
          >
            {loading ? "登录中..." : "登录"}
          </button>
          <button
            className="admin-btn"
            type="button"
            onClick={() => navigate("/register")}
            disabled={loading}
          >
            去注册
          </button>
          {err && <div className="admin-login__error">{err}</div>}
        </div>
      </form>
    </div>
  );
}
