import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private auth = inject(AuthService);

  readonly sidebarOpen = signal(false);

  readonly sidebarCollapsed = signal(readSidebarCollapsedPref());

  readonly userEmail = toSignal(this.auth.state$.pipe(map((s) => s.email)), {
    initialValue: this.auth.email,
  });

  readonly userSub = toSignal(this.auth.state$.pipe(map((s) => s.sub)), {
    initialValue: this.auth.sub,
  });

  readonly userRole = toSignal(this.auth.state$.pipe(map((s) => s.role)), {
    initialValue: this.auth.role,
  });

  readonly userDisplayLine = computed(() => {
    const email = this.userEmail()?.trim();
    if (email) return email;
    const sub = this.userSub()?.trim();
    if (sub?.includes('@')) return sub;
    if (sub && isLikelyUuid(sub)) return 'Sessão sem email visível';
    if (sub) return sub;
    return 'Convidado';
  });

  readonly userInitials = computed(() => {
    const line = this.userDisplayLine();
    if (line === 'Sessão sem email visível') return '?';
    return initialsForDisplay(line);
  });

  readonly roleLabel = computed(() => roleLabelPt(this.userRole()));

  readonly onAuthRoute = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.pathStartsWithAuth(this.router.url)),
      startWith(this.pathStartsWithAuth(this.router.url)),
    ),
    { initialValue: this.pathStartsWithAuth(this.router.url) },
  );

  readonly isAuthenticated = toSignal(this.auth.state$.pipe(map((s) => !!s.token)), {
    initialValue: this.auth.isAuthenticated(),
  });

  readonly isAdmin = toSignal(this.auth.state$.pipe(map((s) => s.role === 'ADMIN')), {
    initialValue: this.auth.role === 'ADMIN',
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.sidebarOpen.set(false));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebarCollapsed(): void {
    this.sidebarCollapsed.update((v) => {
      const next = !v;
      try {
        localStorage.setItem('finops.sidebar.collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }

  private pathStartsWithAuth(url: string): boolean {
    const path = url.split('?')[0] ?? '';
    return path === '/auth' || path.startsWith('/auth/');
  }
}

function isLikelyUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function readSidebarCollapsedPref(): boolean {
  try {
    return localStorage.getItem('finops.sidebar.collapsed') === '1';
  } catch {
    return false;
  }
}

function initialsForDisplay(line: string): string {
  if (line === 'Convidado') return '—';
  if (line.includes('@')) return initialsFromSub(line);
  const alnum = line.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  return line.slice(0, 2).toUpperCase() || '—';
}

function initialsFromSub(sub: string | null): string {
  if (!sub?.trim()) return '—';
  const base = sub.includes('@') ? sub.split('@')[0]! : sub;
  const parts = base.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  const clean = base.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  if (clean.length === 1) return (clean + clean).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function roleLabelPt(role: 'ADMIN' | 'FINANCE' | null): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'FINANCE') return 'Finanças';
  return 'Convidado';
}
