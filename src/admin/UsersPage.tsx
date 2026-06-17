import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import * as api from "./api";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";
import { useToast } from "./ToastContext";

export function UsersPage() {
  const [users, setUsers] = useState<api.AdminFrontendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusTarget, setStatusTarget] = useState<api.AdminFrontendUser | null>(null);
  const [resetTarget, setResetTarget] = useState<api.AdminFrontendUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<api.AdminFrontendUser | null>(null);
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  async function refresh() {
    setLoading(true);
    setLoadError("");
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      const message = e instanceof Error ? e.message : "加载失败";
      setLoadError(message);
      show(message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function confirmStatusChange() {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === "active" ? "disabled" : "active";
    setSaving(true);
    try {
      await api.setUserStatus(statusTarget.id, nextStatus);
      show(nextStatus === "disabled" ? "已禁用用户并清除会话" : "已启用用户", "success");
      setStatusTarget(null);
      await refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "操作失败", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    if (!nextPassword.trim()) {
      show("请输入新密码", "error");
      return;
    }
    if (nextPassword.length < 6) {
      show("密码至少 6 位", "error");
      return;
    }
    if (nextPassword !== confirmPassword) {
      show("两次密码不一致", "error");
      return;
    }

    setSaving(true);
    try {
      await api.resetUserPassword(resetTarget.id, nextPassword);
      show("密码已重置，旧会话已失效", "success");
      setResetTarget(null);
      setNextPassword("");
      setConfirmPassword("");
      await refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "操作失败", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteUser(deleteTarget.id);
      show("用户已删除", "success");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "删除失败", "error");
    } finally {
      setSaving(false);
    }
  }

  function closeResetModal() {
    if (saving) return;
    setResetTarget(null);
    setNextPassword("");
    setConfirmPassword("");
  }

  return (
    <section>
      <header className="admin-page__header">
        <h1 className="admin-page__title">用户管理</h1>
      </header>

      <div className="admin-page__actions">
        <button type="button" className="admin-btn" onClick={refresh} disabled={loading}>
          <RefreshCw size={13} /> 刷新
        </button>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <RefreshCw size={20} className="admin-spin" />
          <span>加载中...</span>
        </div>
      ) : loadError ? (
        <div className="admin-error-state">
          <strong>加载失败</strong>
          <span>{loadError}</span>
          <button type="button" className="admin-btn" onClick={refresh}>
            <RefreshCw size={13} /> 重试
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state__text">还没有前台用户。</div>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th className="is-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <span className={`admin-status is-${user.status === "active" ? "ok" : "error"}`}>
                    {user.status}
                  </span>
                </td>
                <td>{formatDateTime(user.createdAt)}</td>
                <td>{formatDateTime(user.updatedAt)}</td>
                <td className="is-actions">
                  <button type="button" className="admin-btn" onClick={() => setStatusTarget(user)}>
                    {user.status === "active" ? "禁用" : "启用"}
                  </button>{" "}
                  <button type="button" className="admin-btn" onClick={() => setResetTarget(user)}>
                    重置密码
                  </button>{" "}
                  <button type="button" className="admin-btn is-danger" onClick={() => setDeleteTarget(user)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmModal
        open={statusTarget !== null}
        title={statusTarget?.status === "active" ? "禁用用户" : "启用用户"}
        message={
          statusTarget
            ? `${statusTarget.status === "active" ? "确定禁用" : "确定启用"}「${statusTarget.username}」吗？`
            : ""
        }
        confirmText={statusTarget?.status === "active" ? "禁用用户" : "启用用户"}
        danger={statusTarget?.status === "active"}
        loading={saving}
        onCancel={() => !saving && setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <Modal
        open={resetTarget !== null}
        title={resetTarget ? `重置密码 · ${resetTarget.username}` : "重置密码"}
        onClose={closeResetModal}
        footer={
          <>
            <button type="button" className="admin-btn" onClick={closeResetModal} disabled={saving}>
              取消
            </button>
            <button type="button" className="admin-btn is-primary" onClick={confirmResetPassword} disabled={saving}>
              {saving ? "处理中..." : "确认重置"}
            </button>
          </>
        }
      >
        <div className="admin-form">
          <div className="admin-form__row">
            <label htmlFor="user-reset-password">新密码</label>
            <input
              id="user-reset-password"
              type="password"
              value={nextPassword}
              onChange={(e) => setNextPassword(e.target.value)}
            />
          </div>
          <div className="admin-form__row">
            <label htmlFor="user-reset-password-confirm">确认密码</label>
            <input
              id="user-reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="删除用户"
        message={deleteTarget ? `确定删除「${deleteTarget.username}」吗？` : ""}
        confirmText="删除用户"
        danger
        loading={saving}
        onCancel={() => !saving && setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
      />
    </section>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
