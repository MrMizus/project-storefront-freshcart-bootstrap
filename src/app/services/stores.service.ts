import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { StoreModel } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoresService {
  constructor(private _httpClient: HttpClient) {
  }

  getAllStores(): Observable<StoreModel[]> {
    return this._httpClient.get<StoreModel[]>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-stores');
  }

  getOneStore(storeId: string): Observable<StoreModel> {
    return this._httpClient.get<StoreModel>(`https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-stores/${storeId}`).pipe(
      map((store) => {return {
        name: store.name,
        logoUrl: store.logoUrl,
        distanceInMeters: Math.round(store.distanceInMeters * .01) / 10,
        tagIds: store.tagIds,
        id: store.id,
      }})
    );
  }
}
