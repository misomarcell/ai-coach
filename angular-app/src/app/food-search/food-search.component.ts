import { OverlayService } from "@aicoach/overlay";
import { foodCategories, FoodCategory } from "@aicoach/shared";
import { isPlatformServer } from "@angular/common";
import { AfterViewInit, Component, ElementRef, inject, OnInit, output, PLATFORM_ID, signal, ViewChild } from "@angular/core";
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
import { ActivatedRoute, RouterModule } from "@angular/router";
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { FoodSearchResult, FoodSearchService, SearchOptions, SearchResponse } from "../services/food-search.service";
import { FoodSearchResultComponent } from "./food-search-result/food-search-result.component";

@Component({
	selector: "app-search-search",
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

	private pageSize = 10;
	private formBuilder = inject(FormBuilder);
	private authService = inject(AuthService);
	private platformId = inject(PLATFORM_ID);
	private activatedRoute = inject(ActivatedRoute);
	private foodSearchService = inject(FoodSearchService);
	private overlayService = inject(OverlayService);

	currentPage = signal<number>(0);
	totalPages = signal<number>(0);
	totalHits = signal<number>(0);
	currentUid = toSignal(this.authService.uid);
	foodSelected = output<FoodSearchResult>();

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
		combineLatest([
			this.searchControl.valueChanges.pipe(startWith("*"), debounceTime(300), distinctUntilChanged()),
			this.filterForm.valueChanges.pipe(startWith(this.filterForm.value))
		])
			.pipe(
				tap(() => {
					this.isLoading.set(true);
					this.currentPage.set(0);
				}),
				map(([searchQuery, filterValues]) => [searchQuery || "*", filterValues]),
				switchMap(([searchQuery, filterValues]) =>
					this.foodSearchService.searchFoods(searchQuery, this.buildSearchOptions(filterValues))
				),
				tap((result) => this.handleResults(result))
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

	buildSearchOptions(filterValues: any): SearchOptions {
		const options: SearchOptions = {
			page: this.currentPage(),
			hitsPerPage: this.pageSize,
			filters: {
				ownerUid: this.currentUid() ?? "Unknown",
				category: filterValues.category as FoodCategory,
				dietaryFlags: filterValues.dietaryFlags || []
			}
		};

		return options;
	}

	goToNextPage(): void {
		if (this.currentPage() < this.totalPages() - 1) {
			this.loadPage(this.currentPage() + 1);
		}
	}

	goToPreviousPage(): void {
		if (this.currentPage() > 0) {
			this.loadPage(this.currentPage() - 1);
		}
	}

	private loadPage(page: number): void {
		this.isLoading.set(true);
		this.currentPage.set(page);

		const searchOptions = this.buildSearchOptions(this.filterForm.value);
		searchOptions.page = page;

		this.foodSearchService
			.searchFoods(this.searchControl.value || "*", searchOptions)
			.pipe(tap((result) => this.handleResults(result, page)))
			.subscribe((result) => this.foods.set(result.hits));
	}

	private handleResults(result: SearchResponse<FoodSearchResult>, page?: number): void {
		this.isResultEmpty.set(result.hits.length === 0);
		this.currentPage.set(page ?? result.page);
		this.totalPages.set(result.nbPages);
		this.totalHits.set(result.totalHits);
		this.isLoading.set(false);
	}
}
