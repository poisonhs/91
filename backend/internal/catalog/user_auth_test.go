package catalog

import (
	"context"
	"testing"
	"time"
)

func TestCreateUserRejectsDuplicateUsernameIgnoringCase(t *testing.T) {
	cat, err := Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	ctx := context.Background()
	if err := cat.CreateUser(ctx, "user-1", "Demo", "hash-1"); err != nil {
		t.Fatalf("seed first user: %v", err)
	}
	if err := cat.CreateUser(ctx, "user-2", "demo", "hash-2"); err == nil {
		t.Fatal("expected duplicate username error")
	}
}

func TestUserSessionLifecycleReturnsViewerRecord(t *testing.T) {
	cat, err := Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	ctx := context.Background()
	if err := cat.CreateUser(ctx, "user-1", "viewer", "hash-1"); err != nil {
		t.Fatalf("create user: %v", err)
	}
	if err := cat.CreateUserSession(ctx, "token-1", "user-1", 24*time.Hour); err != nil {
		t.Fatalf("create session: %v", err)
	}

	user, ok, err := cat.GetUserBySessionToken(ctx, "token-1")
	if err != nil {
		t.Fatalf("load session user: %v", err)
	}
	if !ok {
		t.Fatal("expected session to be valid")
	}
	if user.Username != "viewer" {
		t.Fatalf("username = %q, want viewer", user.Username)
	}

	if err := cat.DeleteUserSession(ctx, "token-1"); err != nil {
		t.Fatalf("delete session: %v", err)
	}
	_, ok, err = cat.GetUserBySessionToken(ctx, "token-1")
	if err != nil {
		t.Fatalf("reload deleted session: %v", err)
	}
	if ok {
		t.Fatal("expected deleted session to be invalid")
	}
}

func TestListFrontendUsersReturnsUsersInCreatedOrder(t *testing.T) {
	cat, err := Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	ctx := context.Background()
	if err := cat.CreateUser(ctx, "user-1", "alpha", "hash-1"); err != nil {
		t.Fatalf("create alpha: %v", err)
	}
	if err := cat.CreateUser(ctx, "user-2", "beta", "hash-2"); err != nil {
		t.Fatalf("create beta: %v", err)
	}

	users, err := cat.ListFrontendUsers(ctx)
	if err != nil {
		t.Fatalf("list users: %v", err)
	}
	if len(users) != 2 {
		t.Fatalf("len(users) = %d, want 2", len(users))
	}
	if users[0].Username != "alpha" || users[1].Username != "beta" {
		t.Fatalf("users = %#v, want alpha then beta", users)
	}
}

func TestDeleteFrontendUserSessionsRemovesAllTokensForUser(t *testing.T) {
	cat, err := Open(t.TempDir() + "/catalog.db")
	if err != nil {
		t.Fatalf("open catalog: %v", err)
	}
	t.Cleanup(func() { _ = cat.Close() })

	ctx := context.Background()
	if err := cat.CreateUser(ctx, "user-1", "viewer", "hash-1"); err != nil {
		t.Fatalf("create user: %v", err)
	}
	if err := cat.CreateUserSession(ctx, "token-1", "user-1", 24*time.Hour); err != nil {
		t.Fatalf("create session token-1: %v", err)
	}
	if err := cat.CreateUserSession(ctx, "token-2", "user-1", 24*time.Hour); err != nil {
		t.Fatalf("create session token-2: %v", err)
	}

	if err := cat.DeleteFrontendUserSessions(ctx, "user-1"); err != nil {
		t.Fatalf("delete sessions: %v", err)
	}

	for _, token := range []string{"token-1", "token-2"} {
		_, ok, err := cat.GetUserBySessionToken(ctx, token)
		if err != nil {
			t.Fatalf("reload %s: %v", token, err)
		}
		if ok {
			t.Fatalf("token %s still valid after delete", token)
		}
	}
}
