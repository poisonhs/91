package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/video-site/backend/internal/catalog"
)

const (
	userSessionCookie = "vs_user"
	userSessionTTL    = 24 * time.Hour
)

type viewerContextKey struct{}

type Viewer struct {
	ID       string
	Username string
}

type UserAuthenticator struct {
	Catalog *catalog.Catalog
	Now     func() time.Time
}

func (a *UserAuthenticator) Register(w http.ResponseWriter, r *http.Request, username, password string) (*Viewer, error) {
	username = strings.TrimSpace(username)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	userID, err := randomToken()
	if err != nil {
		return nil, err
	}
	if err := a.Catalog.CreateUser(r.Context(), userID, username, string(hash)); err != nil {
		return nil, err
	}
	if err := a.issueSession(w, r.Context(), userID); err != nil {
		return nil, err
	}
	return &Viewer{ID: userID, Username: username}, nil
}

func (a *UserAuthenticator) Login(w http.ResponseWriter, r *http.Request, username, password string) (bool, error) {
	user, err := a.Catalog.GetUserByUsername(r.Context(), strings.TrimSpace(username))
	if err != nil {
		return false, err
	}
	if user == nil {
		return false, nil
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return false, nil
		}
		return false, err
	}
	if err := a.issueSession(w, r.Context(), user.ID); err != nil {
		return false, err
	}
	return true, nil
}

func (a *UserAuthenticator) CurrentUser(r *http.Request) (*Viewer, bool, error) {
	cookie, err := r.Cookie(userSessionCookie)
	if err != nil {
		return nil, false, nil
	}
	user, ok, err := a.Catalog.GetUserBySessionToken(r.Context(), cookie.Value)
	if err != nil || !ok {
		return nil, ok, err
	}
	return &Viewer{ID: user.ID, Username: user.Username}, true, nil
}

func (a *UserAuthenticator) Logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(userSessionCookie); err == nil {
		_ = a.Catalog.DeleteUserSession(r.Context(), c.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     userSessionCookie,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (a *UserAuthenticator) Required(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok, err := a.CurrentUser(r)
		if err != nil || !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), viewerContextKey{}, *user)))
	})
}

func (a *UserAuthenticator) issueSession(w http.ResponseWriter, ctx context.Context, userID string) error {
	token, err := randomToken()
	if err != nil {
		return err
	}
	if err := a.Catalog.CreateUserSession(ctx, token, userID, userSessionTTL); err != nil {
		return err
	}
	now := a.now()
	http.SetCookie(w, &http.Cookie{
		Name:     userSessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  now.Add(userSessionTTL),
	})
	return nil
}

func (a *UserAuthenticator) now() time.Time {
	if a != nil && a.Now != nil {
		return a.Now()
	}
	return time.Now()
}
