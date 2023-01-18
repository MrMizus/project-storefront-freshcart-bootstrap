import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { StoreQueryModel } from '../../query-models/store.query-model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { TagsService } from '../../services/tags.service';
import { StoreModel } from '../../models/store.model';
import { TagModel } from '../../models/tag.model';

@Component({
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly stores$: Observable<StoreQueryModel[]> = combineLatest([
    this._storesService.getAllStores(),
    this._tagsService.getAllTags()
  ]).pipe(map(([stores, tags]) => this._mapToStoreQueryModel(stores, tags)))

  constructor(private _categoriesService: CategoriesService, private _storesService: StoresService, private _tagsService: TagsService) {
  }

  private _mapToStoreQueryModel(
    stores: StoreModel[],
    tags: TagModel[]
  ): StoreQueryModel[] {
    const tagMap = tags.reduce((a, c) => ({ ...a, [c.id]: c }), {}) as Record<string, TagModel>

    return stores.map((store) => ({
      name: store.name,
      logoUrl: store.logoUrl,
      distanceInMeters: store.distanceInMeters,
      tags: (store.tagIds ?? []).map((id) => tagMap[id]?.name),
      id: store.id
    }))
  }
}
