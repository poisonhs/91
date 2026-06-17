import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useViewerAuth } from "./AuthContext";

export function RegisterPage() {
  const { status, register } = useViewerAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (passwordMismatch) {
      setErr("两次输入的密码不一致");
      return;
    }
    if (!inviteCode.trim()) {
      setErr("邀请码不能为空");
      return;
    }
    setLoading(true);
    try {
      await register(username, password, inviteCode);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">用户注册</h1>
        <div className="admin-form">
          <div className="admin-form__row">
            <label htmlFor="viewer-register-invite">邀请码</label>
            <input
              id="viewer-register-invite"
              autoComplete="off"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="viewer-register-username">用户名</label>
            <input
              id="viewer-register-username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="viewer-register-password">密码</label>
            <input
              id="viewer-register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="viewer-register-password-confirm">确认密码</label>
            <input
              id="viewer-register-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={passwordMismatch ? "is-invalid" : undefined}
              aria-invalid={passwordMismatch ? "true" : undefined}
            />
          </div>
          <button
            className="admin-btn is-primary"
            type="submit"
            disabled={
              loading ||
              !inviteCode.trim() ||
              !username ||
              !password ||
              !confirmPassword ||
              passwordMismatch
            }
          >
            {loading ? "注册中..." : "注册"}
          </button>
          <button
            className="admin-btn"
            type="button"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            去登录
          </button>
          {err && <div className="admin-login__error">{err}</div>}
        </div>
      </form>
    </div>
  );
}
