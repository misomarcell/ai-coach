import { NutrientTag } from "../models/food.model";

export interface NutrientTagLabel {
	name: NutrientTag;
	label: string;
	color: string;
	effect: "positive" | "negative" | "neutral";
}

const COLOR_POSITIVE = `rgba(45, 225, 50, 0.75)`;
const COLOR_NEUTRAL = `rgba(100, 200, 255, 0.75)`;
const COLOR_NEGATIVE = `rgba(255, 140, 120, 0.75)`;

export const NUTRIENT_TAG_MAP: NutrientTagLabel[] = [
	{
		name: "fat-in-high-quantity",
		label: "High in Fat",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "fat-in-moderate-quantity",
		label: "Moderate in Fat",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "fat-in-low-quantity",
		label: "Low in Fat",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "saturated-fat-in-high-quantity",
		label: "High in Saturated Fat",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "saturated-fat-in-moderate-quantity",
		label: "Moderate in Saturated Fat",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "saturated-fat-in-low-quantity",
		label: "Low in Saturated Fat",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "trans-fat-in-high-quantity",
		label: "High in Trans Fat",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "trans-fat-in-moderate-quantity",
		label: "Moderate in Trans Fat",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "trans-fat-in-low-quantity",
		label: "Low in Trans Fat",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "sugars-in-high-quantity",
		label: "High in Sugar",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "sugars-in-moderate-quantity",
		label: "Moderate in Sugar",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "sugars-in-low-quantity",
		label: "Low in Sugar",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "salt-in-high-quantity",
		label: "High in Salt",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "salt-in-moderate-quantity",
		label: "Moderate in Salt",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "salt-in-low-quantity",
		label: "Low in Salt",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "energy-in-high-quantity",
		label: "High in Energy",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "energy-in-moderate-quantity",
		label: "Moderate in Energy",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "energy-in-low-quantity",
		label: "Low in Energy",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "carbohydrates-in-high-quantity",
		label: "High in Carbohydrates",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "carbohydrates-in-moderate-quantity",
		label: "Moderate in Carbohydrates",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "carbohydrates-in-low-quantity",
		label: "Low in Carbohydrates",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "proteins-in-high-quantity",
		label: "High in Protein",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "proteins-in-moderate-quantity",
		label: "Moderate in Protein",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "proteins-in-low-quantity",
		label: "Low in Protein",
		color: COLOR_NEGATIVE,
		effect: "negative"
	},
	{
		name: "fiber-in-high-quantity",
		label: "High in Fiber",
		color: COLOR_POSITIVE,
		effect: "positive"
	},
	{
		name: "fiber-in-moderate-quantity",
		label: "Moderate in Fiber",
		color: COLOR_NEUTRAL,
		effect: "neutral"
	},
	{
		name: "fiber-in-low-quantity",
		label: "Low in Fiber",
		color: COLOR_NEGATIVE,
		effect: "negative"
	}
];
