export enum ConnectorErrorType {
	LoginError = "LoginError",
	DownloadError = "DownloadError"
}

export enum DiaryGroup {
	Breakfast = "Breakfast",
	Lunch = "Lunch",
	Dinner = "Dinner",
	Snacks = "Snacks"
}

export interface Ingredient {
	name: string;
	amount: number;
}

export interface Nutrition {
	name: string;
	amount: string | number;
	unit: string;
}

export interface CustomFood {
	name: string;
	ingredients: Ingredient[];
	nutritions: Nutrition[];
}
