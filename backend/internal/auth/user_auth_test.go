package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/video-site/backend/internal/catalog"
)

func TestUserAuthenticatorRegisterHashesPasswordAndSetsVsUserCookie(t *testing.T) {
	cat, err := catalog.Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	authr := &UserAuthenticator{Catalog: cat}
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(`{}`))

	user, err := authr.Register(rr, req, "viewer", "secret123")
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if user.Username != "viewer" {
		t.Fatalf("username = %q, want viewer", user.Username)
	}
	if user.ID == "" {
		t.Fatal("expected generated user id")
	}
	if cookies := rr.Result().Cookies(); len(cookies) == 0 || cookies[0].Name != userSessionCookie {
		t.Fatal("expected vs_user cookie")
	}

	stored, err := cat.GetUserByUsername(req.Context(), "viewer")
	if err != nil {
		t.Fatalf("load stored user: %v", err)
	}
	if stored == nil {
		t.Fatal("expected stored user")
	}
	if stored.PasswordHash == "secret123" {
		t.Fatal("password should be stored as a hash")
	}
}

func TestUserAuthenticatorLoginRejectsWrongPassword(t *testing.T) {
	cat, err := catalog.Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	authr := &UserAuthenticator{Catalog: cat}
	if _, err := authr.Register(
		httptest.NewRecorder(),
		httptest.NewRequest(http.MethodPost, "/api/auth/register", nil),
		"viewer",
		"secret123",
	); err != nil {
		t.Fatalf("register seed user: %v", err)
	}

	ok, err := authr.Login(
		httptest.NewRecorder(),
		httptest.NewRequest(http.MethodPost, "/api/auth/login", nil),
		"viewer",
		"wrongpass",
	)
	if err != nil {
		t.Fatalf("login error: %v", err)
	}
	if ok {
		t.Fatal("expected wrong password login to fail")
	}
}

func TestAdminAuthenticatorIgnoresVsUserCookie(t *testing.T) {
	cat, err := catalog.Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	adminAuth := &Authenticator{Username: "admin", Password: "secret", Catalog: cat}
	req := httptest.NewRequest(http.MethodGet, "/admin/api/me", nil)
	req.AddCookie(&http.Cookie{Name: userSessionCookie, Value: "token-1"})
	rr := httptest.NewRecorder()

	adminAuth.Required(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("admin middleware should not accept vs_user cookie")
	})).ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusUnauthorized)
	}
}
