import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable, take } from "rxjs";
import {
	PromptDialogButtonLayout,
	PromptDialogComponent,
	PromptDialogData,
	PromptDialogResult
} from "../prompt-dialog/prompt-dialog.component";

@Injectable({
	providedIn: "root"
})
export class PromptService {
	private dialog = inject(MatDialog);

	prompt(title: string, message: string, buttonLayout: PromptDialogButtonLayout): Observable<PromptDialogResult | undefined> {
		const dialogRef = this.dialog.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: { title, message, buttonLayout }
		});

		return dialogRef.afterClosed().pipe(take(1));
	}
}
