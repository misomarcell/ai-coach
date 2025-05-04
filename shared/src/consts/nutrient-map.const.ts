import { NutrientTag } from "../models/food.model";

export interface NutrientTagLabel {
	name: NutrientTag;
	label: string;
	color: string;
}

export const NUTRIENT_TAG_MAP: NutrientTagLabel[] = [
	{
		name: "fat-in-high-quantity",
		label: "High in Fat",
		color: "#f44336" // Red: Negative
	},
	{
		name: "fat-in-moderate-quantity",
		label: "Moderate in Fat",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "fat-in-low-quantity",
		label: "Low in Fat",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "saturated-fat-in-high-quantity",
		label: "High in Saturated Fat",
		color: "#f44336" // Red: Negative
	},
	{
		name: "saturated-fat-in-moderate-quantity",
		label: "Moderate in Saturated Fat",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "saturated-fat-in-low-quantity",
		label: "Low in Saturated Fat",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "trans-fat-in-high-quantity",
		label: "High in Trans Fat",
		color: "#f44336" // Red: Negative
	},
	{
		name: "trans-fat-in-moderate-quantity",
		label: "Moderate in Trans Fat",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "trans-fat-in-low-quantity",
		label: "Low in Trans Fat",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "sugars-in-high-quantity",
		label: "High in Sugar",
		color: "#f44336" // Red: Negative
	},
	{
		name: "sugars-in-moderate-quantity",
		label: "Moderate in Sugar",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "sugars-in-low-quantity",
		label: "Low in Sugar",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "salt-in-high-quantity",
		label: "High in Salt",
		color: "#f44336" // Red: Negative
	},
	{
		name: "salt-in-moderate-quantity",
		label: "Moderate in Salt",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "salt-in-low-quantity",
		label: "Low in Salt",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "energy-in-high-quantity",
		label: "High in Energy",
		color: "#f44336" // Red: Negative
	},
	{
		name: "energy-in-moderate-quantity",
		label: "Moderate in Energy",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "energy-in-low-quantity",
		label: "Low in Energy",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "carbohydrates-in-high-quantity",
		label: "High in Carbohydrates",
		color: "#f44336" // Red: Negative
	},
	{
		name: "carbohydrates-in-moderate-quantity",
		label: "Moderate in Carbohydrates",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "carbohydrates-in-low-quantity",
		label: "Low in Carbohydrates",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "proteins-in-high-quantity",
		label: "High in Protein",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "proteins-in-moderate-quantity",
		label: "Moderate in Protein",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "proteins-in-low-quantity",
		label: "Low in Protein",
		color: "#f44336" // Red: Negative
	},
	{
		name: "fiber-in-high-quantity",
		label: "High in Fiber",
		color: "#4caf50" // Green: Positive
	},
	{
		name: "fiber-in-moderate-quantity",
		label: "Moderate in Fiber",
		color: "#2196f3" // Blue: Neutral
	},
	{
		name: "fiber-in-low-quantity",
		label: "Low in Fiber",
		color: "#f44336" // Red: Negative
	}
];
