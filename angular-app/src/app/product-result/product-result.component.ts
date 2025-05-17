import { popInEffect } from "@aicoach/animations";
import { FoodProduct, FoodType, NUTRIENT_TAG_MAP, NutrientTag, NutrientTagLabel, Serving } from "@aicoach/shared";
import { isPlatformServer, NgStyle } from "@angular/common";
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { NutritionLabelComponent } from "../nutrition-label/nutrition-label.component";
import { ApiService } from "../services/api.service";
import { catchError, finalize, from, take, tap } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { PageTitleComponent } from "../page-title/page-title.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OverlayService } from "@aicoach/overlay";
import { EditServingFormComponent } from "../servings/edit-serving-form/edit-serving-form.component";
import { MatDividerModule } from "@angular/material/divider";
import { DietaryFlagsComponent } from "../dietary-flags/dietary-flags.component";

@Component({
	imports: [
		NgStyle,
		PageTitleComponent,
		DietaryFlagsComponent,
		NutritionLabelComponent,
		MatButtonModule,
		MatChipsModule,
		MatDividerModule,
		MatProgressSpinnerModule,
		MatIconModule
	],
	animations: [popInEffect],
	host: {
		"[@popInEffect]": ""
	},
	templateUrl: "./product-result.component.html",
	styleUrl: "./product-result.component.scss"
})
export class ProductResultComponent implements OnInit {
	private apiService = inject(ApiService);
	private router = inject(Router);
	private snackBar = inject(MatSnackBar);
	private overlayService = inject(OverlayService);
	private activatedRoute = inject(ActivatedRoute);
	private destroyRef = inject(DestroyRef);
	private platformId = inject(PLATFORM_ID);

	isLoading = signal(true);
	product = signal<FoodProduct | null>(null);
	nutrientTags = signal<NutrientTagLabel[]>([]);

	get nutriScore(): string {
		const product = this.product();
		if (!product || !product.nutriScoreGrade) {
			return "unknown";
		}

		return ["a", "b", "c", "d", "e"].includes(product.nutriScoreGrade) ? product.nutriScoreGrade : "unknown";
	}

	ngOnInit(): void {
		const barcode = this.activatedRoute.snapshot.paramMap.get("barcode");
		if (!barcode || isPlatformServer(this.platformId)) {
			return;
		}

		this.fetchProduct(barcode);
	}

	onAddClick(): void {
		this.overlayService.open(EditServingFormComponent, {
			data: {
				serving: this.getAsServing()
			}
		});
	}

	private getAsServing(): Partial<Serving> {
		const product = this.product();
		if (!product) {
			throw new Error("Product is not defined");
		}

		return {
			food: {
				name: product.name,
				images: product.images,
				nutrientTags: product.nutrientTags,
				brand: product.brand,
				barcode: product.barcode,
				type: FoodType.Product,
				nutritions: product.nutritions,
				dietaryFlags: product.dietaryFlags,
				servingSizes: product.servingSizes,
				category: "Other",
				isApproved: true
			}
		};
	}

	private fetchProduct(barcode: string): void {
		this.apiService
			.get<FoodProduct>(`p/${barcode}`)
			.pipe(
				take(1),
				takeUntilDestroyed(this.destroyRef),
				tap((product) => {
					this.product.set({ ...product });
					this.nutrientTags.set(
						(product.nutrientTags ?? [])
							.map((tag) => this.getNutrientTagLabel(tag))
							.filter((tag) => !!tag)
							.sort((a, b) => {
								const order = { positive: 0, neutral: 1, negative: 2 };
								return order[a.effect] - order[b.effect];
							})
					);
				}),
				catchError((error) => {
					if (error.status === 404) {
						this.snackBar.open("No information available of this product.", "Close");

						return from(this.router.navigate(["/foods/add"]));
					} else {
						this.snackBar.open("Error fetching product data. Please try again.", "Close", {
							panelClass: "error-snackbar"
						});

						return from(this.router.navigate(["/scan"]));
					}
				}),
				finalize(() => this.isLoading.set(false))
			)
			.subscribe();
	}

	private getNutrientTagLabel(tag?: NutrientTag): NutrientTagLabel | undefined {
		return NUTRIENT_TAG_MAP.find((item) => item.name === tag);
	}
}
