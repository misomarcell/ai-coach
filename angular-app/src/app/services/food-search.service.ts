import { DietaryFlag, Food, FoodCategory } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import { liteClient } from "algoliasearch/lite";
import { Observable, from } from "rxjs";
import { environment } from "../../environments/environment";

export type FoodSearchResult = Pick<
	Food,
	| "id"
	| "name"
	| "brand"
	| "category"
	| "barcode"
	| "nutritions"
	| "status"
	| "isApproved"
	| "isPublic"
	| "source"
	| "variation"
	| "dietaryFlags"
	| "tags"
>;

export interface SearchFilters {
	ownerUid: string;
	category?: FoodCategory;
	dietaryFlags?: DietaryFlag[];
}

export interface SearchOptions {
	filters?: SearchFilters;
	page?: number;
	hitsPerPage?: number;
	skipOwnerChecks?: boolean;
}

export interface SearchResponse<T> {
	hits: T[];
	page: number;
	nbPages: number;
	totalHits: number;
}

@Injectable({
	providedIn: "root"
})
export class FoodSearchService {
	private client = liteClient(environment.algolia.appId, environment.algolia.apiKey);
	private readonly INDEX_NAME = "foods";
	private readonly DEFAULT_HITS_PER_PAGE = 10;

	searchFoods(query: string, options?: SearchOptions): Observable<SearchResponse<FoodSearchResult>> {
		if (!query || query.trim() === "") {
			return from(Promise.resolve({ hits: [], page: 0, nbPages: 0, totalHits: 0 }));
		}

		const searchParams: any = {
			indexName: this.INDEX_NAME,
			query,
			page: options?.page || 0,
			hitsPerPage: options?.hitsPerPage || this.DEFAULT_HITS_PER_PAGE
		};

		const filterStrings: string[] = [];
		if (!options?.skipOwnerChecks) {
			filterStrings.push(
				options?.filters?.ownerUid ? `(isPublic:true OR ownerUid:"${options.filters.ownerUid}")` : "(isPublic:true)"
			);
		}

		if (options?.filters?.category) {
			filterStrings.push(`category:"${options.filters.category}"`);
		}

		if (options?.filters?.dietaryFlags?.length) {
			const dietaryFlags = options.filters.dietaryFlags.map((flag) => `dietaryFlags:"${flag}"`);
			filterStrings.push(`(${dietaryFlags.join(" OR ")})`);
		}

		searchParams.filters = filterStrings.length > 1 ? filterStrings.join(" AND ") : filterStrings[0];

		return from(
			this.client
				.searchForHits<Food>({ requests: [searchParams] })
				.then((response) => {
					const result = response.results[0];
					return {
						hits: result.hits.map(this.mapHit),
						page: result.page || 0,
						nbPages: result.nbPages || 0,
						totalHits: result.nbHits || 0
					};
				})
				.catch((error) => {
					console.error("Error searching foods with Algolia:", error);
					return { hits: [], page: 0, nbPages: 0, totalHits: 0 };
				})
		);
	}

	private mapHit(hit: any): FoodSearchResult {
		const foodName = hit._highlightResult.name?.value || hit.name;
		const foodCategory = hit._highlightResult.category?.value || hit.category;
		const foodBrand = hit._highlightResult.brand?.value || hit.brand;

		return {
			id: hit.id,
			name: foodName,
			brand: foodBrand,
			category: foodCategory,
			barcode: hit.barcode,
			nutritions: hit.nutritions || [],
			status: hit.status,
			isApproved: hit.isApproved,
			isPublic: hit.isPublic,
			source: hit.source,
			variation: hit.variation,
			dietaryFlags: hit.dietaryFlags || [],
			tags: hit.tags || []
		};
	}
}
