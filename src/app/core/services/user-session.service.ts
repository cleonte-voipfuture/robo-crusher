import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private data?: {
    username: string|undefined;
    authKey: string|undefined;
  };

  constructor() {
    this.loadFromLocalStorage();
  }

  set(username: string, authKey: string): void {
    this.clear();
    this.data = { username, authKey };
    localStorage.setItem('userSessionData', JSON.stringify(this.data));
  }

  clear(): void {
    this.data = undefined;
    localStorage.removeItem('userSessionData');
  }

  username(): string {
    if (!this.data?.username) {
      throw new Error('Missing session username.')
    }
    return this.data.username;
  }

  authKey(): string {
    if (!this.data?.authKey) {
      throw new Error('Missing session authKey.')
    }
    return this.data.authKey;
  }

  isAuthenticated(): boolean {
    return !!this.data;
  }

  private loadFromLocalStorage(): void {
    const storedSession = localStorage.getItem('userSessionData');
    if (storedSession) {
      const parsedData = JSON.parse(storedSession);
      if (parsedData.username && parsedData.authKey) {
        this.data = parsedData;
      }
    }
  }
}
