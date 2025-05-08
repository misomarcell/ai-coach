import { isPlatformBrowser } from "@angular/common";
import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";

interface FoodItem {
	id: number;
	name: string;
	calories: number;
	top: number;
}

@Component({
	selector: "app-servings-demo",
	imports: [MatCardModule],
	templateUrl: "./servings-demo.component.html",
	styleUrl: "./servings-demo.component.scss"
})
export class ServingsDemoComponent implements OnInit, OnDestroy {
	foodItems = [
		{ id: 1, name: "Grilled Chicken Breast", calories: 165 },
		{ id: 2, name: "Avocado Toast", calories: 240 },
		{ id: 3, name: "Greek Yogurt", calories: 100 },
		{ id: 4, name: "Salmon Fillet", calories: 206 },
		{ id: 5, name: "Quinoa Bowl", calories: 222 },
		{ id: 6, name: "Protein Smoothie", calories: 180 },
		{ id: 7, name: "Egg White Omelette", calories: 124 },
		{ id: 8, name: "Sweet Potato", calories: 112 },
		{ id: 9, name: "Tuna Salad", calories: 140 },
		{ id: 10, name: "Oatmeal with Berries", calories: 215 },
		{ id: 11, name: "Hummus & Veggies", calories: 166 },
		{ id: 12, name: "Turkey Sandwich", calories: 320 },
		{ id: 13, name: "Protein Pasta", calories: 270 },
		{ id: 14, name: "Almond Butter Toast", calories: 190 },
		{ id: 15, name: "Lentil Soup", calories: 230 }
	];

	private paltformId = inject(PLATFORM_ID);
	visibleItems = signal<FoodItem[]>([]);
	animationInterval: any;
	itemHeight = 58;
	containerHeight = 230;
	currentIndex = 0;
	currentTop = 0;
	scrollSpeed = 0.25;

	ngOnInit(): void {
		if (isPlatformBrowser(this.paltformId)) {
			this.initializeItems();
			this.startScrollAnimation();
		}
	}

	ngOnDestroy(): void {
		if (this.animationInterval) {
			cancelAnimationFrame(this.animationInterval);
		}
	}

	initializeItems(): void {
		const items: FoodItem[] = [];
		for (let i = 0; i < 5; i++) {
			const foodIndex = i % this.foodItems.length;
			items.push({
				...this.foodItems[foodIndex],
				id: Date.now() + i,
				top: i * this.itemHeight
			});
		}
		this.visibleItems.set(items);
	}

	startScrollAnimation(): void {
		const animate = () => {
			this.updateItemPositions();
			this.animationInterval = requestAnimationFrame(animate);
		};

		this.animationInterval = requestAnimationFrame(animate);
	}

	updateItemPositions(): void {
		this.currentTop -= this.scrollSpeed;

		this.visibleItems.update((items) => {
			const updatedItems = items.map((item) => ({
				...item,
				top: item.top + this.currentTop
			}));

			this.currentTop = 0;

			const result = [...updatedItems];
			if (result.length > 0 && result[0].top < -this.itemHeight) {
				result.shift();

				this.currentIndex = (this.currentIndex + 1) % this.foodItems.length;
				const lastItem = result[result.length - 1];
				result.push({
					...this.foodItems[this.currentIndex],
					id: Date.now(),
					top: lastItem.top + this.itemHeight
				});
			}

			return result;
		});
	}
}
