import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export type PromptDialogButtonLayout = "ok" | "yes-no";
export type PromptDialogResult = "ok" | "yes" | "no";

export interface PromptDialogData {
	title: string;
	message: string;
	buttonLayout: PromptDialogButtonLayout;
}

@Component({
	selector: "app-prompt-dialog",
	imports: [MatButtonModule],
	templateUrl: "./prompt-dialog.component.html",
	styleUrl: "./prompt-dialog.component.scss"
})
export class PromptDialogComponent {
	dialogRef = inject<MatDialogRef<PromptDialogComponent>>(MatDialogRef<PromptDialogComponent>);
	data = inject<PromptDialogData>(MAT_DIALOG_DATA, { optional: true });

	onClick(answer: PromptDialogResult) {
		this.dialogRef.close(answer);
	}
}
