import { foodCategories, FoodCategory } from "@aicoach/shared";
import { isPlatformServer } from "@angular/common";
import { AfterViewInit, Component, ElementRef, inject, input, OnInit, output, PLATFORM_ID, signal, ViewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRippleModule } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { combineLatest, debounceTime, distinctUntilChanged, map, Observable, startWith, switchMap, tap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { FoodSearchResult, FoodSearchService, SearchOptions, SearchResponse } from "../services/food-search.service";
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
		MatFormFieldModule,
		MatProgressSpinnerModule,
		MatPaginatorModule
	],
	templateUrl: "./food-search.component.html",
	styleUrl: "./food-search.component.scss"
})
export class FoodSearchComponent implements OnInit, AfterViewInit {
	foods = signal<FoodSearchResult[]>([]);
	isResultEmpty = signal<boolean>(true);
	isLoading = signal<boolean>(true);
	filterForm: FormGroup;
	searchControl = new FormControl<string>("");
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
			sortBy: ["lastUpdatedAt"],
			sortDirection: ["desc"],
			category: [""],
			dietaryFlags: [[]]
		});
	}

	ngOnInit(): void {
		let page = this.activatedRoute.snapshot.queryParams["page"];
		let query = this.activatedRoute.snapshot.queryParams["q"];
		this.searchControl.setValue(query);

		combineLatest([
			this.searchControl.valueChanges.pipe(startWith(query || "*"), debounceTime(300), distinctUntilChanged()),
			this.filterForm.valueChanges.pipe(startWith(this.filterForm.value))
		])
			.pipe(
				tap(() => this.isLoading.set(true)),
				tap(([searchQuery]) => this.currentPage.set(searchQuery === query ? page || 1 : 1)),
				map(([searchQuery, filterValues]) => [searchQuery || "*", filterValues]),
				switchMap(([searchQuery, filterValues]) => this.search(searchQuery, filterValues)),
				tap((result) => this.handleResults(result)),
				tap(() => (query = page = undefined))
			)
			.subscribe((result) => this.foods.set(result.hits));
	}

	ngAfterViewInit(): void {
		if (isPlatformServer(this.platformId)) {
			return;
		}

		this.activatedRoute.queryParams.subscribe((params) => {
			if (params["focus"]) {
				setTimeout(() => this.searchInput?.nativeElement.click(), 300);
			}
		});
	}

	resetFilters(): void {
		this.filterForm.patchValue({
			sortBy: "lastUpdatedAt",
			sortDirection: "desc",
			category: "",
			dietaryFlags: []
		});
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

	clearSearch(): void {
		this.searchControl.setValue("");
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

	private search(searchQuery: string, options: SearchOptions): Observable<SearchResponse<FoodSearchResult>> {
		return this.foodSearchService.searchFoods(searchQuery, this.buildSearchOptions(options));
	}

	private preserveSearchState(searchQuery: string, page: number) {
		const queryParams: { q: string; page: number } = {
			q: searchQuery === "*" ? "" : searchQuery,
			page
		};

		this.router.navigate([], {
			relativeTo: this.activatedRoute,
			queryParams,
			queryParamsHandling: "merge"
		});
	}

	private loadPage(page: number, query?: string): void {
		this.isLoading.set(true);
		this.currentPage.set(page);

		const searchOptions = this.buildSearchOptions(this.filterForm.value);
		searchOptions.page = page;

		this.foodSearchService
			.searchFoods(query || this.searchControl.value || "*", searchOptions)
			.pipe(tap((result) => this.handleResults(result, page)))
			.subscribe((result) => this.foods.set(result.hits));
	}

	private buildSearchOptions(filterValues: any): SearchOptions {
		const options: SearchOptions = {
			page: this.currentPage(),
			hitsPerPage: this.pageSize(),
			skipOwnerChecks: this.adminSearch(),
			filters: {
				ownerUid: this.currentUid() ?? "Unknown",
				category: filterValues.category as FoodCategory,
				dietaryFlags: filterValues.dietaryFlags || []
			}
		};

		return options;
	}

	private handleResults(result: SearchResponse<FoodSearchResult>, page?: number): void {
		this.preserveSearchState(result.query, page ?? result.page + 1);
		this.isResultEmpty.set(result.hits.length === 0);
		this.currentPage.set(page ?? result.page + 1);
		this.totalPages.set(result.nbPages);
		this.totalHits.set(result.totalHits);
		this.isLoading.set(false);
	}
}
