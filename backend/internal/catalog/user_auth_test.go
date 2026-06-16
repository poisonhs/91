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
