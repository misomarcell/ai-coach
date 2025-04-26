import { Analysis } from "@aicoach/shared";
import { ResolveFn, Router } from "@angular/router";
import { AnalysisService } from "../services/analysis.service";
import { inject } from "@angular/core";

export const analysisResolver: ResolveFn<Analysis | undefined> = (route, _state) => {
	const router = inject(Router);
	const analysisService = inject(AnalysisService);
	const analysisId = route.paramMap.get("analysisId");
	if (!analysisId) {
		router.navigate(["/not-found"]);

		return;
	}

	return analysisService.getAnalysis(analysisId);
};
