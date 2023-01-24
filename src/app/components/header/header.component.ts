import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable, take, tap } from 'rxjs';
import { CategoryModel } from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  collapsed = true
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  private _collapsedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public collapsed$: Observable<boolean> = this._collapsedSubject.asObservable();

  constructor(private _categoriesService: CategoriesService) {
  }

  showMobileNavigation() {
    this.collapsed$.pipe(
      take(1),
      tap(() => this._collapsedSubject.next(true))
    ). subscribe()
  }
  hideMobileNavigation() {
    this.collapsed$.pipe(
      take(1),
      tap(() => this._collapsedSubject.next(false))
    ). subscribe()
  }
}
