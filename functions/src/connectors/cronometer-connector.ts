import path from "path";
import { logger } from "firebase-functions";
import { Browser, BrowserContext, Page, chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";
import { CronometerFoodRequestDb } from "@aicoach/shared";
import { ConnectorErrorType, DiaryGroup, Nutrition } from "../models/cronometer-connector.model";
import fileReader from "../file-reader";

export class ConnectorError extends Error {
	type: ConnectorErrorType;

	constructor(message: string, type: ConnectorErrorType) {
		super(message);
		this.type = type;
	}
}

export class CronometerConnector {
	private browser: Browser | undefined;
	private context: BrowserContext | undefined;
	private page: Page | undefined;

	async init(): Promise<void> {
		const executablePath = await chromium.executablePath();
		logger.log(`🚀 Launching Playwright with Chromium @ ${executablePath} | Firebase emulator: ${process.env.FUNCTIONS_EMULATOR}`);
		this.browser = process.env.FUNCTIONS_EMULATOR
			? await playwright.launch({ headless: true })
			: await playwright.launch({
				executablePath,
				args: chromium.args,
				headless: true
			  });

		this.context = await this.browser.newContext({
			viewport: chromium.defaultViewport,
			acceptDownloads: true
		});

		process.on("exit", async () => {
			if (this.browser) {
				await this.browser.close();
			}
		});

		this.page = await this.context.newPage();
		logger.log("🎭 Initialized Playwright Page");
	}

	async close(): Promise<void> {
		await this.browser?.close();
	}

	async login(username: string, password: string): Promise<void> {
		if (!this.page) {
			logger.error("Page not initialized");
			await this.browser?.close();
			throw new Error("Page not initialized");
		}

		await this.page.goto("https://cronometer.com/login/", {
			waitUntil: "networkidle"
		});

		await this.page.fill("#username", username);
		await this.page.fill("#password", password);
		await this.page.click("#login-button");
		await this.page.waitForTimeout(500);

		const loginError = await this.page.evaluate(() => document.querySelector("#email_error")?.textContent);
		if (loginError) {
			await this.browser?.close();
			throw new ConnectorError(loginError, ConnectorErrorType.LoginError);
		}
	}

	async exportData(): Promise<void> {
		if (!this.page || !this.browser) {
			logger.error("Page or Browser was not initialized");
			await this.browser?.close();
			throw new Error("Page or Browser was not initialized");
		}

		await this.page.goto("https://cronometer.com/#account", {
			waitUntil: "domcontentloaded"
		});

		const exportDataButton = await this.page.getByRole("button", {
			name: "Export Data"
		});
		await exportDataButton.click();

		const popup = await this.page.locator("div.popupContent");
		const dropdownItems = await popup.locator("div.dropdown-menu a.dropdown-item");
		const allTimeOption = await dropdownItems.filter({ hasText: "All Time" });
		await allTimeOption.evaluate((el) => (el as HTMLButtonElement)?.click());

		const exportFoodButton = await this.page.getByRole("button", {
			name: "Export Food & Recipe Entries"
		});

		const downloadPromise = this.page.waitForEvent("download");
		await exportFoodButton.click();

		const download = await downloadPromise;
		await download.saveAs(path.join(fileReader.getDownloadFolder(), download.suggestedFilename()));
		await this.browser.close();
	}

	/**
	 * @deprecated Do not use
	 */
	async addCustomFood(request: CronometerFoodRequestDb, diaryGroup: DiaryGroup): Promise<void> {
		if (!this.page || !this.browser) {
			await this.browser?.close();
			throw new Error("Page not initialized");
		}

		await this.page.goto("https://cronometer.com/#custom-foods", {
			waitUntil: "domcontentloaded"
		});
		await this.page.evaluate(() => localStorage.setItem("lastSelectedLabel", "EU"));

		logger.info("Adding custom food ", request.food.name);

		const addFoodButton = await this.page.getByRole("button", {
			name: "ADD FOOD"
		});
		await addFoodButton.click();

		const mainFoodInfoArea = await this.page.locator("#main-food-editor-info-area");
		const foodNameDiv = await mainFoodInfoArea.locator("div", { has: this.page.locator("div", { hasText: "Food Name" }) });
		for (let i = 0; i < 10; i++) {
			await foodNameDiv.locator("input").press("Delete");
		}
		await foodNameDiv.locator("input").pressSequentially(request.food.name);

		const prettyDateToday = new Date().toISOString().split("T")[0];
		const note = `${request.food.ingredients
			.map((i) => `${i.amount}g ${i.name}`)
			.join(", ")} - Created by KombuchAI / ${prettyDateToday}.`;
		const notesDiv = await mainFoodInfoArea.locator("div", { has: this.page.locator("span.label", { hasText: "Notes" }) });
		await notesDiv.locator("textarea").fill(note);

		for (const nutrition of request.food.nutritions) {
			await this.fillNutritionAmount({ name: nutrition.name, amount: nutrition.amount, unit: nutrition.unit });
		}

		logger.info("Custom food data filled. Now saving...");

		const saveChangesButton = await this.page.getByRole("button", { name: "Save Changes" });
		await saveChangesButton.click();

		const addToDiaryButton = await this.page.getByRole("button", { name: "Add to Diary" });
		await addToDiaryButton.click();

		const prettyDialog = await this.page.locator("div.pretty-dialog");
		const diaryGroupOption = await prettyDialog.locator(".dropdown-menu .dropdown-item", { hasText: diaryGroup });
		await diaryGroupOption.evaluate((el) => (el as HTMLButtonElement)?.click());

		const addFoodToDiaryButton = await prettyDialog.locator("button", { hasText: "Add to Diary" });
		await addFoodToDiaryButton.click();

		logger.log(`Custom food '${request.food.name}' added to diary`);
		await this.browser.close();
	}

	private async fillNutritionAmount(nutrition: Nutrition): Promise<void> {
		if (!this.page) {
			throw new Error("Page not initialized");
		}

		logger.info(`Adding nutrition: ${nutrition.name} Amount: ${nutrition.amount} Unit: ${nutrition.unit}`);
		const tables = this.page.locator("table.crono-table").filter({ visible: true });
		const row = tables
			.getByRole("row")
			.filter({ hasText: nutrition.name, visible: true })
			.filter({ hasText: nutrition.unit, visible: true });
		const inputRow = row.getByRole("cell").nth(1);
		await inputRow.click();
		await inputRow.locator("input").fill(`${nutrition.amount}`);
	}
}

export default new CronometerConnector();
