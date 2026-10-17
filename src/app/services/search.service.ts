import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$: Observable<string> = this.searchQuerySubject.asObservable();

  setQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  getQuery(): string {
    return this.searchQuerySubject.getValue();
  }

  clearQuery(): void {
    this.searchQuerySubject.next('');
  }
}
