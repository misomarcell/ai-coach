import { foodCategories, FoodCategory } from "@aicoach/shared";
import { isPlatformServer } from "@angular/common";
import { AfterViewInit, Component, ElementRef, inject, input, OnInit, output, PLATFORM_ID, signal, ViewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRippleModule } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, QueryParamsHandling, Router, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Observable, startWith, switchMap, tap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { FoodSearchResult, FoodSearchService, SearchFilters, SearchOptions, SearchResponse } from "../services/food-search.service";
import { FoodSearchResultComponent } from "./food-search-result/food-search-result.component";

@Component({
	selector: "app-food-search",
	standalone: true,
	imports: [
		FoodSearchResultComponent,
		RouterModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatExpansionModule,
		MatRippleModule,
		MatSelectModule,
		MatCardModule,
		MatIconModule,
		MatCheckboxModule,
		MatButtonModule,
		MatInputModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./food-search.component.html",
	styleUrl: "./food-search.component.scss"
})
export class FoodSearchComponent implements OnInit, AfterViewInit {
	foods = signal<FoodSearchResult[]>([]);
	isResultEmpty = signal<boolean>(true);
	isLoading = signal<boolean>(true);
	filterForm: FormGroup;
	foodCategories = foodCategories;

	private router = inject(Router);
	private formBuilder = inject(FormBuilder);
	private authService = inject(AuthService);
	private platformId = inject(PLATFORM_ID);
	private activatedRoute = inject(ActivatedRoute);
	private foodSearchService = inject(FoodSearchService);

	pageSize = input(10);
	adminSearch = input(false);
	foodSelected = output<FoodSearchResult>();

	currentPage = signal<number>(1);
	totalPages = signal<number>(0);
	totalHits = signal<number>(0);
	currentUid = toSignal(this.authService.uid);

	@ViewChild("search") searchInput: ElementRef<HTMLInputElement> | undefined;
	constructor() {
		this.filterForm = this.formBuilder.group({
			query: [""],
			sortBy: ["lastUpdatedAt"],
			sortDirection: ["desc"],
			category: [""],
			dietaryFlags: [[]]
		});
	}

	ngOnInit(): void {
		let page = this.activatedRoute.snapshot.queryParams["page"];
		let query = this.activatedRoute.snapshot.queryParams["query"];
		this.filterForm.get("query")?.setValue(query);

		this.filterForm.valueChanges
			.pipe(
				startWith({
					query
				}),
				debounceTime(300),
				distinctUntilChanged(),
				tap(() => this.isLoading.set(true)),
				tap(() => this.currentPage.set(page || 1)),
				switchMap((filters) => this.search(filters, page)),
				tap((result) => this.handleResults(result)),
				tap(() => (page = query = undefined))
			)
			.subscribe((result) => this.foods.set(result.hits));
	}

	ngAfterViewInit(): void {
		if (isPlatformServer(this.platformId)) {
			return;
		}

		const queryParams = this.activatedRoute.snapshot.queryParams;
		if (queryParams["focus"]) {
			setTimeout(() => this.searchInput?.nativeElement.click(), 300);
		}
	}

	resetFilters(): void {
		this.filterForm.patchValue({
			query: "",
			category: "",
			sortBy: "lastUpdatedAt",
			sortDirection: "desc",
			dietaryFlags: []
		});

		this.preserveSearchState(1);
	}

	clearSearch(): void {
		this.filterForm.get("query")?.setValue("");
		this.preserveSearchState(1, "replace");
	}

	updateDietaryFlags(flag: string, checked: boolean) {
		const currentFlags = this.filterForm.get("dietaryFlags")?.value || [];
		if (checked) {
			if (!currentFlags.includes(flag)) {
				this.filterForm.get("dietaryFlags")?.setValue([...currentFlags, flag]);
			}
		} else {
			this.filterForm.get("dietaryFlags")?.setValue(currentFlags.filter((f: string) => f !== flag));
		}
	}

	goToNextPage(): void {
		if (this.currentPage() < this.totalPages() - 1) {
			this.loadPage(this.currentPage() + 1);
		}
	}

	goToPreviousPage(): void {
		if (this.currentPage() > 1) {
			this.loadPage(this.currentPage() - 1);
		}
	}

	private search(filters: SearchFilters, page?: number): Observable<SearchResponse<FoodSearchResult>> {
		return this.foodSearchService.searchFoods(this.buildSearchOptions(filters, page));
	}

	private preserveSearchState(page?: number, handling?: QueryParamsHandling) {
		const rawValue = this.filterForm.getRawValue();
		const queryParams: Record<string, string | number> = Object.keys(rawValue)
			.filter((key) => rawValue[key] !== "" && rawValue[key] != null)
			.reduce(
				(acc, key) => {
					acc[key] = rawValue[key];
					return acc;
				},
				{} as Record<string, string>
			);

		queryParams["page"] = page || 1;

		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams,
			queryParamsHandling: handling || "merge"
		});
	}

	private loadPage(page: number): void {
		this.isLoading.set(true);
		this.currentPage.set(page);

		const searchOptions = this.buildSearchOptions(this.filterForm.value, page);

		this.foodSearchService
			.searchFoods(searchOptions)
			.pipe(tap((result) => this.handleResults(result)))
			.subscribe((result) => this.foods.set(result.hits));
	}

	private buildSearchOptions(filterValues: SearchFilters, page?: number): SearchOptions {
		const options: SearchOptions = {
			hitsPerPage: this.pageSize(),
			skipOwnerChecks: this.adminSearch(),
			ownerUid: this.currentUid() ?? "Unknown",
			filters: {
				page: page || 1,
				query: filterValues.query || "*",
				category: filterValues.category as FoodCategory,
				dietaryFlags: filterValues.dietaryFlags || []
			}
		};

		return options;
	}

	private handleResults(result: SearchResponse<FoodSearchResult>): void {
		this.isResultEmpty.set(result.hits.length === 0);
		this.preserveSearchState(result.page + 1);
		this.currentPage.set(result.page + 1);
		this.totalPages.set(result.nbPages);
		this.totalHits.set(result.totalHits);
		this.isLoading.set(false);
	}
}
