import { Component, OnInit, OnDestroy, signal, inject, PLATFORM_ID } from "@angular/core";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { MatCardModule } from "@angular/material/card";
import { isPlatformBrowser } from "@angular/common";

enum FoodPosition {
	Entering = "entering",
	Left = "left",
	Center = "center",
	Right = "right",
	Exiting = "exiting"
}

interface FoodEmoji {
	id: number;
	emoji: string;
	name: string;
	position?: FoodPosition;
}

@Component({
	selector: "app-vision-demo",
	imports: [MatCardModule],
	templateUrl: "./vision-demo.component.html",
	styleUrl: "./vision-demo.component.scss",
	animations: [
		trigger("emojiState", [
			state(
				FoodPosition.Entering,
				style({
					transform: "translateX(-200%) scale(0.5)",
					opacity: 0
				})
			),
			state(
				FoodPosition.Left,
				style({
					transform: "translateX(-150%) scale(0.5)",
					opacity: 0.7
				})
			),
			state(
				FoodPosition.Center,
				style({
					transform: "translateX(0) scale(1)",
					opacity: 1
				})
			),
			state(
				FoodPosition.Right,
				style({
					transform: "translateX(150%) scale(0.5)",
					opacity: 0.7
				})
			),
			state(
				FoodPosition.Exiting,
				style({
					transform: "translateX(200%) scale(0.5)",
					opacity: 0
				})
			),
			transition("void => *", [
				style({
					transform: "translateX(-250%) scale(0.3)",
					opacity: 0
				}),
				animate("0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")
			]),
			transition("* => void", [
				animate(
					"0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
					style({
						transform: "translateX(250%) scale(0.3)",
						opacity: 0
					})
				)
			]),
			transition("entering => left", [animate("1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")]),
			transition("left => center", [animate("1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")]),
			transition("center => right", [animate("1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")]),
			transition("right => exiting", [animate("1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")]),
			transition("* => *", [animate("1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)")])
		])
	]
})
export class VisionDemoComponent implements OnInit, OnDestroy {
	foodEmojis: FoodEmoji[] = [
		{ id: 1, emoji: "🍣", name: "Salmon Nigiri Sushi, 214 kcal" },
		{ id: 2, emoji: "🌮", name: "Beef Taco, cheese, 251 kcal" },
		{ id: 3, emoji: "🍝", name: "Spaghetti, meatballs, 623 kcal" },
		{ id: 4, emoji: "🍕", name: "Pepperoni Pizza, 285 kcal" },
		{ id: 5, emoji: "🍔", name: "Beef Burger, cheese, 357 kcal" },
		{ id: 6, emoji: "🥗", name: "Mixed Green Salad, 152 kcal" },
		{ id: 7, emoji: "🍜", name: "Shoyu Ramen, pork, 510 kcal" },
		{ id: 8, emoji: "🥞", name: "Pancakes, syrup, 352 kcal" },
		{ id: 9, emoji: "🌯", name: "Beef Burrito, rice, 723 kcal" }
	];

	private platformId = inject(PLATFORM_ID);
	visibleFoods = signal<FoodEmoji[]>([]);
	currentIndex = signal<number>(3);
	textContent = signal("");
	animationInterval: any;
	isTyping = false;
	isAnimating = false;

	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.setupInitialState();
			this.startAnimationCycle();
		}
	}

	ngOnDestroy(): void {
		if (this.animationInterval) {
			clearInterval(this.animationInterval);
		}
	}

	setupInitialState(): void {
		const initialFoods = [
			{ ...this.foodEmojis[0], position: FoodPosition.Left, id: 100 },
			{ ...this.foodEmojis[1], position: FoodPosition.Center, id: 101 },
			{ ...this.foodEmojis[2], position: FoodPosition.Right, id: 102 }
		];

		this.visibleFoods.set(initialFoods);
		this.textContent.set(this.foodEmojis[1].name);
	}

	startAnimationCycle(): void {
		this.animationInterval = setInterval(() => {
			if (!this.isAnimating) {
				this.isAnimating = true;
				this.runAnimationSequence().then(() => {
					this.isAnimating = false;
				});
			}
		}, 3000);
	}

	async runAnimationSequence(): Promise<void> {
		await this.deleteTextAsync();
		await this.delay(100);

		const nextIndex = this.currentIndex() % this.foodEmojis.length;
		const newFood = {
			...this.foodEmojis[nextIndex],
			position: FoodPosition.Entering,
			id: Date.now()
		};

		const currentFoods = this.visibleFoods();
		const updatedFoods = [
			newFood,
			...currentFoods.map((food) => {
				if (food.position === FoodPosition.Left) {
					return { ...food, position: FoodPosition.Center };
				} else if (food.position === FoodPosition.Center) {
					return { ...food, position: FoodPosition.Right };
				} else if (food.position === FoodPosition.Right) {
					return { ...food, position: FoodPosition.Exiting };
				}
				return food;
			})
		];

		this.visibleFoods.set(updatedFoods);
		this.currentIndex.update((idx) => (idx + 1) % this.foodEmojis.length);
		this.visibleFoods.update((foods) => foods.filter((food) => food.position !== FoodPosition.Exiting));
		this.visibleFoods.update((foods) =>
			foods.map((food) => {
				if (food.position === FoodPosition.Entering) {
					return { ...food, position: FoodPosition.Left };
				}
				return food;
			})
		);

		await this.delay(750);
		const centerFood = updatedFoods.find((food) => food.position === FoodPosition.Center);
		if (centerFood) {
			await this.typeTextAsync(centerFood.name);
		}

		await this.delay(3000);
	}

	delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async typeTextAsync(text: string): Promise<void> {
		return new Promise<void>((resolve) => {
			const currentText = text;
			let i = 0;
			this.textContent.set("");
			this.isTyping = true;

			const intervalId = setInterval(() => {
				if (i < currentText.length) {
					this.textContent.update((text) => text + currentText[i]);
					i++;
				} else {
					clearInterval(intervalId);
					this.isTyping = false;
					resolve();
				}
			}, this.getRandomNumber());
		});
	}

	async deleteTextAsync(): Promise<void> {
		return new Promise<void>((resolve) => {
			const currentText = this.textContent();
			if (currentText.length === 0) {
				resolve();
				return;
			}

			let i = currentText.length;
			this.isTyping = true;

			const intervalId = setInterval(() => {
				this.textContent.update((text) => text.slice(0, -1));
				i--;

				if (i === 0) {
					clearInterval(intervalId);
					this.isTyping = false;
					resolve();
				}
			}, this.getRandomNumber() / 3);
		});
	}

	private getRandomNumber(): number {
		return Math.floor(Math.random() * (70 - 120 + 1)) + 70;
	}
}
