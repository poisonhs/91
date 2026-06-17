import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import * as api from "./api";
import { useToast } from "./ToastContext";

export function InvitesPage() {
  const [invites, setInvites] = useState<api.AdminInviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { show } = useToast();

  async function refresh() {
    setLoading(true);
    setLoadError("");
    try {
      setInvites(await api.listInviteCodes());
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

  async function handleCreateInvite() {
    setSaving(true);
    try {
      const invite = await api.createInviteCode();
      show(`已生成邀请码：${invite.code}`, "success");
      await refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "生成失败", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <header className="admin-page__header">
        <h1 className="admin-page__title">邀请码</h1>
      </header>

      <div className="admin-page__actions">
        <button type="button" className="admin-btn is-primary" onClick={handleCreateInvite} disabled={saving}>
          {saving ? "生成中..." : "生成邀请码"}
        </button>
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
        </div>
      ) : invites.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state__text">还没有邀请码。</div>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>邀请码</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>使用时间</th>
              <th>使用人</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.code}</td>
                <td>
                  <span className={`admin-status is-${invite.status === "used" ? "error" : "ok"}`}>
                    {invite.status === "used" ? "已使用" : "未使用"}
                  </span>
                </td>
                <td>{formatDateTime(invite.createdAt)}</td>
                <td>{invite.usedAt ? formatDateTime(invite.usedAt) : "-"}</td>
                <td>{invite.usedByUsername || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
